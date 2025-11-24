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
} from "../../utils/InspDataTrans/prcsSubInspTrans";
import dayjs, { Dayjs } from "dayjs";
import minMax from "dayjs/plugin/minMax";
import "dayjs/locale/ko";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { prcsSub } from "../../api/api";
import { extractErrorMessage } from "../../utils/Common/extractError";
import { useLocation } from "react-router-dom";
import { ExcelDownloadButton } from "../Common/ExcelDownloadButton";
import { useAlert } from "../../context/AlertContext";
import { formatDateRange } from "../../utils/Common/formatDateRange";

dayjs.locale("ko");
dayjs.extend(minMax);

type RowSelectionModelV8 = {
  type: "include" | "exclude";
  ids: Set<GridRowId>;
};

// -------------------- 경로 기반 kind 판별 --------------------
function kindFromPath(pathname: string): ItemKind {
  const p = pathname.toLowerCase();
  if (p.includes("dr")) return "dr";
  if (p.includes("st")) return "st";
  return "st"; // 기본
}

// -------------------- sendData --------------------
function buildSendDataForST(s: string, e: string) {
  // ITM_GRP=24 (연선)
  return `${s};${e};24;0;ST-00-01:1!ST-01-01:1!ST-03-01:1!ST-03-02:1!ST-04-01:1!ST-05-01:1!ST-05-01:2!ST-05-01:3!ST-05-01:4!;`;
}
function buildSendDataForDR(s: string, e: string) {
  // ITM_GRP=23 (신선)
  return `${s};${e};23;0;DR-01-01:1!DR-02-01:1!DR-03-01:1!DR-03-01:2!DR-03-01:3!DR-03-01:4!;`;
}

function buildSendDataString(kind: ItemKind, s: string, e: string) {
  if (kind === "dr") return buildSendDataForDR(s, e);
  return buildSendDataForST(s, e);
}

