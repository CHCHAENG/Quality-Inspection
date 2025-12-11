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
} from "@mui/x-data-grid";
import {
  transformServerData,
  type ServerRow,
  type FrontRow,
  type ItemKind,
} from "../../utils/InspDataTrans/mtrInspTrans";
import dayjs, { Dayjs } from "dayjs";
import minMax from "dayjs/plugin/minMax";
import "dayjs/locale/ko";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { mtrInsp } from "../../api/api";
import { extractErrorMessage } from "../../utils/Common/extractError";
import { useLocation } from "react-router-dom";
import { splitItemNameAndColor } from "../../utils/SelectedRow/mtrInsp";
import { ExcelDownloadButton } from "../Common/ExcelDownloadButton";
import { useAlert } from "../../context/AlertContext";
import { formatDateRange } from "../../utils/Common/formatDateRange";
import {
  getMtrInspColumns,
  getMtrInspSelectedColumns,
} from "../../utils/Columns/mtrInspColumns";
import { RowSelectionModelV8 } from "../../types/common";

dayjs.locale("ko");
dayjs.extend(minMax);

// -------------------- 경로 기반 kind 판별 --------------------
function kindFromPath(pathname: string): ItemKind {
  const p = pathname.toLowerCase();
  if (p.includes("pvc")) return "pvc";
  if (p.includes("scr")) return "scr";
  if (p.includes("st")) return "st";
  return "st";
}

// -------------------- sendData --------------------
function buildSendDataForST(s: string, e: string) {
  // ITM_GRP=24 (연선)
  return `${s};${e};24;0;ST-00-01:1!ST-01-01:1!ST-02-01:1!ST-03-01:1!ST-03-02:1!ST-04-01:1!ST-05-01:1!ST-05-01:2!ST-05-01:3!ST-05-01:4!;`;
}
function buildSendDataForPVC(s: string, e: string) {
  // ITM_GRP=22 (PVC)
  return `${s};${e};22;0;PVC-01-01:1!PVC-02-01:1!PVC-03-01:1!;`;
}
function buildSendDataForSCR(s: string, e: string) {
  // ITM_GRP=21 (SCR)
  return `${s};${e};21;0;CU-00-01:1!CU-01-01:1!CU-01-01:2!CU-01-01:3!CU-01-01:4!CU-02-01:1!;`;
}

function buildSendDataString(kind: ItemKind, s: string, e: string) {
  if (kind === "pvc") return buildSendDataForPVC(s, e);
  if (kind === "scr") return buildSendDataForSCR(s, e);
  return buildSendDataForST(s, e);
}

