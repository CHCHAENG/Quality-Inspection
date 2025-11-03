import { useMemo, useState } from "react";
import {
  Box,
  Stack,
  Button,
  Typography,
  CircularProgress,
  Alert,
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
} from "../../utils/mtrInspTrans";
import * as XLSX from "xlsx";
import dayjs, { Dayjs } from "dayjs";
import minMax from "dayjs/plugin/minMax";
import "dayjs/locale/ko";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { mtrInsp } from "../../api/api";
import { extractErrorMessage } from "../../utils/extractError";

dayjs.locale("ko");
dayjs.extend(minMax);

type RowSelectionModelV8 = {
  type: "include" | "exclude";
  ids: Set<GridRowId>;
};

export default function DataGridSelectAndExport() {
  // 1) 컬럼
  const columns: GridColDef[] = useMemo(
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
      { field: "appearance", headerName: "외관상태", width: 80 },
      { field: "pitch", headerName: "피치", width: 80, type: "number" },
      {
        field: "strandCount",
        headerName: "가닥수",
        width: 80,
        type: "number",
      },
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

  // 2) 데이터
  const [rawServerData, setRawServerData] = useState<ServerRow[]>([]);
  const rows = useMemo<FrontRow[]>(
    () => transformServerData(rawServerData),
    [rawServerData]
  );

  // 3) 페이징
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 5,
  });

  // 4) 선택 행
  const [rowSelectionModel, setRowSelectionModel] =
    useState<RowSelectionModelV8>({
      type: "include",
      ids: new Set(),
    });

  // 5) 선택 행 추출
  const selectedRows = useMemo(() => {
    if (rowSelectionModel.type === "include") {
      return rows.filter((r) =>
        rowSelectionModel.ids.has(r.barcode as GridRowId)
      );
    }
    return rows.filter(
      (r) => !rowSelectionModel.ids.has(r.barcode as GridRowId)
    );
  }, [rows, rowSelectionModel]);

  // 조회 조건 (시작/종료일)
  const [startDate, setStartDate] = useState<Dayjs | null>(
    dayjs().startOf("month")
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [loading, setLoading] = useState(false);

  // sendData 빌더 (프로시저 규격 맞춰 필요 시 수정)
  function buildSendData(s: string, e: string) {
    return `${s};${e};24;0;ST-00-01:1!ST-01-01:1!ST-03-01:1!ST-03-02:1!ST-04-01:1!ST-05-01:1!ST-05-01:2!ST-05-01:3!ST-05-01:4!;`;
  }

  // 조회 버튼 핸들러
  async function handleSearch() {
    if (!startDate || !endDate) return;

    const s = dayjs.min(startDate, endDate).format("YYYY-MM-DD");
    const e = dayjs.max(startDate, endDate).format("YYYY-MM-DD");

    const sendData = buildSendData(s, e);

    // console.log("data : ", sendData);
    setLoading(true);

    try {
      // 더미데이터 표시
      // setRawServerData(initialData);

      const data = await mtrInsp(sendData);
      setRawServerData(data ?? []);

      // 선택/페이지 초기화
      setRowSelectionModel({ type: "include", ids: new Set() });
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      <Alert severity="error">{msg}</Alert>;
      // console.error(err);
      setRawServerData([]);
    } finally {
      setLoading(false);
    }
  }

  // 6) 엑셀 내보내기
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
          {/* 시작/종료일 + 조회 */}
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
                exportToXlsx(selectedRows, "수입검사(원자재)_연선.xlsx")
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
          getRowId={(row) => row.barcode}
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
