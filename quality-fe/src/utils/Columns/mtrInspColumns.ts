// src/utils/Columns/mtrInspColumns.ts
import { GridColDef } from "@mui/x-data-grid";
import type { ItemKind } from "../InspDataTrans/mtrInspTrans";

// -------------------- 공통 컬럼 --------------------
export const MTR_COMMON_COLUMNS: GridColDef[] = [
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
];

// -------------------- ST(연선) 메인 그리드 추가 컬럼 --------------------
export const MTR_ST_EXTRA_COLUMNS: GridColDef[] = [
  { field: "appearance", headerName: "외관상태", width: 80 },
  { field: "pitch", headerName: "피치", width: 80, type: "number" },
  { field: "packing", headerName: "포장상태", width: 80 },
  { field: "strandCount", headerName: "가닥수", width: 80, type: "number" },
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
];

// -------------------- PVC 메인 그리드 추가 컬럼 --------------------
export const MTR_PVC_EXTRA_COLUMNS: GridColDef[] = [
  { field: "pvcCheck1", headerName: "외관상태", width: 100 },
  { field: "pvcCheck2", headerName: "색상상태", width: 100 },
  { field: "pvcCheck3", headerName: "포장상태", width: 100 },
  { field: "vendorRemark", headerName: "비고(업체로트)", width: 160 },
];

// -------------------- SCR 메인 그리드 추가 컬럼 --------------------
export const MTR_SCR_EXTRA_COLUMNS: GridColDef[] = [
  { field: "appearance", headerName: "외관상태", width: 80 }, // CU-00-01
  { field: "cond1", headerName: "소선경1", width: 90, type: "number" }, // CU-01-01
  { field: "cond2", headerName: "소선경2", width: 90, type: "number" }, // CU-01-02
  { field: "cond3", headerName: "소선경3", width: 90, type: "number" }, // CU-01-03
  { field: "cond4", headerName: "소선경4", width: 90, type: "number" }, // CU-01-04
  { field: "packing", headerName: "포장상태", width: 90 },
  { field: "vendorRemark", headerName: "비고(업체로트)", width: 160 },
];

// -------------------- 메인 그리드 최종 컬럼 --------------------
export function getMtrInspColumns(kind: ItemKind): GridColDef[] {
  if (kind === "pvc") {
    return [...MTR_COMMON_COLUMNS, ...MTR_PVC_EXTRA_COLUMNS];
  }
  if (kind === "scr") {
    return [...MTR_COMMON_COLUMNS, ...MTR_SCR_EXTRA_COLUMNS];
  }
  // 기본 ST
  return [...MTR_COMMON_COLUMNS, ...MTR_ST_EXTRA_COLUMNS];
}

// -------------------- ST(연선) Selected 컬럼 --------------------
export const MTR_ST_SELECTED_COLUMNS: GridColDef[] = [
  { field: "no", headerName: "NO", width: 50 },
  { field: "vendor", headerName: "업체명", width: 160 },
  { field: "barcode", headerName: "LOT NO", width: 260 },
  { field: "itemCode", headerName: "규격", width: 80 },
  { field: "appearance", headerName: "외관", width: 80 },
  { field: "packing", headerName: "포장상태", width: 80 },
  { field: "strandCount", headerName: "소선수", width: 80 },
  { field: "outerDiameter", headerName: "연선외경", width: 80 },
  { field: "pitch", headerName: "피치", width: 80 },
  { field: "cond1", headerName: "도체경1", width: 100, type: "number" },
  { field: "cond2", headerName: "도체경2", width: 100, type: "number" },
  { field: "cond3", headerName: "도체경3", width: 100, type: "number" },
  { field: "cond4", headerName: "도체경4", width: 100, type: "number" },
  { field: "qty", headerName: "입고수량", width: 80, type: "number" },
  { field: "decision", headerName: "판정", width: 100 },
];

// -------------------- PVC Selected 컬럼 --------------------
export const MTR_PVC_SELECTED_COLUMNS: GridColDef[] = [
  { field: "no", headerName: "NO", width: 50 },
  { field: "vendor", headerName: "업체명", width: 160 },
  { field: "itemName", headerName: "품명", width: 180 },
  { field: "itemColor", headerName: "색상", width: 80 },
  { field: "barcode", headerName: "LOT NO", width: 260 },
  { field: "pvcCheck1", headerName: "외관상태", width: 100 },
  {
    field: "pvcCheck2",
    headerName: "색상(한도견본일치할것)",
    width: 100,
  },
  { field: "pvcCheck3", headerName: "포장상태", width: 100 },
  { field: "decision", headerName: "판정", width: 100 },
  { field: "vendorRemark", headerName: "비고", width: 160 },
];

// -------------------- SCR Selected 컬럼 --------------------
export const MTR_SCR_SELECTED_COLUMNS: GridColDef[] = [
  { field: "no", headerName: "NO", width: 50 },
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
  { field: "qty", headerName: "입고수량", width: 80, type: "number" },
  { field: "vendorRemark", headerName: "비고", width: 160 },
];

// -------------------- Selected 컬럼 최종 --------------------
export function getMtrInspSelectedColumns(kind: ItemKind): GridColDef[] {
  if (kind === "pvc") {
    return [...MTR_PVC_SELECTED_COLUMNS];
  }
  if (kind === "scr") {
    return [...MTR_SCR_SELECTED_COLUMNS];
  }
  return [...MTR_ST_SELECTED_COLUMNS];
}
