import { useEffect, useMemo, useRef, useState } from "react";
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
  transformServerData,
  type ServerRow,
  type FrontRow,
  type ItemKind,
} from "../../utils/InspDataTrans/prcsSubInspTrans";
import * as XLSX from "xlsx";
import dayjs, { Dayjs } from "dayjs";
import minMax from "dayjs/plugin/minMax";
import "dayjs/locale/ko";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { prcsSub } from "../../api/api";
import { extractErrorMessage } from "../../utils/Common/extractError";
import { useLocation } from "react-router-dom";

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

  // ---- kind 바뀔 때 모든 상태 초기화 + 이전 요청 무시
  useEffect(() => {
    reqSeq.current += 1; // 이전 요청 결과는 전부 무시
    setRawServerData([]); // rows 초기화
    setRowSelectionModel({ type: "include", ids: new Set() });
    setPaginationModel({ page: 0, pageSize: 5 });
    setLoading(false);
  }, [effectiveKind]);

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

  // -------------------- 최종 컬럼 --------------------
  const columns: GridColDef[] = useMemo(() => {
    if (effectiveKind === "dr") return [...commonColumns, ...drExtraColumns];
    return [...commonColumns, ...stExtraColumns];
  }, [commonColumns, stExtraColumns, drExtraColumns, effectiveKind]);

  // -------------------- rows 변환 --------------------
  const rows = useMemo<FrontRow[]>(
    () => transformServerData(rawServerData, effectiveKind),
    [rawServerData, effectiveKind]
  );

  // -------------------- 선택 행 계산 --------------------
  const selectedRows = useMemo(() => {
    if (rowSelectionModel.type === "include") {
      return rows.filter((r) => rowSelectionModel.ids.has(r.id as GridRowId));
    }
    return rows.filter((r) => !rowSelectionModel.ids.has(r.id as GridRowId));
  }, [rows, rowSelectionModel]);

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
              onClick={() =>
                exportToXlsx(
                  selectedRows,
                  effectiveKind === "dr"
                    ? "순회검사_신선.xlsx"
                    : "순회검사_연선.xlsx"
                )
              }
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
