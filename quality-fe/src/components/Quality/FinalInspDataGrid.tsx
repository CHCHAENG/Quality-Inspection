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
  type ServerRow,
  type FrontRow,
  transformServerData,
  ItemKind,
} from "../../utils/InspDataTrans/finalSubInspTrans";
import dayjs, { Dayjs } from "dayjs";
import minMax from "dayjs/plugin/minMax";
import "dayjs/locale/ko";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { finalInsp } from "../../api/api";
import { extractErrorMessage } from "../../utils/Common/extractError";
import { useLocation } from "react-router-dom";
import {
  getBraidedShieldValue,
  splitProcessNameStdColor,
} from "../../utils/SelectedRow/finalInsp";
import { ExcelDownloadButton } from "../Common/ExcelDownloadButton";

dayjs.locale("ko");
dayjs.extend(minMax);

type RowSelectionModelV8 = {
  type: "include" | "exclude";
  ids: Set<GridRowId>;
};

// -------------------- 경로 기반 kind 판별 --------------------
function kindFromPath(pathname: string): ItemKind {
  const p = pathname.toLowerCase();
  if (p.includes("wx")) return "wx";
  if (p.includes("we")) return "we";
  return "whex"; // 기본
}

// -------------------- sendData --------------------
function buildSendDataForWHEX(s: string, e: string) {
  // ITM_GRP=3C (고전압선)
  return `${s};${e};3C;0;WHEX-01-01:1!WHEX-03-01:1!WHEX-04-01:1!WHEX-05-01:1!WHEX-06-01:1!WHEX-07-01:1!WHEX-07-01:2!WHEX-08-01:1!WHEX-08-01:2!WHEX-09-02:1!WHEX-10-01:1!WHEX-10-01:2!WHEX-10-01:3!WHEX-10-01:4!WHEX-11-01:1!WHEX-12-01:1!WHEX-12-01:2!WHEX-12-01:3!WHEX-12-01:4!WHEX-13-01:1!WHEX-13-01:2!WHEX-13-01:3!WHEX-13-01:4!WHEX-16-01:1!WHEX-17-01:1!WHEX-18-01:1!WHEX-19-01:1!WHEX-21-01:1!WHEX-22-01:1!WHEX-23-01:1!;`;
}

function buildSendDataForWE(s: string, e: string) {
  // ITM_GRP=27 (저전압 압출)
  return `${s};${e};27;0;WE-01-01:1!WE-02-01:1!WE-03-01:1!WE-04-01:1!WE-05-01:1!WE-05-02:1!WE-06-01:1!WE-07-01:1!WE-09-01:1!WE-09-01:2!WE-09-01:3!WE-09-01:4!WE-13-01:1!;`;
}

function buildSendDataForWX(s: string, e: string) {
  // ITM_GRP=28 (저전압 조사후)
  return `${s};${e};28;0;WX-01-01:1!WX-02-01:1!WX-03-01:1!WX-04-01:1!WX-05-01:1!WX-05-02:1!WX-06-01:1!WX-06-01:2!WX-07-01:1!WX-09-01:1!WX-09-01:2!WX-09-01:3!WX-09-01:4!WX-13-01:1!;`;
}

