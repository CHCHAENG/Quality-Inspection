// src/utils/Columns/initFinalInspColumns.ts
import { GridColDef } from "@mui/x-data-grid";
import { ItemKind } from "../InspDataTrans/initFinalSubInspTrans";

// -------------------- 공통 컬럼 --------------------
export const COMMON_COLUMNS: GridColDef[] = [
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
];

// -------------------- WX (저전압 조사전) - extra columns --------------------
export const WX_EXTRA_COLUMNS: GridColDef[] = [
  { field: "appearance", headerName: "외관상태", width: 100 },
  { field: "color", headerName: "색상상태", width: 100 },
  { field: "label", headerName: "라벨상태", width: 100 },
  { field: "packing", headerName: "포장상태", width: 100 },
  { field: "printing", headerName: "인쇄상태", width: 100 },
  { field: "eccentricity_wx", headerName: "편심률(판정)", width: 100 },

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
];

// -------------------- WHEX (고전압 쉬즈) - extra columns --------------------
export const WHEX_EXTRA_COLUMNS: GridColDef[] = [
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
];

// -------------------- WHBS (고전압 압출) - extra columns --------------------
export const WHBS_EXTRA_COLUMNS: GridColDef[] = [
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
];

// -------------------- 선택행 미리보기용 컬럼 --------------------
export const WX_SELECTED_COLUMNS: GridColDef[] = [
  { field: "no", headerName: "NO", width: 50 },
  { field: "itemName", headerName: "품명", width: 120 },
  { field: "std", headerName: "규격", width: 80, type: "number" },
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
  { field: "eccentricity_wx", headerName: "편심율", width: 80 },
  { field: "s_check", headerName: "시료확인", width: 150 },
  { field: "decision", headerName: "판정", width: 80 },
  { field: "initFinal", headerName: "비고", width: 100 },
];

export const WHEX_SELECTED_COLUMNS: GridColDef[] = [
  { field: "no", headerName: "NO", width: 50 },
  { field: "itemName", headerName: "품명", width: 120 },
  { field: "std", headerName: "규격", width: 80, type: "number" },
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
];

export const WHBS_SELECTED_COLUMNS: GridColDef[] = [
  { field: "no", headerName: "NO", width: 50 },
  { field: "itemName", headerName: "품명", width: 120 },
  { field: "std", headerName: "규격", width: 80, type: "number" },
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

  { field: "eccentricity", headerName: "편심", width: 80, type: "number" },
  { field: "initFinal", headerName: "구분", width: 100 },
  { field: "decision", headerName: "판정", width: 80 },
];

// -------------------- kind 기반 컬럼 조립 함수 --------------------
export function getInitialFinalColumns(kind: ItemKind): GridColDef[] {
  if (kind === "wx") return [...COMMON_COLUMNS, ...WX_EXTRA_COLUMNS];
  if (kind === "whbs") return [...COMMON_COLUMNS, ...WHBS_EXTRA_COLUMNS];
  return [...COMMON_COLUMNS, ...WHEX_EXTRA_COLUMNS]; // 기본: whex
}

export function getInitialFinalSelectedColumns(kind: ItemKind): GridColDef[] {
  if (kind === "wx") return [...WX_SELECTED_COLUMNS];
  if (kind === "whbs") return [...WHBS_SELECTED_COLUMNS];
  return [...WHEX_SELECTED_COLUMNS]; // 기본: whex
}
