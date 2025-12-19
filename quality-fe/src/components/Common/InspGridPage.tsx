import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Stack,
  Button,
  Typography,
  CircularProgress,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemText,
  OutlinedInput,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import {
  DataGrid,
  type GridColDef,
  type GridRowId,
  type GridPaginationModel,
  type GridSortModel,
} from "@mui/x-data-grid";
import dayjs, { Dayjs } from "dayjs";
import minMax from "dayjs/plugin/minMax";
import "dayjs/locale/ko";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { ExcelDownloadButton } from "../Common/ExcelDownloadButton";
import { useAlert } from "../../context/AlertContext";
import { formatDateRange } from "../../utils/Common/formatDateRange";
import { extractErrorMessage } from "../../utils/Common/extractError";
import { RowSelectionModelV8 } from "../../types/common";

dayjs.locale("ko");
dayjs.extend(minMax);

type WithId = { id: string | number };
type WithInspector = { inspector?: unknown };
type SortableRowBase = WithId & Record<string, unknown>;

export type InspGridPageConfig<
  Kind extends string,
  ServerRow,
  FrontRow extends WithId & WithInspector,
  ExcelRow extends WithId & WithInspector
> = {
  // kind/경로
  kindFromPath: (pathname: string) => Kind;
  pathname: string;

  // API
  fetcher: (sendData: string) => Promise<ServerRow[] | undefined | null>;
  buildSendData: (kind: Kind, s: string, e: string) => string;

  // 변환/컬럼
  transformRows: (raw: ServerRow[], kind: Kind) => FrontRow[];
  getColumns: (kind: Kind) => GridColDef[];
  getSelectedColumns: (kind: Kind) => GridColDef[];

  mapExcludedRow?: (row: FrontRow, kind: Kind) => FrontRow;
  mapSelectedBase?: (rows: FrontRow[], kind: Kind) => ExcelRow[];
  toExcelRow?: (row: ExcelRow, no: number) => ExcelRow;

  // 엑셀 옵션
  excel: {
    filename: (kind: Kind) => string;
    kindProp?: (kind: Kind) => string;
    headerTitle: (kind: Kind) => string;
    showApprovalLine?: boolean;
    label?: string;
  };

  // 그리드 옵션
  pageSize?: number;
  previewPageSize?: number;

  inspectionType?: InspectionType;
};

type InspectionType =
  | "mtr" // 원자재 수입검사
  | "prcs" // 순회검사
  | "final" // 완제품
  | "initFinal" // 초종품
  | "other";

function keepRight15(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = String(v).trim();
  return s.length > 15 ? s.slice(-15) : s;
}

function normalizeHeader(v: string | undefined): string {
  return (v ?? "").toUpperCase().replace(/\s+/g, "");
}

function isNumberLike(v: unknown) {
  if (v == null) return false;
  const s = String(v).trim();
  if (!s) return false;
  return !Number.isNaN(Number(s));
}

function compareValues(a: unknown, b: unknown) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  if (isNumberLike(a) && isNumberLike(b)) {
    const na = Number(String(a).trim());
    const nb = Number(String(b).trim());
    return na === nb ? 0 : na < nb ? -1 : 1;
  }

  if (a instanceof Date && b instanceof Date) {
    const ta = a.getTime();
    const tb = b.getTime();
    return ta === tb ? 0 : ta < tb ? -1 : 1;
  }

  return String(a).localeCompare(String(b), "ko");
}

function getSortValue<Row extends SortableRowBase>(
  row: Row,
  col: GridColDef
): unknown {
  const raw = row[col.field];

  const vg = col.valueGetter;
  if (typeof vg !== "function") return raw;

  const fn = vg as unknown as (...args: unknown[]) => unknown;

  const params = {
    id: row.id,
    field: col.field,
    row,
    value: raw,
    api: undefined as unknown,
  };

  try {
    if (fn.length >= 2) return fn(raw, row, col, undefined);
    return fn(params);
  } catch {
    return raw;
  }
}

function sortRowsByModel<Row extends SortableRowBase>(
  rows: readonly Row[],
  sortModel: GridSortModel,
  columns: readonly GridColDef[]
): Row[] {
  if (sortModel.length === 0) return [...rows];

  const columnMap = new Map(columns.map((c) => [c.field, c]));
  const indexed = rows.map((row, index) => ({ row, index }));

  indexed.sort((a, b) => {
    for (const { field, sort } of sortModel) {
      const col = columnMap.get(field);
      if (!col) continue;

      const av = getSortValue(a.row, col);
      const bv = getSortValue(b.row, col);

      const cmp = compareValues(av, bv);
      if (cmp !== 0) return sort === "desc" ? -cmp : cmp;
    }
    return a.index - b.index;
  });

  return indexed.map((x) => x.row);
}

