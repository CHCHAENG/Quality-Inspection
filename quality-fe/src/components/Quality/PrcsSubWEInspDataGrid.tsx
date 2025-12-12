import { useMemo, useRef, useState } from "react";
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
  type FrontRow_WE,
  type WEProdStdRow,
  transformServerData_WE,
  transformWEProdStdData,
} from "../../utils/InspDataTrans/prcsSubInspTrans";
import dayjs, { Dayjs } from "dayjs";
import minMax from "dayjs/plugin/minMax";
import "dayjs/locale/ko";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { prcsSubWE, prcsSubWEProd } from "../../api/api";
import { extractErrorMessage } from "../../utils/Common/extractError";
import {
  buildPreviewRow,
  splitProcessNameStdColorSimple,
} from "../../utils/SelectedRow/prcsInsp";
import { useAlert } from "../../context/AlertContext";
import { ExcelDownloadButton } from "../Common/ExcelDownloadButton";
import { formatDateRange } from "../../utils/Common/formatDateRange";
import {
  getPrcsSubWEMainColumns,
  getPrcsSubWEHoGiColumns,
} from "../../utils/Columns/prcsSubWEInspColumns";
import { RowSelectionModelV8 } from "../../types/common";

dayjs.locale("ko");
dayjs.extend(minMax);

// 압출 호기 리스트
const HO_GI_LIST = [
  "압출 01 호기",
  "압출 02 호기",
  "압출 03 호기",
  "압출 04 호기",
  "압출 05 호기",
  "조사 04 호기",
  "조사 05 호기",
] as const;

type processName = (typeof HO_GI_LIST)[number];

// -------------------- sendData --------------------
function buildSendData(s: string, e: string) {
  // ITM_GRP=27 (압출-일반선)
  return `${s};${e};27;0;WE-01-01:1!WE-02-01:1!WE-03-01:1!WE-04-01:1!WE-05-01:1!WE-06-01:1!WE-06-01:2!WE-07-01:1!WE-08-01:1!WE-09-01:1!WE-09-01:2!WE-09-01:3!WE-09-01:4!WE-10-01:1!WE-10-01:2!WE-10-01:3!WE-10-01:4!WE-11-01:1!WE-12-01:1!WE-13-01:1!WE-14-01:1!;`;
}

function buildSendData2(s: string, e: string) {
  // ITM_GRP=28 (압출-조사선)
  return `${s};${e};28;0;WX-01-01:1!WX-02-01:1!WX-03-01:1!WX-04-01:1!WX-05-01:1!WX-06-01:1!WX-06-01:2!WX-07-01:1!WX-08-01:1!WX-09-01:1!WX-09-01:2!WX-09-01:3!WX-09-01:4!WX-10-01:1!WX-10-01:2!WX-10-01:3!WX-10-01:4!WX-11-01:1!WX-12-01:1!WX-13-01:1!WX-14-01:1!;`;
}

