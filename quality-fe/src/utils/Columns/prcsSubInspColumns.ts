// src/utils/Columns/prcsSubInspColumns.ts
import { GridColDef } from "@mui/x-data-grid";
import type { ItemKind } from "../InspDataTrans/prcsSubInspTrans";

// -------------------- 공통 컬럼 --------------------
export const PRCS_COMMON_COLUMNS: GridColDef[] = [
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
];

// -------------------- 연선(ST) 전용 메인 컬럼 --------------------
export const PRCS_ST_EXTRA_COLUMNS: GridColDef[] = [
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
];

// -------------------- 신선(DR) 전용 메인 컬럼 --------------------
export const PRCS_DR_EXTRA_COLUMNS: GridColDef[] = [
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
];

// -------------------- 메인 그리드 컬럼 헬퍼 --------------------
export function getPrcsSubColumns(kind: ItemKind): GridColDef[] {
  if (kind === "dr") {
    return [...PRCS_COMMON_COLUMNS, ...PRCS_DR_EXTRA_COLUMNS];
  }
  // 기본 ST
  return [...PRCS_COMMON_COLUMNS, ...PRCS_ST_EXTRA_COLUMNS];
}

// -------------------- 연선(ST) Selected 컬럼 --------------------
export const PRCS_ST_SELECTED_COLUMNS: GridColDef[] = [
  { field: "no", headerName: "NO", width: 50 },
  { field: "itemCode", headerName: "규격", width: 150 },
  { field: "lotNo", headerName: "LOT", width: 140 },
  { field: "appearance", headerName: "외관", width: 100 },
  { field: "strandCount", headerName: "소선수", width: 90, type: "number" },
  {
    field: "outerDiameter",
    headerName: "연선외경",
    width: 110,
    type: "number",
  },
  { field: "cond1", headerName: "소선경 1", width: 110, type: "number" },
  { field: "cond2", headerName: "소선경 2", width: 110, type: "number" },
  { field: "cond3", headerName: "소선경 3", width: 110, type: "number" },
  { field: "cond4", headerName: "소선경 4", width: 110, type: "number" },
  { field: "twistDirection", headerName: "꼬임방향", width: 100 },
  { field: "decision", headerName: "판정", width: 90 },
];

// -------------------- 신선(DR) Selected 컬럼 --------------------
export const PRCS_DR_SELECTED_COLUMNS: GridColDef[] = [
  { field: "no", headerName: "NO", width: 50 },
  { field: "itemCode", headerName: "규격", width: 150 },
  { field: "lotNo", headerName: "LOT", width: 140 },
  { field: "appearance", headerName: "외관", width: 100 },
  { field: "strandCount", headerName: "소선수", width: 90, type: "number" },
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
  { field: "decision", headerName: "판정", width: 90 },
];

// -------------------- Selected 컬럼 헬퍼 --------------------
export function getPrcsSubSelectedColumns(kind: ItemKind): GridColDef[] {
  if (kind === "dr") {
    return [...PRCS_DR_SELECTED_COLUMNS];
  }
  return [...PRCS_ST_SELECTED_COLUMNS];
}
