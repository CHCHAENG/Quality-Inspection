// src/utils/Columns/prcsSubWEInspColumns.ts
import { GridColDef } from "@mui/x-data-grid";

// -------------------- 메인 그리드 컬럼 (원본 rows) --------------------
export const PRCS_WE_MAIN_COLUMNS: GridColDef[] = [
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
];

// -------------------- 호기 요약(압출 호기별) 컬럼 --------------------
export const PRCS_WE_HOGI_COLUMNS: GridColDef[] = [
  { field: "hoGi", headerName: "압출호기", width: 120 },
  { field: "itemName", headerName: "품명", width: 150 },
  { field: "std", headerName: "규격", width: 90 },
  { field: "p_color", headerName: "색상", width: 70 },
  { field: "inspLot", headerName: "집합선LOT", width: 150 },
  { field: "printing", headerName: "인쇄상태", width: 100 },
  { field: "appearance", headerName: "겉모양", width: 100 },
  { field: "printing_his", headerName: "인쇄내역", width: 100 },
  { field: "subStrandCnt", headerName: "도체구성", width: 100 },
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
];

// -------------------- kind 기반 컬럼 조립 함수 --------------------
export function getPrcsSubWEMainColumns(): GridColDef[] {
  return [...PRCS_WE_MAIN_COLUMNS];
}

export function getPrcsSubWEHoGiColumns(): GridColDef[] {
  return [...PRCS_WE_HOGI_COLUMNS];
}
