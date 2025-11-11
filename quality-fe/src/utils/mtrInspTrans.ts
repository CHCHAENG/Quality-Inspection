export type ServerRow = Record<string, unknown>;

export type BaseRow = {
  id: number | string;

  // 공통(좌측)
  reqNo: string;
  vendor: string;
  itemCode: string;
  itemName: string;
  decision: string;
  barcode: string;
  qty?: number;
  unit: string;
  inspector: string;
  inspectedAt: string;
  remark: string;
  vendorRemark: string;
};

// 연선
export type STFields = {
  appearance?: string;
  pitch?: number;
  strandCount?: number;
  twistDirection?: string;
  outerDiameter?: number;
  cond1?: number;
  cond2?: number;
  cond3?: number;
  cond4?: number;
};

// PVC
export type PVCFields = {
  pvcCheck1?: string;
  pvcCheck2?: string;
  pvcCheck3?: string;
};

// SCR
export type SCRFields = {
  appearance?: string;
  cond1?: number;
  cond2?: number;
  cond3?: number;
  cond4?: number;
};

// 일일 수입검사일지
export type DailyInspField = {
  id: number | string;

  no?: number;
  vendor?: string;
  itemName?: string;
  std?: string;
  pColor: string;
  lotNo?: string;
  appearance?: string;
  printing?: number;
  subStrandCnt?: number;
  oDiameter?: number;
  shezThk?: number;
  s_cond?: number;
  diameter1?: number;
  diameter2?: number;
  souterDiameter?: number;
  pitch?: number;
  cond1?: number;
  cond2?: number;
  cond3?: number;
  cond4?: number;
  insulThk1?: number;
  insulThk2?: number;
  insulThk3?: number;
  insulThk4?: number;
  t_pitch?: number;
  tensile?: number;
  elongation?: number;
  shez_tensile?: number;
  shez_elongation?: number;

  // selected_row
  avg_insulThk?: number;
  eccentricity?: number;
};

export type FrontRow = BaseRow & STFields & PVCFields & SCRFields;

export type ItemKind = "st" | "pvc" | "scr";

// ===== 공통 유틸 =====
export const toNumber = (v: unknown): number | undefined => {
  if (v === null || v === undefined) return undefined;
  const n = Number(String(v).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : undefined;
};

export const toStringClean = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  return String(v).trim();
};

// ===== 스키마(필드 매핑) =====
const ST_FIELD_KEYS = {
  appearance: "ST-00-01-1",
  pitch: "ST-01-01-1",
  strandCount: "ST-03-01-1",
  twistDirection: "ST-03-02-1",
  outerDiameter: "ST-04-01-1",
  conductorDiameters: [
    "ST-05-01-1",
    "ST-05-01-2",
    "ST-05-01-3",
    "ST-05-01-4",
  ] as const,
} as const;

const PVC_FIELD_KEYS = {
  checks: ["PVC-01-01-1", "PVC-02-01-1", "PVC-03-01-1"] as const,
} as const;

const SCR_FIELD_KEYS = {
  appearance: "CU-00-01-1",
  conductorDiameters: [
    "CU-01-01-1",
    "CU-01-01-2",
    "CU-01-01-3",
    "CU-01-01-4",
  ] as const,
} as const;

const DAILY_FIELD_KEYS = {
  no: "NO",
  vendor: "CSTNM",
  itemName: "PSORT",
  std: "STD",
  pColor: "PCOLOR",
  lotNo: "LOTNO",
  appearance: "외관",
  printing: "인쇄",
  subStrandCnt: "소선수",
  oDiameter: "완성외경",
  shezThk: "쉬즈두께",
  s_cond: "차폐경",
  diameters: ["외경-1", "외경-2"],
  souterDiameter: "연선외경",
  pitch: "피치(참고)",
  cond: ["소선경-1", "소선경-2", "소선경-3", "소선경-4"],
  insulThk: ["절연두께-1", "절연두께-2", "절연두께-3", "절연두께-4"],
  t_pitch: "연합피치",
  tensile: "인장강도",
  elongation: "신장률",
  shez_tensile: "쉬즈 인장강도",
  shez_elongation: "쉬즈 신장률",
} as const;