function buildSendDataProd(item: string) {
  return `${item};0;`;
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
    "조사 04 호기": undefined,
    "조사 05 호기": undefined,
  });
  const [weProdStdByHoGi, setWeProdStdByHoGi] = useState<
    Record<processName, WEProdStdRow[]>
  >({
    "압출 01 호기": [],
    "압출 02 호기": [],
    "압출 03 호기": [],
    "압출 04 호기": [],
    "압출 05 호기": [],
    "조사 04 호기": [],
    "조사 05 호기": [],
  });

  const { showAlert } = useAlert();

  const [selectedInspectors, setSelectedInspectors] = useState<string[]>([]);

  // -------------------- 컬럼 (헬퍼에서 가져오기) --------------------
  const mainColumns: GridColDef[] = useMemo(
    () => getPrcsSubWEMainColumns(),
    []
  );

  const hoGiColumns: GridColDef[] = useMemo(
    () => getPrcsSubWEHoGiColumns(),
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

  // -------------------- 호기 요약 rows --------------------
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
          subStrandCnt: r?.subStrandCnt,
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
          inspector: r ? String(r.inspector ?? "").trim() : "",
        };
      }),
    [hoGiMap]
  );

  // 선택한 행을 현재 선택한 압출호기에 저장 + 검사규격 데이터 저장
  async function handleApplyToHoGi() {
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

    if (!row.itemCode) {
      showAlert({
        message: "해당 행의 품목코드(itemCode)가 없습니다.",
        severity: "warning",
      });
      return;
    }

    const mySeq = reqSeq.current;
    const sendData = buildSendDataProd(row.itemCode);

    try {
      const data = await prcsSubWEProd(sendData);
      if (reqSeq.current !== mySeq) return;

      const stdRows = transformWEProdStdData(data);

      setWeProdStdByHoGi((prev) => ({
        ...prev,
        [selectedHoGi as processName]: stdRows,
      }));

      setHoGiMap((prev) => ({
        ...prev,
        [selectedHoGi]: row,
      }));

      setRowSelectionModel({
        type: "include",
        ids: new Set(),
      });

      showAlert({
        message: `${selectedHoGi} 값 저장이 완료되었습니다.`,
        severity: "success",
      });
    } catch (err) {
      if (reqSeq.current !== mySeq) return;

      const msg = extractErrorMessage(err);

      showAlert({
        message: msg || "검사규격 조회 중 오류가 발생했습니다.",
        severity: "error",
      });
    }
  }

  // -------------------- 선택된 행에서 검사자 목록 추출 --------------------
  const inspectorOptions = useMemo(() => {
    const set = new Set<string>();

    // 호기맵에 저장된 값 기준으로 검사자 수집
    HO_GI_LIST.forEach((hoGiName) => {
      const row = hoGiMap[hoGiName];
      const name = row?.inspector;
      if (name) {
        set.add(String(name).trim());
      }
    });

    return Array.from(set);
  }, [hoGiMap]);

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

  // -------------------- 조회 버튼 --------------------
  async function handleSearch() {
    if (!startDate || !endDate) return;

    const s = dayjs.min(startDate, endDate).format("YYYY-MM-DD");
    const e = dayjs.max(startDate, endDate).format("YYYY-MM-DD");

    const sendData1 = buildSendData(s, e); // 일반선
    const sendData2 = buildSendData2(s, e); // 조사선

    const mySeq = reqSeq.current;

    setLoading(true);
    try {
      const data1 = await prcsSubWE(sendData1);
      if (reqSeq.current !== mySeq) return;

      const data2 = await prcsSubWE(sendData2);
      if (reqSeq.current !== mySeq) return;

      // 두 결과 합쳐서 상태에 반영
      const merged: ServerRow[] = [...(data1 ?? []), ...(data2 ?? [])];

      setRawServerData(merged);
      setRowSelectionModel({ type: "include", ids: new Set() });
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
      setSelectedInspectors([]);

      // 조회 다시 할 때 호기 선택/데이터 초기화
      setSelectedHoGi("");
      setHoGiMap({
        "압출 01 호기": undefined,
        "압출 02 호기": undefined,
        "압출 03 호기": undefined,
        "압출 04 호기": undefined,
        "압출 05 호기": undefined,
        "조사 04 호기": undefined,
        "조사 05 호기": undefined,
      });

      setWeProdStdByHoGi({
        "압출 01 호기": [],
        "압출 02 호기": [],
        "압출 03 호기": [],
        "압출 04 호기": [],
        "압출 05 호기": [],
        "조사 04 호기": [],
        "조사 05 호기": [],
      });
    } catch (err) {
      if (reqSeq.current !== mySeq) return;

      const msg = extractErrorMessage(err);

      showAlert({
        message: msg || "조회 중 오류가 발생했습니다.",
        severity: "error",
      });

      setRawServerData([]);
      setSelectedInspectors([]);

      setWeProdStdByHoGi({
        "압출 01 호기": [],
        "압출 02 호기": [],
        "압출 03 호기": [],
        "압출 04 호기": [],
        "압출 05 호기": [],
        "조사 04 호기": [],
        "조사 05 호기": [],
      });
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

          {/* 엑셀 다운로드 (호기 요약 기준) */}
          <Stack direction="row" alignItems="center" spacing={1}>
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
              data={hoGiSummaryRows}
              columns={hoGiColumns}
              filename="순회검사_압출.xlsx"
              kind="transpose"
              label="엑셀 다운로드"
              buttonProps={{ variant: "contained" }}
              onBeforeDownload={handleBeforeExcelDownload}
              headerOptions={{
                title: "순회검사일지(압출)",
                inspectDateText: formatDateRange(startDate, endDate),
                inspectorNameText,
                showApprovalLine: true,
              }}
              transposeSource={weProdStdByHoGi}
            />
          </Stack>
        </Stack>
      </LocalizationProvider>

      {/* 메인 그리드 */}
      <Box sx={{ flex: 1, minWidth: 0, minHeight: 0 }}>
        <DataGrid
          rows={rows}
          columns={mainColumns}
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
      <Box sx={{ flex: 1, minWidth: 0, overflow: "auto", mb: 3 }}>
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

        <DataGrid rows={hoGiSummaryRows} columns={hoGiColumns} hideFooter />
      </Box>
    </Box>
  );
}
