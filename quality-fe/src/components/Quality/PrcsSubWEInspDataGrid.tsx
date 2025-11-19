import { useMemo, useRef, useState } from "react";
import {
  Box,
  Stack,
  Button,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
} from "../../utils/InspDataTrans/prcsSubInspTrans";
import dayjs, { Dayjs } from "dayjs";
import minMax from "dayjs/plugin/minMax";
import "dayjs/locale/ko";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { prcsSubWE } from "../../api/api";
import { extractErrorMessage } from "../../utils/Common/extractError";
import {
  buildPreviewRow,
  splitProcessNameStdColorSimple,
} from "../../utils/SelectedRow/prcsInsp";
import { useAlert } from "../../context/AlertContext";
import { ExcelDownloadButton } from "../Common/ExcelDownloadButton";

dayjs.locale("ko");
dayjs.extend(minMax);

type RowSelectionModelV8 = {
  type: "include" | "exclude";
  ids: Set<GridRowId>;
};

// 압출 호기 리스트
const HO_GI_LIST = [
  "압출 01 호기",
  "압출 02 호기",
  "압출 03 호기",
  "압출 04 호기",
  "압출 05 호기",
] as const;
type processName = (typeof HO_GI_LIST)[number];

// -------------------- sendData --------------------
function buildSendData(s: string, e: string) {
  // ITM_GRP=27 (압출)
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

  // 호기별 데이터 저장
  const [selectedHoGi, setSelectedHoGi] = useState<processName | "">("");
  const [hoGiMap, setHoGiMap] = useState<
    Record<processName, FrontRow_WE | undefined>
  >({
    "압출 01 호기": undefined,
    "압출 02 호기": undefined,
    "압출 03 호기": undefined,
    "압출 04 호기": undefined,
    "압출 05 호기": undefined,
  });

  const { showAlert } = useAlert();

  // -------------------- 공통 컬럼 --------------------
  const columns: GridColDef[] = useMemo(
    () => [
      { field: "actualDate", headerName: "생산일자", width: 110 },
      { field: "inspLot", headerName: "검사로트", width: 130 },
      { field: "itemCode", headerName: "품목코드", width: 130 },
      { field: "itemName", headerName: "품목명", width: 180 },
      { field: "processName_we", headerName: "생산호기", width: 120 },
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

  // -------------------- 호기 요약 테이블 --------------------
  const selectedColumns: GridColDef[] = useMemo(
    () => [
      { field: "hoGi", headerName: "압출호기", width: 120 },
      { field: "itemName", headerName: "품명", width: 150 },
      { field: "std", headerName: "규격", width: 90 },
      { field: "p_color", headerName: "색상", width: 70 },
      { field: "inspLot", headerName: "집합선LOT", width: 150 },
      { field: "sampleSize", headerName: "시료크기", width: 100 },
      { field: "printing", headerName: "인쇄상태", width: 100 },
      { field: "appearance", headerName: "겉모양", width: 100 },
      { field: "printing_hi", headerName: "인쇄내역", width: 100 },
      { field: "conductorConfig", headerName: "도체구성", width: 100 },
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
        field: "avg_insultaion",
        headerName: "절연외경평균",
        width: 120,
        type: "number",
      },
      {
        field: "souterDiameter",
        headerName: "연선외경",
        width: 110,
        type: "number",
      },
      {
        field: "avg_souterDiameter",
        headerName: "연선외경평균",
        width: 130,
        type: "number",
      },
      { field: "pitch", headerName: "피치", width: 90, type: "number" },
      { field: "cond1", headerName: "소선경1", width: 100, type: "number" },
      { field: "cond2", headerName: "소선경2", width: 100, type: "number" },
      { field: "cond3", headerName: "소선경3", width: 100, type: "number" },
      { field: "cond4", headerName: "소선경4", width: 100, type: "number" },
      {
        field: "avg_cond",
        headerName: "소선경평균",
        width: 120,
        type: "number",
      },
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
        headerName: "절연두께평균",
        width: 120,
        type: "number",
      },
      {
        field: "eccentricity",
        headerName: "편심율",
        width: 100,
        type: "number",
      },
      { field: "twistDirection", headerName: "꼬임방향", width: 100 },
      { field: "tensile", headerName: "인장강도", width: 120, type: "number" },
      { field: "elongation", headerName: "신장율", width: 110, type: "number" },
      { field: "result", headerName: "검사결과", width: 100 },
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

  const hoGiSummaryRows = useMemo(
    () =>
      HO_GI_LIST.map((hoGiName) => {
        const r = hoGiMap[hoGiName];

        const parsed = r
          ? splitProcessNameStdColorSimple(r)
          : { itemName: "", std: "", p_color: "" };

        const preview = buildPreviewRow(parsed);

        return {
          id: hoGiName,
          hoGi: hoGiName,
          itemName: parsed.itemName,
          std: parsed.std,
          p_color: parsed.p_color,
          inspLot: r?.inspLot,
          sampleSize: r?.sampleSize,
          printing: r?.printing,
          appearance: r?.appearance,
          conductorConfig: r?.conductorConfig,
          insulationOD1: r?.insulationOD1,
          insulationOD2: r?.insulationOD2,
          avg_insultaion: preview?.avg_insultaion,
          souterDiameter: r?.souterDiameter,
          avg_souterDiameter: r?.avg_souterDiameter ?? r?.souterDiameter,
          pitch: r?.pitch,
          cond1: r?.cond1,
          cond2: r?.cond2,
          cond3: r?.cond3,
          cond4: r?.cond4,
          avg_cond: preview?.avg_cond,
          insulThk1: r?.insulThk1,
          insulThk2: r?.insulThk2,
          insulThk3: r?.insulThk3,
          insulThk4: r?.insulThk4,
          avg_insulThk: preview?.avg_insulThk,
          eccentricity: r?.eccentricity,
          twistDirection: r?.twistDirection,
          tensile: r?.tensile,
          elongation: r?.elongation,
        };
      }),
    [hoGiMap]
  );

  // 선택한 행을 현재 선택한 압출호기에 저장
  function handleApplyToHoGi() {
    if (!selectedHoGi) return;
    if (selectedRows.length === 0) return;

    const row = selectedRows[0];

    // 생산호기 압출호기 확인
    if (row.processName_we !== selectedHoGi) {
      showAlert({
        message: "압출 호기별 설정 값을 확인해주세요.",
        severity: "warning",
      });
      return;
    }

    setHoGiMap((prev) => ({
      ...prev,
      [selectedHoGi]: row,
    }));

    setRowSelectionModel({
      type: "include",
      ids: new Set(),
    });

    showAlert({
      message: `${selectedHoGi} 값 설정이 완료되었습니다.`,
      severity: "success",
    });
  }

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

      // 조회 다시 할 때 호기 선택/데이터 초기화
      setSelectedHoGi("");
      setHoGiMap({
        "압출 01 호기": undefined,
        "압출 02 호기": undefined,
        "압출 03 호기": undefined,
        "압출 04 호기": undefined,
        "압출 05 호기": undefined,
      });
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

          {/* 엑셀 다운로드 (선택행 기준) */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <ExcelDownloadButton
              data={hoGiSummaryRows}
              columns={selectedColumns}
              filename="순회검사_압출.xlsx"
              kind="transpose"
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
          getRowId={(row) => row.inspLot}
          checkboxSelection
          disableRowSelectionOnClick
          pagination
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          rowSelectionModel={rowSelectionModel}
          onRowSelectionModelChange={setRowSelectionModel}
          isRowSelectable={(params) => {
            const selectedCount = rowSelectionModel.ids.size;
            if (selectedCount === 0) return true;
            return rowSelectionModel.ids.has(params.id);
          }}
          loading={loading}
          sx={{
            width: 1,
            height: 1,
            minWidth: 0,
            minHeight: 0,
            marginBottom: "20px",
            "& .MuiDataGrid-columnHeaderCheckbox .MuiDataGrid-checkboxInput": {
              display: "none",
            },
          }}
        />
      </Box>

      {/* 압출 호기별 설정 */}
      <Box sx={{ flex: 1, minWidth: 0, overflow: "auto", mb: 2 }}>
        <Stack
          direction="row"
          alignItems="baseline"
          spacing={2}
          sx={{ mb: 1, flexWrap: "wrap" }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            압출 호기별 설정
          </Typography>

          <FormControl size="small" sx={{ minWidth: 160, mt: 3 }}>
            <InputLabel id="ho-gi-select-label">압출 호기 선택</InputLabel>
            <Select
              labelId="ho-gi-select-label"
              label="압출 호기 선택"
              value={selectedHoGi}
              onChange={(e) => setSelectedHoGi(e.target.value as processName)}
            >
              {HO_GI_LIST.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            onClick={handleApplyToHoGi}
            disabled={!selectedHoGi || selectedRows.length === 0}
          >
            저장
          </Button>
        </Stack>

        <DataGrid rows={hoGiSummaryRows} columns={selectedColumns} hideFooter />
      </Box>
    </Box>
  );
}