// ===== 개별 행 변환 =====
export function normalizeServerRow(
  s: ServerRow,
  idx: number,
  kind: ItemKind
): FrontRow {
  // 공통(좌측)
  const reqNo = toStringClean(s["MAX(A.INSPNO)"]);
  const vendor = toStringClean(s["MAX(I.CSTNM)"]);
  const itemCode = toStringClean(s["MAX(A.ITMCD)"]);
  const itemName = toStringClean(s["MAX(C.ITMNM)"]);
  const decision = toStringClean(s["MAX(D.RST)"]);
  const barcode = toStringClean(s["BRCD"]);
  const qty = toNumber(s["MAX(E.QTY)"]);
  const unit = toStringClean(s["GET_CMNCD(MAX(C.UNIT),'0')"]);
  const inspector = toStringClean(s["MAX(F.USRNM)"]);
  const inspectedAt = toStringClean(
    s["DATE_FORMAT(MAX(A.REGDT),'%Y-%m-%d %H:%i')"]
  );
  const remark = toStringClean(s["MAX(D.RMK)"]);
  const vendorRemark = toStringClean(s["MAX(J.RMK)"]);

  const base: BaseRow = {
    id: reqNo || barcode ? `${reqNo}-${barcode || idx + 1}` : idx + 1,
    reqNo,
    vendor,
    itemCode,
    itemName,
    decision,
    barcode,
    qty,
    unit,
    inspector,
    inspectedAt,
    remark,
    vendorRemark,
  };

  // ---- 연선 ----
  if (kind === "st") {
    const appearance = toStringClean(s[ST_FIELD_KEYS.appearance]);
    const pitch = toNumber(s[ST_FIELD_KEYS.pitch]);
    const strandCount = toNumber(s[ST_FIELD_KEYS.strandCount]);
    const twistDirection = toStringClean(s[ST_FIELD_KEYS.twistDirection]);
    const outerDiameter = toNumber(s[ST_FIELD_KEYS.outerDiameter]);
    const [c1, c2, c3, c4] = ST_FIELD_KEYS.conductorDiameters.map((k) =>
      toNumber(s[k])
    );
    return {
      ...base,
      appearance,
      pitch,
      strandCount,
      twistDirection,
      outerDiameter,
      cond1: c1,
      cond2: c2,
      cond3: c3,
      cond4: c4,
    };
  }

  // ---- PVC ----
  if (kind === "pvc") {
    const [p1, p2, p3] = PVC_FIELD_KEYS.checks.map((k) => toStringClean(s[k]));
    return { ...base, pvcCheck1: p1, pvcCheck2: p2, pvcCheck3: p3 };
  }

  // ---- SCR ----
  const appearance = toStringClean(s[SCR_FIELD_KEYS.appearance]);
  const [c1, c2, c3, c4] = SCR_FIELD_KEYS.conductorDiameters.map((k) =>
    toNumber(s[k])
  );
  return { ...base, appearance, cond1: c1, cond2: c2, cond3: c3, cond4: c4 };
}

// ===== 개별 행 변환 =====
export function normalizeServerRow_Daily(
  s: ServerRow,
  idx: number
): DailyInspField {
  const no = toNumber(s[DAILY_FIELD_KEYS.no]);
  const vendor = toStringClean(s[DAILY_FIELD_KEYS.vendor]);
  const itemName = toStringClean(s[DAILY_FIELD_KEYS.itemName]);
  const std = toStringClean(s[DAILY_FIELD_KEYS.std]);
  const pColor = toStringClean(s[DAILY_FIELD_KEYS.pColor]);
  const lotNo = toStringClean(s[DAILY_FIELD_KEYS.lotNo]);
  const appearance = toStringClean(s[DAILY_FIELD_KEYS.appearance]);
  const printing = toNumber(s[DAILY_FIELD_KEYS.printing]);
  const subStrandCnt = toNumber(s[DAILY_FIELD_KEYS.subStrandCnt]);
  const oDiameter = toNumber(s[DAILY_FIELD_KEYS.oDiameter]);
  const shezThk = toNumber(s[DAILY_FIELD_KEYS.shezThk]);
  const s_cond = toNumber(s[DAILY_FIELD_KEYS.s_cond]);
  const [d1, d2] = DAILY_FIELD_KEYS.diameters.map((k) => toNumber(s[k]));
  const souterDiameter = toNumber(s[DAILY_FIELD_KEYS.souterDiameter]);
  const pitch = toNumber(s[DAILY_FIELD_KEYS.pitch]);
  const [c1, c2, c3, c4] = DAILY_FIELD_KEYS.cond.map((k) => toNumber(s[k]));
  const [i_Thk1, i_Thk2, i_Thk3, i_Thk4] = DAILY_FIELD_KEYS.insulThk.map((k) =>
    toNumber(s[k])
  );
  const t_pitch = toNumber(s[DAILY_FIELD_KEYS.t_pitch]);
  const tensile = toNumber(s[DAILY_FIELD_KEYS.tensile]);
  const elongation = toNumber(s[DAILY_FIELD_KEYS.elongation]);
  const shez_tensile = toNumber(s[DAILY_FIELD_KEYS.shez_tensile]);
  const shez_elongation = toNumber(s[DAILY_FIELD_KEYS.shez_elongation]);

  const id = no || lotNo ? `${no}-${lotNo || idx + 1}` : idx + 1;

  return {
    id,
    no,
    vendor,
    itemName,
    std,
    pColor,
    lotNo,
    appearance,
    printing,
    subStrandCnt,
    oDiameter,
    shezThk,
    s_cond,
    diameter1: d1,
    diameter2: d2,
    souterDiameter,
    pitch,
    cond1: c1,
    cond2: c2,
    cond3: c3,
    cond4: c4,
    insulThk1: i_Thk1,
    insulThk2: i_Thk2,
    insulThk3: i_Thk3,
    insulThk4: i_Thk4,
    t_pitch,
    tensile,
    elongation,
    shez_tensile,
    shez_elongation,
  };
}

// ===== 배열 변환 =====
export function transformServerData(
  arr: ServerRow[],
  kind: ItemKind
): FrontRow[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((row, i) => normalizeServerRow(row, i, kind));
}

export function transformServerData_Daliy(arr: ServerRow[]): DailyInspField[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((row, i) => normalizeServerRow_Daily(row, i));
}
