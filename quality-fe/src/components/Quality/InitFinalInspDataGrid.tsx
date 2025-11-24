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
  type ServerRow,
  type FrontRow,
  transformServerData,
  ItemKind,
} from "../../utils/InspDataTrans/initFinalSubInspTrans";
import dayjs, { Dayjs } from "dayjs";
import minMax from "dayjs/plugin/minMax";
import "dayjs/locale/ko";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { initFinalinsp } from "../../api/api";
import { extractErrorMessage } from "../../utils/Common/extractError";
import { useLocation } from "react-router-dom";
import {
  buildPreviewRow,
  splitProcessNameStdColor,
} from "../../utils/SelectedRow/initFinalInsp";
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
  if (p.includes("wx")) return "wx";
  if (p.includes("whbs")) return "whbs";
  return "whex"; // 기본
}

// -------------------- sendData --------------------
function buildSendDataForWX(s: string, e: string) {
  // ITM_GRP=28 (저전압 조사후)
  return `${s};${e};28;0;WX-01-01:1!WX-02-01:1!WX-03-01:1!WX-04-01:1!WX-05-01:1!WX-06-01:1!WX-06-01:2!WX-07-01:1!WX-09-01:1!WX-09-01:2!WX-09-01:3!WX-09-01:4!;`;
}
function buildSendDataForWHEX(s: string, e: string) {
  // ITM_GRP=3C (고전압 쉬즈)
  return `${s};${e};3C;0;WHEX-01-01:1!WHEX-03-01:1!WHEX-04-01:1!WHEX-05-01:1!WHEX-06-01:1!WHEX-07-01:1!WHEX-07-01:2!WHEX-07-01:3!WHEX-07-01:4!WHEX-08-01:1!WHEX-08-01:2!WHEX-11-01:1!WHEX-11-01:2!WHEX-13-01:1!WHEX-13-01:2!WHEX-13-01:3!WHEX-13-01:4!WHEX-24-01:1!WHEX-24-02:1!;`;
}

function buildSendDataForWHBS(s: string, e: string) {
  // ITM_GRP=3F (고전압 압출)
  return `${s};${e};3F;0;WHBS-01-01:1!WHBS-02-01:1!WHBS-05-01:1!WHBS-06-01:1!WHBS-06-01:2!WHBS-06-01:3!WHBS-06-01:4!WHBS-07-01:1!WHBS-08-01:1!WHBS-08-01:2!WHBS-08-01:3!WHBS-08-01:4!WHBS-09-01:1!WHBS-09-01:2!WHBS-09-01:3!WHBS-09-01:4!WHBS-09-01:5!WHBS-09-01:6!WHBS-10-01:1!WHBS-11-01:1!;`;
}