export default function PrcsSubInspDataGrid() {
  const location = useLocation();
  const effectiveKind = useMemo<ItemKind>(
    () => kindFromPath(location.pathname),
    [location.pathname]
  );

  // 원본
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

  // -------------------- 공통 컬럼 --------------------
  const commonColumns: GridColDef[] = useMemo(
    () => [
      { field: "barcode", headerName: "바코드", width: 260 },
      { field: "lotNo", headerName: "로트번호", width: 140 },
      { field: "itemCode", headerName: "품목코드", width: 150 },
      { field: "itemName", headerName: "품목명", width: 200 },
      { field: "processName", headerName: "생산공정", width: 140 },
      { field: "actualDate", headerName: "실검일자", width: 120 },
      { field: "qty", headerName: "수량", width: 90, type: "number" },
      { field: "unit", headerName: "단위", width: 80 },
      { field: "decision", headerName: "결과", width: 90 },
      { field: "inspector", headerName: "검사자", width: 100 },
      { field: "inspectedAt", headerName: "검사일시", width: 160 },
      { field: "remark", headerName: "비고", width: 160 },
    ],
    []
  );

  // -------------------- 연선(ST) 전용 컬럼 --------------------
  const stExtraColumns: GridColDef[] = useMemo(
    () => [
      { field: "appearance", headerName: "외관상태", width: 100 },
      { field: "pitch", headerName: "피치", width: 90, type: "number" },
      { field: "strandCount", headerName: "가닥수", width: 90, type: "number" },
      { field: "twistDirection", headerName: "꼬임방향", width: 100 },
      {
        field: "outerDiameter",
        headerName: "연선외경",
        width: 110,
        type: "number",
      },
      { field: "cond1", headerName: "도체경 1", width: 110, type: "number" },
      { field: "cond2", headerName: "도체경 2", width: 110, type: "number" },
      { field: "cond3", headerName: "도체경 3", width: 110, type: "number" },
      { field: "cond4", headerName: "도체경 4", width: 110, type: "number" },
    ],
    []
  );

  // -------------------- 신선(DR) 전용 컬럼 --------------------
  const drExtraColumns: GridColDef[] = useMemo(
    () => [
      { field: "appearance", headerName: "외관상태", width: 100 },
      { field: "strandCount", headerName: "가닥수", width: 90, type: "number" },
      {
        field: "cond1",
        headerName: "소선경 1",
        width: 110,
        type: "number",
      },
      {
        field: "cond2",
        headerName: "소선경 2",
        width: 110,
        type: "number",
      },
      {
        field: "cond3",
        headerName: "소선경 3",
        width: 110,
        type: "number",
      },
      {
        field: "cond4",
        headerName: "소선경 4",
        width: 110,
        type: "number",
      },
    ],
    []
  );

  // -------------------- 연선(ST) Selected 컬럼 --------------------
  const stSelectedColumns: GridColDef[] = useMemo(
    () => [
      { field: "no", headerName: "NO", width: 50 },
      { field: "itemCode", headerName: "규격", width: 150 },
      { field: "lotNo", headerName: "LOT", width: 140 },
      { field: "appearance", headerName: "외관", width: 100 },
      { field: "strandCount", headerName: "소선수", width: 90, type: "number" },
      {
        field: "outerDiameter",
        headerName: "연선외경",
        width: 110,
        type: "number",
      },
      { field: "cond1", headerName: "소선경 1", width: 110, type: "number" },
      { field: "cond2", headerName: "소선경 2", width: 110, type: "number" },
      { field: "cond3", headerName: "소선경 3", width: 110, type: "number" },
      { field: "cond4", headerName: "소선경 4", width: 110, type: "number" },
      { field: "twistDirection", headerName: "꼬임방향", width: 100 },
      { field: "decision", headerName: "판정", width: 90 },
      { field: "remark", headerName: "비고", width: 160 },
    ],
    []
  );

  // -------------------- 신선(DR) Selected 컬럼 --------------------
  const drSelectedColumns: GridColDef[] = useMemo(
    () => [
      { field: "no", headerName: "NO", width: 50 },
      { field: "itemCode", headerName: "규격", width: 150 },
      { field: "lotNo", headerName: "LOT", width: 140 },
      { field: "appearance", headerName: "외관", width: 100 },
      { field: "strandCount", headerName: "소선수", width: 90, type: "number" },
      {
        field: "cond1",
        headerName: "소선경 1",
        width: 110,
        type: "number",
      },
      {
        field: "cond2",
        headerName: "소선경 2",
        width: 110,
        type: "number",
      },
      {
        field: "cond3",
        headerName: "소선경 3",
        width: 110,
        type: "number",
      },
      {
        field: "cond4",
        headerName: "소선경 4",
        width: 110,
        type: "number",
      },
      { field: "decision", headerName: "판정", width: 90 },
      { field: "remark", headerName: "비고", width: 160 },
    ],
    []
  );

  // -------------------- 최종 컬럼 --------------------
  const columns: GridColDef[] = useMemo(() => {
    if (effectiveKind === "dr") return [...commonColumns, ...drExtraColumns];
    return [...commonColumns, ...stExtraColumns];
  }, [commonColumns, stExtraColumns, drExtraColumns, effectiveKind]);

  const selectedColumns: GridColDef[] = useMemo(() => {
    if (effectiveKind === "dr") return [...drSelectedColumns];
    return [...stSelectedColumns];
  }, [stSelectedColumns, drSelectedColumns, effectiveKind]);

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

    return filtered.map((r, idx) => ({ ...r, no: idx + 1 }));
  }, [rows, rowSelectionModel]);

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
    // 사용자가 직접 선택한 값
    if (selectedInspectors.length > 0) {
      return selectedInspectors.join(", ");
    }
    // 검사자가 1명일 때 자동으로 적용
    if (inspectorOptions.length === 1) {
      return inspectorOptions[0];
    }

    return "";
  }, [selectedInspectors, inspectorOptions]);

  // 엑셀 다운로드 전 검사자 선택 체크
  const handleBeforeExcelDownload = () => {
    // 검사자가 2명 이상일 때 선택 안한 경우
    if (inspectorOptions.length >= 2 && !inspectorNameText) {
      showAlert({
        message: "검사자를 선택해 주세요.",
        severity: "warning",
      });
      return false;
    }
    return true;
  };

  // -------------------- 조회 버튼 --------------------
  async function handleSearch() {
    if (!startDate || !endDate) return;

    const s = dayjs.min(startDate, endDate).format("YYYY-MM-DD");
    const e = dayjs.max(startDate, endDate).format("YYYY-MM-DD");
    const sendData = buildSendDataString(effectiveKind, s, e);

    const mySeq = reqSeq.current;

    setLoading(true);
    try {
      const data = await prcsSub(sendData);
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

  // ---- kind 바뀔 때 모든 상태 초기화
  useEffect(() => {
    reqSeq.current += 1;
    setRawServerData([]);
    setRowSelectionModel({ type: "include", ids: new Set() });
    setPaginationModel({ page: 0, pageSize: 5 });
    setLoading(false);
    setSelectedInspectors([]);
  }, [effectiveKind]);

  // selectedRows가 바뀔 때 검사자 선택 초기화
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
              data={selectedRows}
              columns={selectedColumns}
              filename={
                effectiveKind === "dr"
                  ? "순회검사_신선.xlsx"
                  : "순회검사_연선.xlsx"
              }
              label="엑셀 다운로드"
              buttonProps={{ variant: "contained" }}
              onBeforeDownload={handleBeforeExcelDownload}
              headerOptions={{
                title:
                  effectiveKind === "dr"
                    ? "순회검사일지 신선"
                    : "순회검사일지 연선",
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
          rows={selectedRows}
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