export default function MtrInspDataGrid() {
  const location = useLocation();
  const effectiveKind = useMemo<ItemKind>(
    () => kindFromPath(location.pathname),
    [location.pathname]
  );

  const [rawServerData, setRawServerData] = useState<ServerRow[]>([]);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 5,
  });
  const [rowSelectionModel, setRowSelectionModel] =
    useState<RowSelectionModelV8>({
      type: "include",
      ids: new Set(),
    });
  const [startDate, setStartDate] = useState<Dayjs | null>(
    dayjs().startOf("month")
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [loading, setLoading] = useState(false);

  const reqSeq = useRef(0);

  const { showAlert } = useAlert();

  const [selectedInspectors, setSelectedInspectors] = useState<string[]>([]);

  // -------------------- 컬럼 (모델에서 가져오기) --------------------
  const columns: GridColDef[] = useMemo(
    () => getMtrInspColumns(effectiveKind),
    [effectiveKind]
  );

  const selectedColumns: GridColDef[] = useMemo(
    () => getMtrInspSelectedColumns(effectiveKind),
    [effectiveKind]
  );

  // -------------------- rows 변환 --------------------
  const rows = useMemo<FrontRow[]>(
    () => transformServerData(rawServerData, effectiveKind),
    [rawServerData, effectiveKind]
  );

  // -------------------- 선택 행 계산 --------------------
  const selectedRows = useMemo(() => {
    const filtered =
      rowSelectionModel.type === "include"
        ? rows.filter((r) => rowSelectionModel.ids.has(r.id as GridRowId))
        : rows.filter((r) => !rowSelectionModel.ids.has(r.id as GridRowId));

    const base =
      effectiveKind === "pvc" ? filtered.map(splitItemNameAndColor) : filtered;

    return base.map((r, idx) => ({ ...r, no: idx + 1 }));
  }, [rows, rowSelectionModel, effectiveKind]);

  // -------------------- 선택된 행에서 검사자 목록 추출 --------------------
  const inspectorOptions = useMemo(() => {
    const set = new Set<string>();
    selectedRows.forEach((r) => {
      const name = r.inspector;
      if (name) {
        set.add(String(name));
      }
    });
    return Array.from(set);
  }, [selectedRows]);

  const handleInspectorSelectChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[] | string;
    setSelectedInspectors(typeof value === "string" ? value.split(",") : value);
  };

  // 엑셀 헤더에 들어갈 검사자
  const inspectorNameText = useMemo(() => {
    if (selectedInspectors.length > 0) {
      return selectedInspectors.join(", ");
    }
    if (inspectorOptions.length === 1) {
      return inspectorOptions[0];
    }
    return "";
  }, [selectedInspectors, inspectorOptions]);

  // 엑셀 다운로드 전 검사자 선택 체크
  const handleBeforeExcelDownload = () => {
    if (inspectorOptions.length >= 2 && !inspectorNameText) {
      showAlert({
        message: "검사자를 선택해 주세요.",
        severity: "warning",
      });
      return false;
    }
    return true;
  };

  // -------------------- 엑셀 다운로드 + 프리뷰용 선택 행 --------------------
  const selectedRowsForExcel = useMemo(() => {
    let base = selectedRows;

    // 특정 검사자를 선택한 경우 필터링
    if (inspectorOptions.length >= 2 && selectedInspectors.length > 0) {
      base = selectedRows.filter((r) => {
        const inspectorKey = String(r.inspector ?? "").trim();
        return selectedInspectors.includes(inspectorKey);
      });
    }

    return base.map((r, idx) => ({
      ...r,
      no: idx + 1,
    }));
  }, [selectedRows, inspectorOptions.length, selectedInspectors]);

  // -------------------- 조회 버튼 --------------------
  async function handleSearch() {
    if (!startDate || !endDate) return;

    const s = dayjs.min(startDate, endDate).format("YYYY-MM-DD");
    const e = dayjs.max(startDate, endDate).format("YYYY-MM-DD");
    const sendData = buildSendDataString(effectiveKind, s, e);

    const mySeq = reqSeq.current;

    setLoading(true);
    try {
      const data = await mtrInsp(sendData);
      if (reqSeq.current !== mySeq) return;

      setRawServerData(data ?? []);
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

  // kind 바뀔 때 상태 초기화
  useEffect(() => {
    reqSeq.current += 1;
    setRawServerData([]);
    setRowSelectionModel({ type: "include", ids: new Set() });
    setPaginationModel({ page: 0, pageSize: 5 });
    setLoading(false);
    setSelectedInspectors([]);
  }, [effectiveKind]);

  // selectedRows 바뀔 때 검사자 선택 초기화
  useEffect(() => {
    setSelectedInspectors([]);
  }, [selectedRows.length]);

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
          {/* 날짜 + 조회 버튼 */}
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

          {/* 엑셀 다운로드 + 검사자 선택 */}
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography color="text.secondary">
              선택된 행: {selectedRows.length}개
            </Typography>

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
                  sx={{
                    fontSize: "14px",
                    height: "36px",
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        "& .MuiMenuItem-root": {
                          fontSize: "14px",
                        },
                      },
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
              filename={
                effectiveKind === "pvc"
                  ? "수입검사(원자재)_PVC.xlsx"
                  : effectiveKind === "scr"
                  ? "수입검사(원자재)_SCR.xlsx"
                  : "수입검사(원자재)_연선.xlsx"
              }
              label="엑셀 다운로드"
              buttonProps={{ variant: "contained" }}
              onBeforeDownload={handleBeforeExcelDownload}
              headerOptions={{
                title:
                  effectiveKind === "pvc"
                    ? "원자재 수입검사 일지(PVC)"
                    : effectiveKind === "scr"
                    ? "원자재 수입검사 일지(SCR)"
                    : "원자재 수입검사 일지(연선)",
                inspectDateText: formatDateRange(startDate, endDate),
                inspectorNameText,
                showApprovalLine: true,
              }}
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
      <Box sx={{ flex: 1, minWidth: 0, overflow: "auto" }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          선택한 행 미리보기
        </Typography>
        <DataGrid
          rows={selectedRowsForExcel}
          columns={selectedColumns}
          pagination
          initialState={{
            pagination: { paginationModel: { page: 0, pageSize: 5 } },
          }}
          hideFooterSelectedRowCount
        />
      </Box>
    </Box>
  );
}
