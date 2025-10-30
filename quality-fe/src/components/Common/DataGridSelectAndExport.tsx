import * as React from "react";
import { useMemo, useState } from "react";
import { Box, Stack, Button, Typography } from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridRowId,
  type GridPaginationModel,
} from "@mui/x-data-grid";
import * as XLSX from "xlsx";

// v8: RowSelectionModel 타입
type RowSelectionModelV8 = {
  type: "include" | "exclude";
  ids: Set<GridRowId>;
};

export default function DataGridSelectAndExport() {
  // 1) 컬럼
  const columns: GridColDef[] = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 80 },
      { field: "name", headerName: "이름", width: 140 },
      { field: "age", headerName: "나이", width: 100, type: "number" },
      { field: "email", headerName: "이메일", width: 220 },
      { field: "dept", headerName: "부서", width: 140 },
    ],
    []
  );

  // 2) 데이터
  const rows = useMemo(
    () => [
      {
        id: 1,
        name: "홍길동",
        age: 28,
        email: "hong@example.com",
        dept: "품질",
      },
      {
        id: 2,
        name: "김철수",
        age: 35,
        email: "kim@example.com",
        dept: "생산",
      },
      {
        id: 3,
        name: "이영희",
        age: 42,
        email: "lee@example.com",
        dept: "개발",
      },
      {
        id: 4,
        name: "박민수",
        age: 31,
        email: "park@example.com",
        dept: "구매",
      },
      {
        id: 5,
        name: "최유리",
        age: 26,
        email: "choi@example.com",
        dept: "품질",
      },
    ],
    []
  );

  // 3) 페이징 (컨트롤드)
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 5,
  });

  // 4) 선택 모델 (v8 형식)
  const [rowSelectionModel, setRowSelectionModel] =
    useState<RowSelectionModelV8>({
      type: "include",
      ids: new Set(),
    });

  // 5) 선택 행 추출 (v8: include/exclude 모두 대응)
  const selectedRows = useMemo(() => {
    if (rowSelectionModel.type === "include") {
      return rows.filter((r) => rowSelectionModel.ids.has(r.id as GridRowId));
    }
    // exclude: ids에 없는 모든 행이 선택된 것으로 간주
    return rows.filter((r) => !rowSelectionModel.ids.has(r.id as GridRowId));
  }, [rows, rowSelectionModel]);

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
      sx={{ display: "flex", flexDirection: "column", gap: 2, minHeight: 0 }}
    >
      {/* 상단 액션 */}
      <Stack direction="row" alignItems="center" spacing={1}>
        <Button
          variant="contained"
          onClick={() => exportToXlsx(rows, "전체데이터.xlsx")}
        >
          엑셀 다운로드 (전체)
        </Button>
        <Button
          variant="outlined"
          onClick={() => exportToXlsx(selectedRows, "선택데이터.xlsx")}
          disabled={selectedRows.length === 0}
        >
          엑셀 다운로드 (선택 행만)
        </Button>
        <Typography color="text.secondary" sx={{ ml: 1 }}>
          선택된 행: {selectedRows.length}개
        </Typography>
      </Stack>

      {/* 메인 그리드 */}
      <Box sx={{ height: 420, width: "100%", minHeight: 0 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          checkboxSelection
          disableRowSelectionOnClick
          pagination
          pageSizeOptions={[5, 10, 20]}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          rowSelectionModel={rowSelectionModel} // ✅ v8 객체 모델
          onRowSelectionModelChange={setRowSelectionModel} // ✅ v8 setter
        />
      </Box>

      {/* 선택 행 미리보기 */}
      <Box sx={{ width: "100%", minHeight: 0, overflow: "auto" }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          선택한 행 미리보기
        </Typography>
        <DataGrid
          rows={selectedRows}
          columns={columns}
          autoHeight
          pagination
          pageSizeOptions={[5, 10]}
          initialState={{
            pagination: { paginationModel: { page: 0, pageSize: 5 } },
          }}
          hideFooterSelectedRowCount
        />
      </Box>
    </Box>
  );
}
