import { useMemo, useRef, useState } from "react";
import {
  Box,
  Stack,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridRowId,
  type GridPaginationModel,
} from "@mui/x-data-grid";
import {
  type ServerRow,
  type DailyInspField,
  transformServerData_Daliy,
} from "../../utils/InspDataTrans/mtrInspTrans";
import dayjs, { Dayjs } from "dayjs";
import minMax from "dayjs/plugin/minMax";
import "dayjs/locale/ko";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { mtrDailyInfo } from "../../api/api";
import { extractErrorMessage } from "../../utils/Common/extractError";
import { buildPreviewRow } from "../../utils/SelectedRow/mtrInsp";
import { ExcelDownloadButton } from "../Common/ExcelDownloadButton";
import { useAlert } from "../../context/AlertContext";
import { formatDateRange } from "../../utils/Common/formatDateRange";

dayjs.locale("ko");
dayjs.extend(minMax);

type RowSelectionModelV8 = {
  type: "include" | "exclude";
  ids: Set<GridRowId>;
};

// -------------------- sendData --------------------
function buildSendData(s: string, e: string) {
  return `${s};${e};G-D;0;`;
}

export default function MtrDaliyInspDataGrid() {
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

  // -------------------- 공통 컬럼 --------------------
  const columns: GridColDef[] = useMemo<GridColDef[]>(
    () => [
      { field: "vendor", headerName: "업체명", width: 140 },
      { field: "itemName", headerName: "품명", width: 120 },
      { field: "std", headerName: "규격", width: 80 },
      { field: "pColor", headerName: "색상", width: 80 },
      { field: "lotNo", headerName: "LOT NO", width: 160 },
      { field: "appearance", headerName: "외관", width: 80 },
      { field: "printing", headerName: "인쇄", width: 80, type: "number" },

      {
        field: "subStrandCnt",
        headerName: "소선수",
        width: 110,
        type: "number",
      },
      {
        field: "oDiameter",
        headerName: "완성외경",
        width: 110,
        type: "number",
      },
      { field: "shezThk", headerName: "쉬즈두께", width: 110, type: "number" },
      { field: "s_cond", headerName: "차폐경", width: 110, type: "number" },
      { field: "diameter1", headerName: "외경1", width: 110, type: "number" },
      { field: "diameter2", headerName: "외경2", width: 110, type: "number" },
      {
        field: "souterDiameter",
        headerName: "연선외경",
        width: 100,
        type: "number",
      },
      { field: "pitch", headerName: "피치(참고)", width: 90, type: "number" },
      { field: "cond1", headerName: "소선경1", width: 100, type: "number" },
      { field: "cond2", headerName: "소선경2", width: 100, type: "number" },
      { field: "cond3", headerName: "소선경3", width: 100, type: "number" },
      { field: "cond4", headerName: "소선경4", width: 100, type: "number" },
      {
        field: "insulThk1",
        headerName: "절연두께1",
        width: 100,
        type: "number",
      },
      {
        field: "insulThk2",
        headerName: "절연두께2",
        width: 100,
        type: "number",
      },
      {
        field: "insulThk3",
        headerName: "절연두께3",
        width: 100,
        type: "number",
      },
      {
        field: "insulThk4",
        headerName: "절연두께4",
        width: 100,
        type: "number",
      },
      { field: "t_pitch", headerName: "연합피치", width: 100, type: "number" },
      { field: "tensile", headerName: "인장강도", width: 100, type: "number" },
      { field: "elongation", headerName: "신장률", width: 110, type: "number" },
      {
        field: "shez_tensile",
        headerName: "쉬즈 인장강도",
        width: 110,
        type: "number",
      },
      {
        field: "shez_elongation",
        headerName: "쉬즈 신장률",
        width: 110,
        type: "number",
      },
    ],
    []
  );

  const selectedColumns: GridColDef[] = useMemo<GridColDef[]>(
    () => [
      { field: "no", headerName: "NO", width: 50 },
      { field: "vendor", headerName: "업체명", width: 140 },
      { field: "itemName", headerName: "품명", width: 120 },
      { field: "std", headerName: "규격", width: 80 },
      { field: "pColor", headerName: "색상", width: 80 },
      { field: "lotNo", headerName: "LOT NO", width: 160 },
      { field: "appearance", headerName: "외관", width: 80 },
      { field: "printing", headerName: "인쇄", width: 80, type: "number" },

      {
        field: "subStrandCnt",
        headerName: "소선수",
        width: 110,
        type: "number",
      },
      {
        field: "oDiameter",
        headerName: "완성외경",
        width: 110,
        type: "number",
      },
      { field: "shezThk", headerName: "쉬즈두께", width: 110, type: "number" },
      { field: "s_cond", headerName: "차폐경", width: 110, type: "number" },
      { field: "diameter1", headerName: "외경1", width: 110, type: "number" },
      { field: "diameter2", headerName: "외경2", width: 110, type: "number" },
      {
        field: "souterDiameter",
        headerName: "연선외경",
        width: 100,
        type: "number",
      },
      { field: "pitch", headerName: "피치(참고)", width: 90, type: "number" },
      { field: "cond1", headerName: "소선경1", width: 100, type: "number" },
      { field: "cond2", headerName: "소선경2", width: 100, type: "number" },
      { field: "cond3", headerName: "소선경3", width: 100, type: "number" },
      { field: "cond4", headerName: "소선경4", width: 100, type: "number" },
      {
        field: "insulThk1",
        headerName: "절연두께1",
        width: 100,
        type: "number",
      },
      {
        field: "insulThk2",
        headerName: "절연두께2",
        width: 100,
        type: "number",
      },
      {
        field: "insulThk3",
        headerName: "절연두께3",
        width: 100,
        type: "number",
      },
      {
        field: "insulThk4",
        headerName: "절연두께4",
        width: 100,
        type: "number",
      },
      {
        field: "avg_insulThk",
        headerName: "절연평균",
        width: 100,
        type: "number",
      },
      {
        field: "eccentricity",
        headerName: "편심율",
        width: 100,
        type: "number",
      },
      { field: "t_pitch", headerName: "연합피치", width: 100, type: "number" },
      { field: "tensile", headerName: "인장강도", width: 100, type: "number" },
      { field: "elongation", headerName: "신장률", width: 110, type: "number" },
      {
        field: "shez_tensile",
        headerName: "쉬즈 인장강도",
        width: 110,
        type: "number",
      },
      {
        field: "shez_elongation",
        headerName: "쉬즈 신장률",
        width: 110,
        type: "number",
      },
    ],
    []
  );

  // -------------------- rows 변환 --------------------
  const rows = useMemo<DailyInspField[]>(
    () => transformServerData_Daliy(rawServerData),
    [rawServerData]
  );

  // -------------------- 선택 행 계산 --------------------
  const selectedRows = useMemo(() => {
    const base = (
      rowSelectionModel.type === "include"
        ? rows.filter((r) => rowSelectionModel.ids.has(r.id as GridRowId))
        : rows.filter((r) => !rowSelectionModel.ids.has(r.id as GridRowId))
    ).map(buildPreviewRow);
    return base.map((r, idx) => ({ ...r, no: idx + 1 }));
  }, [rows, rowSelectionModel]);

  // -------------------- 조회 버튼 --------------------
  async function handleSearch() {
    if (!startDate || !endDate) return;

    const s = dayjs.min(startDate, endDate).format("YYYY-MM-DD");
    const e = dayjs.max(startDate, endDate).format("YYYY-MM-DD");
    const sendData = buildSendData(s, e);

    const mySeq = reqSeq.current;

    setLoading(true);
    try {
      const data = await mtrDailyInfo(sendData);
      if (reqSeq.current !== mySeq) return;

      setRawServerData(data ?? []);
      setRowSelectionModel({ type: "include", ids: new Set() });
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    } catch (err) {
      if (reqSeq.current !== mySeq) return;

      const msg = extractErrorMessage(err);

      showAlert({
        message: msg || "조회 중 오류가 발생했습니다.",
        severity: "error",
      });

      setRawServerData([]);
    } finally {
      if (reqSeq.current === mySeq) setLoading(false);
    }
  }

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
            <ExcelDownloadButton
              data={selectedRows}
              columns={selectedColumns}
              filename={"일일 수입검사일지.xlsx"}
              label="엑셀 다운로드"
              buttonProps={{ variant: "contained" }}
              headerOptions={{
                title: "일일 수입검사 일지 (독정리)",
                inspectDateText: formatDateRange(startDate, endDate),
                inspectorNameText: "test",
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
