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
  type FrontRow_WE,
  transformServerData_WE,
} from "../../utils/prcsSubInspTrans";
import * as XLSX from "xlsx";
import dayjs, { Dayjs } from "dayjs";
import minMax from "dayjs/plugin/minMax";
import "dayjs/locale/ko";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { prcsSubWE } from "../../api/api";
import { extractErrorMessage } from "../../utils/extractError";

dayjs.locale("ko");
dayjs.extend(minMax);

type RowSelectionModelV8 = {
  type: "include" | "exclude";
  ids: Set<GridRowId>;
};

// -------------------- sendData --------------------
function buildSendData(s: string, e: string) {
  // ITM_GRP=27 (연선)
  return `${s};${e};27;0;WE-01-01:1!WE-02-01:1!WE-03-01:1!WE-04-01:1!WE-05-01:1!WE-06-01:1!WE-06-01:2!WE-07-01:1!WE-08-01:1!WE-09-01:1!WE-09-01:2!WE-09-01:3!WE-09-01:4!WE-10-01:1!WE-10-01:2!WE-10-01:3!WE-10-01:4!WE-11-01:1!WE-12-01:1!WE-13-01:1!WE-14-01:1!;`;
}

export default function PrcsSubWEInspDataGrid() {
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

  // -------------------- 공통 컬럼 --------------------
  const columns: GridColDef[] = useMemo(
    () => [
      { field: "actualDate", headerName: "생산일자", width: 110 },
      { field: "inspLot", headerName: "검사로트", width: 130 },
      { field: "itemCode", headerName: "품목코드", width: 130 },
      { field: "itemName", headerName: "품목명", width: 180 },
      { field: "processName", headerName: "생산호기", width: 120 },
      { field: "roundTime", headerName: "순회시간", width: 130 },
      { field: "inspector", headerName: "검사자", width: 100 },
      { field: "inspectedAt", headerName: "검사일자", width: 150 },
      { field: "remark", headerName: "비고", width: 160 },

      // 외관/색상/라벨/포장/인쇄 상태
      { field: "appearance", headerName: "외관상태", width: 100 },
      { field: "color", headerName: "색상상태", width: 100 },
      { field: "label", headerName: "라벨상태", width: 100 },
      { field: "packing", headerName: "포장상태", width: 100 },
      { field: "printing", headerName: "인쇄상태", width: 100 },

      // 치수/물성
      {
        field: "insulationOD1",
        headerName: "절연외경 1",
        width: 110,
        type: "number",
      },
      {
        field: "insulationOD2",
        headerName: "절연외경 2",
        width: 110,
        type: "number",
      },
      {
        field: "souterDiameter",
        headerName: "연선외경",
        width: 110,
        type: "number",
      },
      {
        field: "eccentricity",
        headerName: "편심율(완측)",
        width: 120,
        type: "number",
      },

      { field: "cond1", headerName: "도체경 1", width: 110, type: "number" },
      { field: "cond2", headerName: "도체경 2", width: 110, type: "number" },
      { field: "cond3", headerName: "도체경 3", width: 110, type: "number" },
      { field: "cond4", headerName: "도체경 4", width: 110, type: "number" },

      {
        field: "insulThk1",
        headerName: "절연두께 1",
        width: 110,
        type: "number",
      },
      {
        field: "insulThk2",
        headerName: "절연두께 2",
        width: 110,
        type: "number",
      },
      {
        field: "insulThk3",
        headerName: "절연두께 3",
        width: 110,
        type: "number",
      },
      {
        field: "insulThk4",
        headerName: "절연두께 4",
        width: 110,
        type: "number",
      },

      { field: "tensile", headerName: "인장강도", width: 110, type: "number" },
      { field: "elongation", headerName: "신장률", width: 110, type: "number" },
      {
        field: "subStrandCnt",
        headerName: "소선수",
        width: 100,
        type: "number",
      },
      { field: "pitch", headerName: "피치", width: 90, type: "number" },
    ],
    []
  );

  // -------------------- rows 변환 --------------------
  const rows = useMemo<FrontRow_WE[]>(
    () => transformServerData_WE(rawServerData),
    [rawServerData]
  );

  // -------------------- 선택 행 계산 --------------------
  const selectedRows = useMemo(() => {
    if (rowSelectionModel.type === "include") {
      return rows.filter((r) =>
        rowSelectionModel.ids.has(r.inspLot as GridRowId)
      );
    }
    return rows.filter(
      (r) => !rowSelectionModel.ids.has(r.inspLot as GridRowId)
    );
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
      const data = await prcsSubWE(sendData);
      if (reqSeq.current !== mySeq) return;

      setRawServerData(data ?? []);
      setRowSelectionModel({ type: "include", ids: new Set() });
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    } catch (err: any) {
      if (reqSeq.current !== mySeq) return;
      console.error(extractErrorMessage(err));
      setRawServerData([]);
    } finally {
      if (reqSeq.current === mySeq) setLoading(false);
    }
  }

  // -------------------- 엑셀 내보내기 --------------------
  function exportToXlsx(data: any[], filename: string) {
    const ordered = data.map((r) => {
      const o: Record<string, any> = {};
      columns.forEach((c) => {
        o[c.headerName ?? (c.field as string)] = (r as any)[c.field];
      });
      return o;
    });

    const ws = XLSX.utils.json_to_sheet(ordered);
    const colWidths = Object.keys(ordered[0] || {}).map((key) => ({
      wch:
        Math.max(
          key.length,
          ...ordered.map((row) => String(row[key] ?? "").length)
        ) + 2,
    }));
    (ws as any)["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(
      wb,
      filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`
    );
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
            <Button
              variant="contained"
              onClick={() => exportToXlsx(selectedRows, "순회검사_압출.xlsx")}
              disabled={selectedRows.length === 0}
            >
              엑셀 다운로드
            </Button>
          </Stack>
        </Stack>
      </LocalizationProvider>

      {/* 메인 그리드 */}
      <Box sx={{ flex: 1, minWidth: 0, minHeight: 0 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.inspLot}
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
          columns={columns}
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