export function InspGridPage<
  Kind extends string,
  ServerRow,
  FrontRow extends WithId & WithInspector,
  ExcelRow extends WithId & WithInspector
>(props: InspGridPageConfig<Kind, ServerRow, FrontRow, ExcelRow>) {
  const {
    kindFromPath,
    pathname,
    fetcher,
    buildSendData,
    transformRows,
    getColumns,
    getSelectedColumns,
    mapExcludedRow,
    mapSelectedBase,
    toExcelRow,
    excel,
    pageSize = 5,
    previewPageSize = 5,
  } = props;

  type ExcelSortableRow = ExcelRow & Record<string, unknown>;

  const effectiveKind = useMemo(
    () => kindFromPath(pathname),
    [kindFromPath, pathname]
  );

  const [rawServerData, setRawServerData] = useState<ServerRow[]>([]);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize,
  });
  const [rowSelectionModel, setRowSelectionModel] =
    useState<RowSelectionModelV8>({
      type: "include",
      ids: new Set(),
    });
  const [previewSortModel, setPreviewSortModel] = useState<GridSortModel>([]);

  const [startDate, setStartDate] = useState<Dayjs | null>(
    dayjs().startOf("month")
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [loading, setLoading] = useState(false);

  const reqSeq = useRef(0);
  const { showAlert } = useAlert();

  const [selectedInspectors, setSelectedInspectors] = useState<string[]>([]);

  const inspectionType = props.inspectionType ?? "other";

  const approvalWch = useMemo<[number, number, number, number]>(() => {
    // 원자재 수입검사
    if (inspectionType === "mtr") {
      if (effectiveKind === "st") return [9.1, 9.7, 9.7, 9.7];
      if (effectiveKind === "pvc") return [6.1, 9.9, 9.9, 9.9];
      if (effectiveKind === "scr") return [9.1, 9.1, 9.1, 8.1];
    }

    // 순회검사
    if (inspectionType === "prcs") {
      if (effectiveKind === "st") return [7.8, 8.2, 8.2, 8.2];
      if (effectiveKind === "dr") return [10.1, 11.2, 11.2, 11.2];
    }

    // 초종품 검사
    if (inspectionType === "initFinal") {
      if (effectiveKind === "wx") return [9.7, 9.7, 9.7, 9.7];
      if (effectiveKind === "whex") return [10.7, 10.7, 10.7, 10.7];
      if (effectiveKind === "whbs") return [8.5, 8.5, 8.5, 8.5];
    }

    // 완제품 검사
    if (inspectionType === "final") {
      if (effectiveKind === "wx") return [8.2, 8.2, 8.2, 8.2];
      if (effectiveKind === "we") return [5.8, 10.7, 10.7, 10.7];
    }
    return [10, 10, 10, 10];
  }, [effectiveKind, inspectionType]);

  // -------------------- 최종 컬럼 --------------------
  const columns: GridColDef[] = useMemo(
    () => getColumns(effectiveKind),
    [getColumns, effectiveKind]
  );
  const selectedColumns: GridColDef[] = useMemo(
    () => getSelectedColumns(effectiveKind),
    [getSelectedColumns, effectiveKind]
  );

  // -------------------- rows 변환 --------------------
  const rows = useMemo<FrontRow[]>(
    () => transformRows(rawServerData, effectiveKind),
    [rawServerData, effectiveKind, transformRows]
  );

  // -------------------- 선택 행 계산 --------------------
  const selectedRows = useMemo(() => {
    const baseSelected =
      rowSelectionModel.type === "include"
        ? rows.filter((r) => rowSelectionModel.ids.has(r.id as GridRowId))
        : rows
            .filter((r) => !rowSelectionModel.ids.has(r.id as GridRowId))
            .map((r) =>
              mapExcludedRow ? mapExcludedRow(r, effectiveKind) : r
            );

    const afterKind = mapSelectedBase
      ? mapSelectedBase(baseSelected, effectiveKind)
      : (baseSelected as unknown as ExcelRow[]);

    return afterKind.map((r, idx) =>
      toExcelRow ? toExcelRow(r, idx + 1) : { ...r, no: idx + 1 }
    );
  }, [
    rows,
    rowSelectionModel,
    effectiveKind,
    mapExcludedRow,
    mapSelectedBase,
    toExcelRow,
  ]);

  // -------------------- 선택된 행에서 검사자 목록 추출 --------------------
  const inspectorOptions = useMemo(() => {
    const set = new Set<string>();
    selectedRows.forEach((r) => {
      const name = r.inspector;
      if (name) set.add(String(name));
    });
    return Array.from(set);
  }, [selectedRows]);

  const handleInspectorSelectChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[] | string;
    setSelectedInspectors(typeof value === "string" ? value.split(",") : value);
  };

  // -------------------- 엑셀 헤더에 들어갈 검사자 --------------------
  const inspectorNameText = useMemo(() => {
    if (selectedInspectors.length > 0) return selectedInspectors.join(", ");
    if (inspectorOptions.length === 1) return inspectorOptions[0];
    return "";
  }, [selectedInspectors, inspectorOptions]);

  // -------------------- 엑셀 다운로드 전 검사자 선택 체크 --------------------
  const handleBeforeExcelDownload = () => {
    if (inspectorOptions.length >= 2 && !inspectorNameText) {
      showAlert({ message: "검사자를 선택해 주세요.", severity: "warning" });
      return false;
    }
    return true;
  };

  // -------------------- 엑셀 다운로드 + 프리뷰용 선택 행 --------------------
  const selectedRowsForExcelBase = useMemo<ExcelSortableRow[]>(() => {
    let base: ExcelSortableRow[] = selectedRows as ExcelSortableRow[];

    if (inspectorOptions.length >= 2 && selectedInspectors.length > 0) {
      base = (selectedRows as ExcelSortableRow[]).filter((r) => {
        const inspectorKey = String(r.inspector ?? "").trim();
        return selectedInspectors.includes(inspectorKey);
      });
    }

    if (effectiveKind === "pvc" || effectiveKind === "scr") {
      const lotCol = selectedColumns.find((c) => {
        const h = normalizeHeader(
          typeof c.headerName === "string" ? c.headerName : c.field
        );
        return h === "LOTNO";
      });

      const lotField = lotCol?.field;

      if (lotField) {
        base = base.map((r) => ({
          ...r,
          [lotField]: keepRight15(
            (r as Record<string, string | number | null | undefined>)[lotField]
          ),
        }));
      }
    }

    return base;
  }, [
    selectedRows,
    inspectorOptions.length,
    selectedInspectors,
    effectiveKind,
    selectedColumns,
  ]);

  const selectedRowsForExcelSorted = useMemo<ExcelSortableRow[]>(() => {
    return sortRowsByModel(
      selectedRowsForExcelBase,
      previewSortModel,
      selectedColumns
    );
  }, [selectedRowsForExcelBase, previewSortModel, selectedColumns]);

  const selectedRowsForExcel = useMemo(() => {
    return selectedRowsForExcelSorted.map((r, idx) =>
      toExcelRow ? toExcelRow(r, idx + 1) : { ...r, no: idx + 1 }
    );
  }, [selectedRowsForExcelSorted, toExcelRow]);

  // -------------------- 조회 버튼 --------------------
  async function handleSearch() {
    if (!startDate || !endDate) return;

    const s = dayjs.min(startDate, endDate).format("YYYY-MM-DD");
    const e = dayjs.max(startDate, endDate).format("YYYY-MM-DD");
    const sendData = buildSendData(effectiveKind, s, e);

    const mySeq = reqSeq.current;
    setLoading(true);

    try {
      const data = await fetcher(sendData);
      if (reqSeq.current !== mySeq) return;

      setRawServerData((data ?? []) as ServerRow[]);
      setRowSelectionModel({ type: "include", ids: new Set() });
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
      setSelectedInspectors([]);
    } catch (err) {
      if (reqSeq.current !== mySeq) return;

      const msg = extractErrorMessage(err);
      showAlert({
        message: msg || "조회 중 오류가 발생했습니다.",
        severity: "error",
      });

      setRawServerData([]);
      setSelectedInspectors([]);
    } finally {
      if (reqSeq.current === mySeq) setLoading(false);
    }
  }

  // kind 바뀔 때 초기화
  useEffect(() => {
    reqSeq.current += 1;
    setRawServerData([]);
    setRowSelectionModel({ type: "include", ids: new Set() });
    setPaginationModel({ page: 0, pageSize });
    setLoading(false);
    setSelectedInspectors([]);
  }, [effectiveKind, pageSize]);

  // selectedRows가 바뀔 때 검사자 선택 초기화
  useEffect(() => {
    setSelectedInspectors([]);
  }, [selectedRows.length]);

  useEffect(() => {
    setPreviewSortModel([]);
  }, [effectiveKind]);

  return (
    <Box
      sx={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        marginLeft: "50px",
        gap: 2,
        width: "90%",
        maxWidth: "100%",
        minWidth: 0,
        minHeight: 0,
      }}
    >
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ko">
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ gap: 1, flexWrap: "wrap", width: 1 }}
        >
          {/* 날짜 + 조회 */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ flexWrap: "wrap", rowGap: 1 }}
          >
            <DatePicker
              label="시작일"
              value={startDate}
              onChange={setStartDate}
              format="YYYY-MM-DD"
              slotProps={{ textField: { size: "small" } }}
            />
            <DatePicker
              label="종료일"
              value={endDate}
              onChange={setEndDate}
              format="YYYY-MM-DD"
              slotProps={{ textField: { size: "small" } }}
            />
            <Button
              variant="outlined"
              onClick={handleSearch}
              disabled={loading || !startDate || !endDate}
            >
              {loading ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
              조회
            </Button>
          </Stack>

          {/* 엑셀 다운로드 */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography color="text.secondary">
              선택된 행: {selectedRows.length}개
            </Typography>

            {/* 검사자 선택 Select + 체크박스 */}
            {inspectorOptions.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel
                  id="inspector-select-label"
                  sx={{ fontSize: "14px" }}
                >
                  검사자 선택
                </InputLabel>
                <Select
                  labelId="inspector-select-label"
                  multiple
                  label="검사자 선택"
                  value={selectedInspectors}
                  onChange={handleInspectorSelectChange}
                  input={<OutlinedInput label="검사자 선택" />}
                  renderValue={(selected) => (selected as string[]).join(", ")}
                  sx={{ fontSize: "14px", height: "36px" }}
                  MenuProps={{
                    PaperProps: {
                      sx: { "& .MuiMenuItem-root": { fontSize: "14px" } },
                    },
                  }}
                >
                  {inspectorOptions.map((name) => (
                    <MenuItem key={name} value={name}>
                      <Checkbox
                        size="small"
                        checked={selectedInspectors.indexOf(name) > -1}
                        sx={{ padding: "2px" }}
                      />
                      <ListItemText
                        primary={name}
                        primaryTypographyProps={{ fontSize: "14px" }}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <ExcelDownloadButton
              data={selectedRowsForExcel}
              columns={selectedColumns}
              filename={excel.filename(effectiveKind)}
              kind={excel.kindProp ? excel.kindProp(effectiveKind) : ""}
              label={excel.label ?? "엑셀 다운로드"}
              buttonProps={{ variant: "contained" }}
              onBeforeDownload={handleBeforeExcelDownload}
              headerOptions={{
                title: excel.headerTitle(effectiveKind),
                inspectDateText: formatDateRange(startDate, endDate),
                inspectorNameText,
                showApprovalLine: excel.showApprovalLine ?? true,
              }}
              approvalWch={approvalWch}
            />
          </Stack>
        </Stack>
      </LocalizationProvider>

      {/* 메인 그리드 */}
      <Box sx={{ flex: 1, minWidth: 0, minHeight: 0 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          checkboxSelection
          disableRowSelectionOnClick
          pagination
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          rowSelectionModel={rowSelectionModel}
          onRowSelectionModelChange={setRowSelectionModel}
          loading={loading}
          sx={{
            width: 1,
            height: 1,
            minWidth: 0,
            minHeight: 0,
            marginBottom: "20px",
          }}
        />
      </Box>

      {/* 선택 행 미리보기 */}
      <Box sx={{ flex: 1, minWidth: 0, overflow: "auto", mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          선택한 행 미리보기
        </Typography>
        <DataGrid
          rows={selectedRowsForExcel}
          columns={selectedColumns}
          pagination
          sortModel={previewSortModel}
          onSortModelChange={setPreviewSortModel}
          sortingMode="client"
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: previewPageSize },
            },
          }}
          hideFooterSelectedRowCount
        />
      </Box>
    </Box>
  );
}