function buildSendDataString(kind: ItemKind, s: string, e: string) {
  if (kind === "wx") return buildSendDataForWX(s, e);
  if (kind === "whbs") return buildSendDataForWHBS(s, e);
  return buildSendDataForWHEX(s, e);
}
export default function InitialInspDataGrid() {
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
      { field: "lotNo", headerName: "로트번호", width: 130 },
      { field: "itemCode", headerName: "품목코드", width: 130 },
      { field: "itemName", headerName: "품목명", width: 180 },
      { field: "processName", headerName: "생산호기", width: 120 },
      { field: "actualDate", headerName: "실적일자", width: 110 },
      { field: "qty", headerName: "수량", width: 80, type: "number" },
      { field: "unit", headerName: "단위", width: 80 },
      { field: "decision", headerName: "결과", width: 80 },
      { field: "inspector", headerName: "검사자", width: 100 },
      { field: "inspectedAt", headerName: "검사일자", width: 150 },
      { field: "remark", headerName: "비고", width: 160 },
      { field: "initFinal", headerName: "초/종품", width: 100 },
    ],
    []
  );

  // WX (저전압 조사전) - extra columns
  const wxExtraColumns: GridColDef[] = useMemo(
    () => [
      { field: "appearance", headerName: "외관상태", width: 100 },
      { field: "color", headerName: "색상상태", width: 100 },
      { field: "label", headerName: "라벨상태", width: 100 },
      { field: "packing", headerName: "포장상태", width: 100 },
      { field: "printing", headerName: "인쇄상태", width: 100 },

      {
        field: "insulationOD1",
        headerName: "절연외경1",
        width: 100,
        type: "number",
      },
      {
        field: "insulationOD2",
        headerName: "절연외경2",
        width: 100,
        type: "number",
      },
      {
        field: "souterDiameter",
        headerName: "연선외경",
        width: 100,
        type: "number",
      },
      { field: "cond1", headerName: "도체경 1", width: 100, type: "number" },
      { field: "cond2", headerName: "도체경 2", width: 100, type: "number" },
      { field: "cond3", headerName: "도체경 3", width: 100, type: "number" },
      { field: "cond4", headerName: "도체경 4", width: 100, type: "number" },
    ],
    []
  );

  // 고전압 쉬즈
  const whexExtraColumns: GridColDef[] = useMemo(
    () => [
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
      {
        field: "oDiameter3",
        headerName: "완성외경 3",
        width: 100,
        type: "number",
      },
      {
        field: "oDiameter4",
        headerName: "완성외경 4",
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

      // 차폐도체경
      {
        field: "s_cond1",
        headerName: "차폐 도체경 1",
        width: 100,
        type: "number",
      },
      {
        field: "s_cond2",
        headerName: "차폐 도체경 2",
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
      {
        field: "shez_peel",
        headerName: "쉬즈 탈피력",
        width: 100,
        type: "number",
      },
      {
        field: "insul_peel",
        headerName: "절연 탈피력",
        width: 100,
        type: "number",
      },
    ],
    []
  );

  // 고전압 압출
  const whbsExtraColumns: GridColDef[] = useMemo(
    () => [
      { field: "appearance", headerName: "외관상태", width: 100 },
      { field: "color", headerName: "색상상태", width: 100 },
      { field: "printing", headerName: "인쇄상태", width: 100 },

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
      {
        field: "insulationOD3",
        headerName: "절연외경 3",
        width: 100,
        type: "number",
      },
      {
        field: "insulationOD4",
        headerName: "절연외경 4",
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

      // 절연두께 (1~6)
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
      {
        field: "insulThk5",
        headerName: "절연두께 5",
        width: 100,
        type: "number",
      },
      {
        field: "insulThk6",
        headerName: "절연두께 6",
        width: 100,
        type: "number",
      },
      {
        field: "eccentricity",
        headerName: "편심",
        width: 110,
        type: "number",
      },
      {
        field: "subStrandCnt",
        headerName: "소선수",
        width: 110,
        type: "number",
      },
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
      { field: "eccentricity", headerName: "편심율", width: 80 },
      { field: "s_check", headerName: "시료확인", width: 150 },
      { field: "decision", headerName: "판정", width: 80 },
      { field: "initFinal", headerName: "비고", width: 100 },
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
        field: "oDiameter3",
        headerName: "완성외경 3",
        width: 100,
        type: "number",
      },
      {
        field: "oDiameter4",
        headerName: "완성외경 4",
        width: 100,
        type: "number",
      },
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
      {
        field: "s_cond1",
        headerName: "편조 소선경 1",
        width: 100,
        type: "number",
      },
      {
        field: "s_cond2",
        headerName: "편조 소선경 2",
        width: 100,
        type: "number",
      },
      {
        field: "shez_peel",
        headerName: "쉬즈 탈피력",
        width: 100,
        type: "number",
      },
      {
        field: "insul_peel",
        headerName: "절연 탈피력",
        width: 100,
        type: "number",
      },
      { field: "initFinal", headerName: "구분", width: 100 },
      { field: "decision", headerName: "판정", width: 80 },
    ],
    []
  );

  const whbsSelectedColumns: GridColDef[] = useMemo(
    () => [
      { field: "no", headerName: "NO", width: 50 },
      { field: "itemName", headerName: "품명", width: 120 },
      { field: "std", headerName: "규격", width: 80 },
      { field: "p_color", headerName: "색상", width: 60 },
      { field: "lotNo", headerName: "LOT NO", width: 130 },
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
        field: "insulationOD3",
        headerName: "절연외경 3",
        width: 100,
        type: "number",
      },
      {
        field: "insulationOD4",
        headerName: "절연외경 4",
        width: 100,
        type: "number",
      },
      {
        field: "souterDiameter",
        headerName: "연선외경",
        width: 100,
        type: "number",
      },

      { field: "cond1", headerName: "도체경 1", width: 100, type: "number" },
      { field: "cond2", headerName: "도체경 2", width: 100, type: "number" },
      { field: "cond3", headerName: "도체경 3", width: 100, type: "number" },
      { field: "cond4", headerName: "도체경 4", width: 100, type: "number" },
      {
        field: "avg_insulThk",
        headerName: "절연평균",
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
      {
        field: "insulThk5",
        headerName: "절연두께 5",
        width: 100,
        type: "number",
      },
      {
        field: "insulThk6",
        headerName: "절연두께 6",
        width: 100,
        type: "number",
      },

      { field: "eccentricity", headerName: "편심", width: 80 },
      { field: "initFinal", headerName: "구분", width: 100 },
      { field: "decision", headerName: "판정", width: 80 },
    ],
    []
  );

  // -------------------- 최종 컬럼 --------------------
  const columns: GridColDef[] = useMemo(() => {
    if (effectiveKind === "wx") return [...commonColumns, ...wxExtraColumns];
    if (effectiveKind === "whbs")
      return [...commonColumns, ...whbsExtraColumns];
    return [...commonColumns, ...whexExtraColumns];
  }, [
    commonColumns,
    whexExtraColumns,
    wxExtraColumns,
    whbsExtraColumns,
    effectiveKind,
  ]);

  const selectedColumns: GridColDef[] = useMemo(() => {
    if (effectiveKind === "wx") return [...wxSelectedColumns];
    if (effectiveKind === "whbs") return [...whbsSelectedColumns];
    return [...whexSelectedColumns];
  }, [
    wxSelectedColumns,
    whbsSelectedColumns,
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
      effectiveKind === "whbs" ? filtered.map(buildPreviewRow) : filtered;

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
      const data = await initFinalinsp(sendData);
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
                effectiveKind === "wx"
                  ? "초종품검사(저전압 조사전).xlsx"
                  : effectiveKind === "whex"
                  ? "초종품검사(고전압 쉬즈).xlsx"
                  : "초종품검사(고전압 압출).xlsx"
              }
              label="엑셀 다운로드"
              buttonProps={{ variant: "contained" }}
              onBeforeDownload={handleBeforeExcelDownload}
              headerOptions={{
                title:
                  effectiveKind === "wx"
                    ? "압출 초종품 검사일지(조사전)"
                    : effectiveKind === "whex"
                    ? "초종품 검사일지(고전압 쉬즈)"
                    : "초종품 검사일지(고전압 압출)",
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
