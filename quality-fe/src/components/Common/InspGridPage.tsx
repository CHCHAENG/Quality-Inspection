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
import {
  InspGridPageConfig,
  RowSelectionModelV8,
  WithId,
  WithInspector,
} from "../../types/common";
import { withDecimalFormatter } from "../../utils/Common/numberFormat";
import { excelOptions } from "../../utils/Common/excelOptions";
import {
  formatRowsForExcel,
  keepRight15,
  normalizeHeader,
  sortRowsByModel,
} from "../../utils/Common/inspGrid";

dayjs.locale("ko");
dayjs.extend(minMax);

export function InspGridPage<
  Kind extends string,
  ServerRow,
  FrontRow extends WithId & WithInspector,
  ExcelRow extends WithId & WithInspector,
>(props: InspGridPageConfig<Kind, ServerRow, FrontRow, ExcelRow>) {
  const {
    kindFromPath,
    pathname,
    fetcher,
    buildSendData,
    transformRows,
    getColumns,
    getSelectedColumns,
    mapSelectedBase,
    toExcelRow,
    excel,
    pageSize = 5,
    previewPageSize = 5,
  } = props;

  type ExcelSortableRow = ExcelRow & Record<string, unknown>;

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
    dayjs().startOf("month"),
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [loading, setLoading] = useState(false);

  const reqSeq = useRef(0);
  const { showAlert } = useAlert();

  const [selectedInspectors, setSelectedInspectors] = useState<string[]>([]);

  // -------------------- 기준값 --------------------
  const effectiveKind = useMemo(
    () => kindFromPath(pathname),
    [kindFromPath, pathname],
  );
  const inspectionType = props.inspectionType ?? "other";

  // -------------------- rows 변환 --------------------
  const rows = useMemo<FrontRow[]>(
    () => transformRows(rawServerData, effectiveKind),
    [rawServerData, effectiveKind, transformRows],
  );

  // -------------------- 컬럼  --------------------
  const columns: GridColDef[] = useMemo(() => {
    const base = getColumns(effectiveKind);
    return withDecimalFormatter(
      base,
      rows as unknown as Record<string, unknown>[],
    );
  }, [getColumns, effectiveKind, rows]);

  const selectedColumns: GridColDef[] = useMemo(() => {
    const base = getSelectedColumns(effectiveKind);
    return withDecimalFormatter(
      base,
      rows as unknown as Record<string, unknown>[],
    );
  }, [getSelectedColumns, effectiveKind, rows]);

  // -------------------- 선택 행 계산 --------------------
  const selectedRows = useMemo(() => {
    const baseSelected =
      rowSelectionModel.type === "include"
        ? rows.filter((r) => rowSelectionModel.ids.has(r.id as GridRowId))
        : rows.filter((r) => !rowSelectionModel.ids.has(r.id as GridRowId));

    const afterKind = mapSelectedBase
      ? mapSelectedBase(baseSelected, effectiveKind)
      : (baseSelected as unknown as ExcelRow[]);

    return afterKind.map((r, idx) =>
      toExcelRow ? toExcelRow(r, idx + 1) : { ...r, no: idx + 1 },
    );
  }, [rows, rowSelectionModel, effectiveKind, mapSelectedBase, toExcelRow]);

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

    // pvc/scr LOTNO 15자리
    if (effectiveKind === "pvc" || effectiveKind === "scr") {
      const lotCol = selectedColumns.find((c) => {
        const h = normalizeHeader(
          typeof c.headerName === "string" ? c.headerName : c.field,
        );
        return h === "LOTNO";
      });

      const lotField = lotCol?.field;

      if (lotField) {
        base = base.map((r) => ({
          ...r,
          [lotField]: keepRight15(
            (r as Record<string, string | number | null | undefined>)[lotField],
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
      selectedColumns,
    );
  }, [selectedRowsForExcelBase, previewSortModel, selectedColumns]);

  const selectedRowsForExcel = useMemo(() => {
    return selectedRowsForExcelSorted.map((r, idx) =>
      toExcelRow ? toExcelRow(r, idx + 1) : { ...r, no: idx + 1 },
    );
  }, [selectedRowsForExcelSorted, toExcelRow]);

  const selectedRowsForExcelFormatted = useMemo(() => {
    return formatRowsForExcel(
      selectedRowsForExcel as unknown as Record<string, unknown>[],
      selectedColumns,
    );
  }, [selectedRowsForExcel, selectedColumns]);

  // -------------------- 엑셀 옵션--------------------
  const excelOptionsMemo = useMemo(
    () => excelOptions(inspectionType, effectiveKind),
    [inspectionType, effectiveKind],
  );

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
              data={selectedRowsForExcelFormatted}
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
              excelOptions={excelOptionsMemo}
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
