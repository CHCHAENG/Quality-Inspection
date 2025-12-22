import { GridColDef } from "@mui/x-data-grid";

// 메인 그리드 컬럼
export const MTR_DAILY_COLUMNS: GridColDef[] = [
  { field: "vendor", headerName: "업체명", width: 140 },
  { field: "itemName", headerName: "품명", width: 120 },
  { field: "std", headerName: "규격", width: 80 },
  { field: "pColor", headerName: "색상", width: 80 },
  { field: "lotNo", headerName: "LOT NO", width: 160 },
  { field: "appearance", headerName: "외관", width: 80 },
  { field: "printing", headerName: "인쇄", width: 80, type: "number" },

  {
    field: "subStrandCnt",
    headerName: "소선수",
    width: 110,
    type: "number",
  },
  {
    field: "oDiameter",
    headerName: "완성외경",
    width: 110,
    type: "number",
  },
  {
    field: "shezThk",
    headerName: "쉬즈두께",
    width: 110,
    type: "number",
  },
  {
    field: "s_cond",
    headerName: "차폐경",
    width: 110,
    type: "number",
  },
  {
    field: "diameter1",
    headerName: "외경1",
    width: 110,
    type: "number",
  },
  {
    field: "diameter2",
    headerName: "외경2",
    width: 110,
    type: "number",
  },
  {
    field: "souterDiameter",
    headerName: "연선외경",
    width: 100,
    type: "number",
  },
  {
    field: "pitch",
    headerName: "피치(참고)",
    width: 90,
    type: "number",
  },
  {
    field: "cond1",
    headerName: "소선경1",
    width: 100,
    type: "number",
  },
  {
    field: "cond2",
    headerName: "소선경2",
    width: 100,
    type: "number",
  },
  {
    field: "cond3",
    headerName: "소선경3",
    width: 100,
    type: "number",
  },
  {
    field: "cond4",
    headerName: "소선경4",
    width: 100,
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
    field: "t_pitch",
    headerName: "연합피치",
    width: 100,
    type: "number",
  },
  {
    field: "tensile",
    headerName: "인장강도",
    width: 100,
    type: "number",
  },
  {
    field: "elongation",
    headerName: "신장률",
    width: 110,
    type: "number",
  },
  {
    field: "shez_tensile",
    headerName: "쉬즈 인장강도",
    width: 110,
    type: "number",
  },
  {
    field: "shez_elongation",
    headerName: "쉬즈 신장률",
    width: 110,
    type: "number",
  },
  { field: "inspector", headerName: "검사자", width: 100 },
];

// 선택 행 미리보기 그리드 컬럼
export const MTR_DAILY_SELECTED_COLUMNS: GridColDef[] = [
  { field: "no", headerName: "NO", width: 50 },
  { field: "vendor", headerName: "업체명", width: 140 },
  { field: "itemName", headerName: "품명", width: 120 },
  { field: "std", headerName: "규격", width: 80 },
  { field: "pColor", headerName: "색상", width: 80 },
  { field: "lotNo", headerName: "LOT NO", width: 160 },
  { field: "appearance", headerName: "외관", width: 80 },
  { field: "printing", headerName: "인쇄", width: 80, type: "number" },

  {
    field: "subStrandCnt",
    headerName: "소선수",
    width: 110,
    type: "number",
  },
  {
    field: "oDiameter",
    headerName: "완성외경",
    width: 110,
    type: "number",
  },
  {
    field: "shezThk",
    headerName: "쉬즈두께",
    width: 110,
    type: "number",
  },
  {
    field: "s_cond",
    headerName: "차폐경",
    width: 110,
    type: "number",
  },
  {
    field: "diameter1",
    headerName: "외경1",
    width: 110,
    type: "number",
  },
  {
    field: "diameter2",
    headerName: "외경2",
    width: 110,
    type: "number",
  },
  {
    field: "souterDiameter",
    headerName: "연선외경",
    width: 100,
    type: "number",
  },
  {
    field: "pitch",
    headerName: "피치(참고)",
    width: 90,
    type: "number",
  },
  {
    field: "cond1",
    headerName: "소선경1",
    width: 100,
    type: "number",
  },
  {
    field: "cond2",
    headerName: "소선경2",
    width: 100,
    type: "number",
  },
  {
    field: "cond3",
    headerName: "소선경3",
    width: 100,
    type: "number",
  },
  {
    field: "cond4",
    headerName: "소선경4",
    width: 100,
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
    headerName: "절연평균",
    width: 100,
    type: "number",
  },
  {
    field: "eccentricity",
    headerName: "편심율",
    width: 100,
    type: "number",
  },
  {
    field: "t_pitch",
    headerName: "연합피치",
    width: 100,
    type: "number",
  },
  {
    field: "tensile",
    headerName: "인장강도",
    width: 100,
    type: "number",
  },
  {
    field: "elongation",
    headerName: "신장률",
    width: 110,
    type: "number",
  },
  {
    field: "shez_tensile",
    headerName: "쉬즈 인장강도",
    width: 110,
    type: "number",
  },
  {
    field: "shez_elongation",
    headerName: "쉬즈 신장률",
    width: 110,
    type: "number",
  },
  { field: "inspector", headerName: "검사자", width: 100 },
];

export function getMtrDailyColumns(): GridColDef[] {
  return [...MTR_DAILY_COLUMNS];
}

export function getMtrDailySelectedColumns(): GridColDef[] {
  return [...MTR_DAILY_SELECTED_COLUMNS];
}