function buildSendDataString(kind: ItemKind, s: string, e: string) {
  if (kind === "wx") return buildSendDataForWX(s, e);
  if (kind === "we") return buildSendDataForWE(s, e);
  return buildSendDataForWHEX(s, e);
}
export default function FinalInspDataGrid() {
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

  // ---- kind 바뀔 때 모든 상태 초기화
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
      { field: "lotNo", headerName: "로트번호", width: 130 },
      { field: "initFinal", headerName: "초/종품", width: 100 },
      { field: "itemCode", headerName: "품목코드", width: 130 },
      { field: "itemName", headerName: "품목명", width: 180 },
      { field: "qty", headerName: "수량", width: 80, type: "number" },
      { field: "unit", headerName: "단위", width: 80 },
      { field: "decision", headerName: "결과", width: 80 },
      { field: "inspector", headerName: "검사자", width: 100 },
      { field: "inspectedAt", headerName: "검사일자", width: 150 },
      { field: "actualDate", headerName: "실적일자", width: 110 },
      { field: "remark", headerName: "비고", width: 160 },
    ],
    []
  );

  const whexExtraColumns: GridColDef[] = useMemo(
    () => [
      // 상태
      { field: "appearance", headerName: "외관상태", width: 100 },
      { field: "color", headerName: "색상상태", width: 100 },
      { field: "label", headerName: "라벨상태", width: 100 },
      { field: "packing", headerName: "포장상태", width: 100 },
      { field: "printing", headerName: "인쇄상태", width: 100 },

      // 완성외경
      {
        field: "oDiameter1",
        headerName: "완성외경 1",
        width: 100,
        type: "number",
      },
      {
        field: "oDiameter2",
        headerName: "완성외경 2",
        width: 100,
        type: "number",
      },
      // 절연외경
      {
        field: "insulationOD1",
        headerName: "절연외경 1",
        width: 100,
        type: "number",
      },
      {
        field: "insulationOD2",
        headerName: "절연외경 2",
        width: 100,
        type: "number",
      },
      // 연선외경
      {
        field: "souterDiameter",
        headerName: "연선외경",
        width: 100,
        type: "number",
      },

      // 도체경 (1~4)
      { field: "cond1", headerName: "도체경 1", width: 100, type: "number" },
      { field: "cond2", headerName: "도체경 2", width: 100, type: "number" },
      { field: "cond3", headerName: "도체경 3", width: 100, type: "number" },
      { field: "cond4", headerName: "도체경 4", width: 100, type: "number" },
      // 차폐도체경
      {
        field: "s_cond",
        headerName: "차폐 도체경",
        width: 120,
        type: "number",
      },
      // 절연두께 (1~4)
      {
        field: "insulThk1",
        headerName: "절연두께 1",
        width: 100,
        type: "number",
      },
      {
        field: "insulThk2",
        headerName: "절연두께 2",
        width: 100,
        type: "number",
      },
      {
        field: "insulThk3",
        headerName: "절연두께 3",
        width: 100,
        type: "number",
      },
      {
        field: "insulThk4",
        headerName: "절연두께 4",
        width: 100,
        type: "number",
      },
      // 쉬즈두께 (1~4)
      {
        field: "shezThk1",
        headerName: "쉬즈두께 1",
        width: 100,
        type: "number",
      },
      {
        field: "shezThk2",
        headerName: "쉬즈두께 2",
        width: 100,
        type: "number",
      },
      {
        field: "shezThk3",
        headerName: "쉬즈두께 3",
        width: 100,
        type: "number",
      },
      {
        field: "shezThk4",
        headerName: "쉬즈두께 4",
        width: 100,
        type: "number",
      },

      { field: "tensile", headerName: "인장강도", width: 100, type: "number" },
      { field: "elongation", headerName: "신장률", width: 100, type: "number" },

      {
        field: "shez_tensile",
        headerName: "쉬즈 인장강도",
        width: 100,
        type: "number",
      },
      {
        field: "shez_elongation",
        headerName: "쉬즈 신장률",
        width: 100,
        type: "number",
      },
      {
        field: "subStrandCnt",
        headerName: "소선수",
        width: 100,
        type: "number",
      },
      {
        field: "br_shield_s",
        headerName: "편조차폐(합)",
        width: 100,
        type: "number",
      },
      {
        field: "br_shield_d",
        headerName: "편조차폐(타)",
        width: 100,
        type: "number",
      },
    ],
    []
  );

  const weExtraColumns: GridColDef[] = useMemo(
    () => [
      // 상태
      { field: "appearance", headerName: "외관상태", width: 100 },
      { field: "color", headerName: "색상상태", width: 100 },
      { field: "label", headerName: "라벨상태", width: 100 },
      { field: "packing", headerName: "포장상태", width: 100 },
      { field: "printing", headerName: "인쇄상태", width: 100 },
      { field: "eccentricity", headerName: "편심률(판정)", width: 100 },

      {
        field: "insulationOD1",
        headerName: "절연외경",
        width: 110,
        type: "number",
      },
      {
        field: "souterDiameter",
        headerName: "연선외경",
        width: 110,
        type: "number",
      },
      { field: "cond1", headerName: "도체경 1", width: 110, type: "number" },
      { field: "cond2", headerName: "도체경 2", width: 110, type: "number" },
      { field: "cond3", headerName: "도체경 3", width: 110, type: "number" },
      { field: "cond4", headerName: "도체경 4", width: 110, type: "number" },
      {
        field: "subStrandCnt",
        headerName: "소선수",
        width: 100,
        type: "number",
      },
    ],
    []
  );

  // WX (저전압 조사후) - extra columns
  const wxExtraColumns: GridColDef[] = useMemo(
    () => [
      // 상태
      { field: "appearance", headerName: "외관상태", width: 100 },
      { field: "color", headerName: "색상상태", width: 100 },
      { field: "label", headerName: "라벨상태", width: 100 },
      { field: "packing", headerName: "포장상태", width: 100 },
      { field: "printing", headerName: "인쇄상태", width: 100 },
      { field: "eccentricity", headerName: "편심률(판정)", width: 100 },

      {
        field: "insulationOD1",
        headerName: "절연외경1",
        width: 110,
        type: "number",
      },
      {
        field: "insulationOD2",
        headerName: "절연외경2",
        width: 110,
        type: "number",
      },
      {
        field: "souterDiameter",
        headerName: "연선외경",
        width: 110,
        type: "number",
      },
      { field: "cond1", headerName: "도체경 1", width: 110, type: "number" },
      { field: "cond2", headerName: "도체경 2", width: 110, type: "number" },
      { field: "cond3", headerName: "도체경 3", width: 110, type: "number" },
      { field: "cond4", headerName: "도체경 4", width: 110, type: "number" },
      {
        field: "subStrandCnt",
        headerName: "소선수",
        width: 100,
        type: "number",
      },
    ],
    []
  );

  const whexSelectedColumns: GridColDef[] = useMemo(
    () => [
      { field: "no", headerName: "NO", width: 50 },
      { field: "itemName", headerName: "품명", width: 120 },
      { field: "std", headerName: "규격", width: 80 },
      { field: "p_color", headerName: "색상", width: 60 },
      { field: "lotNo", headerName: "LOT NO", width: 130 },
      { field: "appearance", headerName: "외관", width: 60 },
      {
        field: "subStrandCnt",
        headerName: "소선수",
        width: 80,
        type: "number",
      },
      {
        field: "oDiameter1",
        headerName: "완성외경 1",
        width: 100,
        type: "number",
      },
      {
        field: "oDiameter2",
        headerName: "완성외경 2",
        width: 100,
        type: "number",
      },
      {
        field: "shezThk1",
        headerName: "피복두께 1",
        width: 100,
        type: "number",
      },
      {
        field: "shezThk2",
        headerName: "피복두께 2",
        width: 100,
        type: "number",
      },
      {
        field: "shezThk3",
        headerName: "피복두께 3",
        width: 100,
        type: "number",
      },
      {
        field: "shezThk4",
        headerName: "피복두께 4",
        width: 100,
        type: "number",
      },
      {
        field: "br_shield",
        headerName: "편조 합/타",
        width: 100,
        type: "number",
      },
      {
        field: "s_cond",
        headerName: "차폐 도체경",
        width: 100,
        type: "number",
      },
      {
        field: "insulationOD1",
        headerName: "절연외경 1",
        width: 100,
        type: "number",
      },
      {
        field: "insulationOD2",
        headerName: "절연외경 2",
        width: 100,
        type: "number",
      },
      {
        field: "souterDiameter",
        headerName: "연선외경",
        width: 100,
        type: "number",
      },
      {
        field: "insulThk1",
        headerName: "절연두께 1",
        width: 100,
        type: "number",
      },
      {
        field: "insulThk2",
        headerName: "절연두께 2",
        width: 100,
        type: "number",
      },
      {
        field: "insulThk3",
        headerName: "절연두께 3",
        width: 100,
        type: "number",
      },
      {
        field: "insulThk4",
        headerName: "절연두께 4",
        width: 100,
        type: "number",
      },
      { field: "cond1", headerName: "소선경 1", width: 100, type: "number" },
      { field: "cond2", headerName: "소선경 2", width: 100, type: "number" },
      { field: "cond3", headerName: "소선경 3", width: 100, type: "number" },
      { field: "cond4", headerName: "소선경 4", width: 100, type: "number" },
      { field: "insul_i", headerName: "절연 인장", width: 80 },
      { field: "insul_s", headerName: "절연 신장", width: 80 },
      { field: "shez_i", headerName: "쉬즈 인장", width: 80 },
      { field: "shez_s", headerName: "쉬즈 신장", width: 80 },
      { field: "initFinal", headerName: "구분", width: 80 },
      { field: "decision", headerName: "판정", width: 80 },
    ],
    []
  );

  const weSelectedColumns: GridColDef[] = useMemo(
    () => [
      { field: "no", headerName: "NO", width: 50 },
      { field: "itemName", headerName: "품명", width: 120 },
      { field: "std", headerName: "규격", width: 80 },
      { field: "p_color", headerName: "색상", width: 60 },
      { field: "lotNo", headerName: "LOT NO", width: 130 },
      { field: "appearance", headerName: "외관", width: 60 },
      { field: "color", headerName: "색상", width: 60 },
      { field: "label", headerName: "라벨", width: 60 },
      { field: "packing", headerName: "포장", width: 60 },
      { field: "printing", headerName: "인쇄", width: 60 },
      {
        field: "subStrandCnt",
        headerName: "소선수",
        width: 80,
        type: "number",
      },
      {
        field: "insulationOD1",
        headerName: "절연외경",
        width: 100,
        type: "number",
      },
      {
        field: "souterDiameter",
        headerName: "연선외경",
        width: 100,
        type: "number",
      },
      { field: "cond1", headerName: "소선경 1", width: 100, type: "number" },
      { field: "cond2", headerName: "소선경 2", width: 100, type: "number" },
      { field: "cond3", headerName: "소선경 3", width: 100, type: "number" },
      { field: "cond4", headerName: "소선경 4", width: 100, type: "number" },
      { field: "eccentricity", headerName: "편심률", width: 80 },
      { field: "s_check", headerName: "시료확인", width: 150 },
      { field: "initFinal", headerName: "초/종품", width: 100 },
      { field: "decision", headerName: "판정", width: 80 },
    ],
    []
  );

  const wxSelectedColumns: GridColDef[] = useMemo(
    () => [
      { field: "no", headerName: "NO", width: 50 },
      { field: "itemName", headerName: "품명", width: 120 },
      { field: "std", headerName: "규격", width: 80 },
      { field: "p_color", headerName: "색상", width: 60 },
      { field: "lotNo", headerName: "LOT NO", width: 130 },
      { field: "appearance", headerName: "외관", width: 60 },
      { field: "color", headerName: "색상", width: 60 },
      { field: "label", headerName: "라벨", width: 60 },
      { field: "packing", headerName: "포장", width: 60 },
      { field: "printing", headerName: "인쇄", width: 60 },
      {
        field: "subStrandCnt",
        headerName: "소선수",
        width: 80,
        type: "number",
      },
      {
        field: "insulationOD1",
        headerName: "절연외경 1",
        width: 100,
        type: "number",
      },
      {
        field: "insulationOD2",
        headerName: "절연외경 2",
        width: 100,
        type: "number",
      },
      {
        field: "souterDiameter",
        headerName: "연선외경",
        width: 100,
        type: "number",
      },
      { field: "cond1", headerName: "소선경 1", width: 100, type: "number" },
      { field: "cond2", headerName: "소선경 2", width: 100, type: "number" },
      { field: "cond3", headerName: "소선경 3", width: 100, type: "number" },
      { field: "cond4", headerName: "소선경 4", width: 100, type: "number" },
      { field: "eccentricity", headerName: "편심률", width: 100 },
      { field: "initFinal", headerName: "초/종품", width: 100 },
      { field: "decision", headerName: "판정", width: 80 },
    ],
    []
  );

  // -------------------- 최종 컬럼 --------------------
  const columns: GridColDef[] = useMemo(() => {
    if (effectiveKind === "wx") return [...commonColumns, ...wxExtraColumns];
    if (effectiveKind === "we") return [...commonColumns, ...weExtraColumns];
    return [...commonColumns, ...whexExtraColumns];
  }, [
    commonColumns,
    whexExtraColumns,
    wxExtraColumns,
    weExtraColumns,
    effectiveKind,
  ]);

  const selectedColumns: GridColDef[] = useMemo(() => {
    if (effectiveKind === "wx") return [...wxSelectedColumns];
    if (effectiveKind === "we") return [...weSelectedColumns];
    return [...whexSelectedColumns];
  }, [
    wxSelectedColumns,
    weSelectedColumns,
    whexSelectedColumns,
    effectiveKind,
  ]);

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
        : rows
            .filter((r) => !rowSelectionModel.ids.has(r.id as GridRowId))
            .map(splitProcessNameStdColor);

    const base =
      effectiveKind === "whex" ? filtered.map(getBraidedShieldValue) : filtered;

    return base.map((r, idx) => ({ ...r, no: idx + 1 }));
  }, [rows, rowSelectionModel, effectiveKind]);

  // -------------------- 조회 버튼 --------------------
  async function handleSearch() {
    if (!startDate || !endDate) return;

    const s = dayjs.min(startDate, endDate).format("YYYY-MM-DD");
    const e = dayjs.max(startDate, endDate).format("YYYY-MM-DD");
    const sendData = buildSendDataString(effectiveKind, s, e);

    const mySeq = reqSeq.current;

    setLoading(true);
    try {
      const data = await finalInsp(sendData);
      if (reqSeq.current !== mySeq) return;

      setRawServerData(data ?? []);
      setRowSelectionModel({ type: "include", ids: new Set() });
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    } catch (err) {
      if (reqSeq.current !== mySeq) return;
      console.error(extractErrorMessage(err));
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
              filename={
                effectiveKind === "whex"
                  ? "완제품검사(고전압).xlsx"
                  : effectiveKind === "we"
                  ? "초종품검사(저전압 압출).xlsx"
                  : "초종품검사(저전압 조사후).xlsx"
              }
              kind={effectiveKind === "whex" ? "final_whex" : ""}
              label="엑셀 다운로드"
              buttonProps={{ variant: "contained" }}
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
