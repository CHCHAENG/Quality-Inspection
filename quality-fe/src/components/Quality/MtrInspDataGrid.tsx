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
import { exportToXlsxStyled } from "../../utils/SelectedRow/mtrInsp";

dayjs.locale("ko");
dayjs.extend(minMax);

type RowSelectionModelV8 = {
  type: "include" | "exclude";
  ids: Set<GridRowId>;
};

// -------------------- 경로 기반 kind 판별 --------------------
function kindFromPath(pathname: string): ItemKind {
  const p = pathname.toLowerCase();
  if (p.includes("pvc")) return "pvc";
  if (p.includes("scr")) return "scr";
  if (p.includes("st")) return "st";
  return "st"; // 기본
}

// -------------------- sendData --------------------
function buildSendDataForST(s: string, e: string) {
  // ITM_GRP=24 (연선)
  return `${s};${e};24;0;ST-00-01:1!ST-01-01:1!ST-03-01:1!ST-03-02:1!ST-04-01:1!ST-05-01:1!ST-05-01:2!ST-05-01:3!ST-05-01:4!;`;
}
function buildSendDataForPVC(s: string, e: string) {
  // ITM_GRP=22 (PVC)
  return `${s};${e};22;0;PVC-01-01:1!PVC-02-01:1!PVC-03-01:1!;`;
}
function buildSendDataForSCR(s: string, e: string) {
  // ITM_GRP=21 (SCR)
  return `${s};${e};21;0;CU-00-01:1!CU-01-01:1!CU-01-01:2!CU-01-01:3!CU-01-01:4!;`;
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
      { field: "reqNo", headerName: "의뢰번호", width: 140 },
      { field: "vendor", headerName: "구매업체", width: 160 },
      { field: "itemCode", headerName: "품번", width: 150 },
      { field: "itemName", headerName: "품명", width: 180 },
      { field: "decision", headerName: "판정", width: 100 },
      { field: "barcode", headerName: "바코드", width: 260 },
      { field: "qty", headerName: "검사수량", width: 80, type: "number" },
      { field: "unit", headerName: "단위", width: 80 },
      { field: "inspector", headerName: "검사자", width: 100 },
      { field: "inspectedAt", headerName: "검사일자", width: 160 },
      { field: "remark", headerName: "비고", width: 140 },
    ],
    []
  );

  // -------------------- 연선 전용 컬럼 --------------------
  const stExtraColumns: GridColDef[] = useMemo(
    () => [
      { field: "appearance", headerName: "외관상태", width: 80 },
      { field: "pitch", headerName: "피치", width: 80, type: "number" },
      { field: "strandCount", headerName: "가닥수", width: 80, type: "number" },
      { field: "twistDirection", headerName: "꼬임방향", width: 80 },
      {
        field: "outerDiameter",
        headerName: "연선외경",
        width: 100,
        type: "number",
      },
      { field: "cond1", headerName: "도체경1", width: 100, type: "number" },
      { field: "cond2", headerName: "도체경2", width: 100, type: "number" },
      { field: "cond3", headerName: "도체경3", width: 100, type: "number" },
      { field: "cond4", headerName: "도체경4", width: 100, type: "number" },
      { field: "vendorRemark", headerName: "비고(업체로트)", width: 160 },
    ],
    []
  );

  // -------------------- PVC 전용 컬럼 --------------------
  const pvcExtraColumns: GridColDef[] = useMemo(
    () => [
      { field: "pvcCheck1", headerName: "외관상태", width: 100 },
      { field: "pvcCheck2", headerName: "색상상태", width: 100 },
      { field: "pvcCheck3", headerName: "포장상태", width: 100 },
      { field: "vendorRemark", headerName: "비고(업체로트)", width: 160 },
    ],
    []
  );

  // -------------------- SCR 전용 컬럼 --------------------
  const scrExtraColumns: GridColDef[] = useMemo(
    () => [
      { field: "appearance", headerName: "외관상태", width: 80 }, // CU-00-01
      { field: "cond1", headerName: "소선경1", width: 90, type: "number" }, // CU-01-01
      { field: "cond2", headerName: "소선경2", width: 90, type: "number" }, // CU-01-02
      { field: "cond3", headerName: "소선경3", width: 90, type: "number" }, // CU-01-03
      { field: "cond4", headerName: "소선경4", width: 90, type: "number" }, // CU-01-04
      { field: "vendorRemark", headerName: "비고(업체로트)", width: 160 },
    ],
    []
  );

  // -------------------- 최종 컬럼 --------------------
  const columns: GridColDef[] = useMemo(() => {
    if (effectiveKind === "pvc") return [...commonColumns, ...pvcExtraColumns];
    if (effectiveKind === "scr") return [...commonColumns, ...scrExtraColumns];
    return [...commonColumns, ...stExtraColumns];
  }, [
    commonColumns,
    stExtraColumns,
    pvcExtraColumns,
    scrExtraColumns,
    effectiveKind,
  ]);

  // -------------------- 연선 Selected 컬럼 --------------------
  const stSelectedColumns: GridColDef[] = useMemo(
    () => [
      { field: "vendor", headerName: "업체명", width: 160 },
      { field: "barcode", headerName: "LOT NO", width: 260 },
      { field: "std", headerName: "규격", width: 80 },
      { field: "appearance", headerName: "외관", width: 80 },
      { field: "packing", headerName: "포장상태", width: 160 },
      { field: "subStrandCnt", headerName: "소선수", width: 80 },
      { field: "souterDiameter", headerName: "연선외경", width: 80 },
      { field: "pitch", headerName: "피치", width: 80 },
      { field: "cond1", headerName: "도체경1", width: 100, type: "number" },
      { field: "cond2", headerName: "도체경2", width: 100, type: "number" },
      { field: "cond3", headerName: "도체경3", width: 100, type: "number" },
      { field: "cond4", headerName: "도체경4", width: 100, type: "number" },
      { field: "inspectedAt", headerName: "입고일자", width: 160 },
      { field: "qty", headerName: "입고수량", width: 80, type: "number" },
      { field: "decision", headerName: "판정", width: 100 },
    ],
    []
  );

  // -------------------- PVC Selected 컬럼 --------------------
  const pvcSelectedColumns: GridColDef[] = useMemo(
    () => [
      { field: "vendor", headerName: "업체명", width: 160 },
      { field: "itemName", headerName: "품명", width: 180 },
      { field: "color", headerName: "색상", width: 80 },
      { field: "barcode", headerName: "LOT NO", width: 260 },
      { field: "pvcCheck1", headerName: "외관상태", width: 100 },
      {
        field: "color_check",
        headerName: "색상(한도견본일치할것)",
        width: 100,
      },
      { field: "label", headerName: "라벨", width: 100 },
      { field: "pvcCheck3", headerName: "포장상태", width: 100 },
      { field: "inspectedAt", headerName: "입고일자", width: 160 },
      { field: "decision", headerName: "판정", width: 100 },
      { field: "decision2", headerName: "판정", width: 100 },
      { field: "vendorRemark", headerName: "비고", width: 160 },
    ],
    []
  );

  // -------------------- SCR Selected 컬럼 --------------------
  const scrSelectedColumns: GridColDef[] = useMemo(
    () => [
      { field: "vendor", headerName: "업체명", width: 160 },
      { field: "barcode", headerName: "LOT NO", width: 260 },
      { field: "packing", headerName: "포장상태", width: 160 },
      {
        field: "appearance",
        headerName: "외관(흠.녹.균열이 없을것)",
        width: 80,
      },
      { field: "cond1", headerName: "도체경1", width: 90, type: "number" },
      { field: "cond2", headerName: "도체경2", width: 90, type: "number" },
      { field: "cond3", headerName: "도체경3", width: 90, type: "number" },
      { field: "cond4", headerName: "도체경4", width: 90, type: "number" },
      { field: "inspectedAt", headerName: "입고일자", width: 160 },
      { field: "qty", headerName: "입고수량", width: 80, type: "number" },
      { field: "vendorRemark", headerName: "비고", width: 160 },
    ],
    []
  );

  const selectedColumns: GridColDef[] = useMemo(() => {
    if (effectiveKind === "pvc") return [...pvcSelectedColumns];
    if (effectiveKind === "scr") return [...scrSelectedColumns];
    return [...stSelectedColumns];
  }, [
    stSelectedColumns,
    pvcSelectedColumns,
    scrSelectedColumns,
    effectiveKind,
  ]);

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
      const data = await mtrInsp(sendData);
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
            <Button
              variant="contained"
              onClick={() =>
                exportToXlsxStyled(
                  selectedRows,
                  selectedColumns,
                  effectiveKind === "pvc"
                    ? "수입검사(원자재)_PVC.xlsx"
                    : effectiveKind === "scr"
                    ? "수입검사(원자재)_SCR.xlsx"
                    : "수입검사(원자재)_연선.xlsx"
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
