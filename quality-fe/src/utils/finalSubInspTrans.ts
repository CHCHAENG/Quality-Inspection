export type ServerRow = Record<string, unknown>;

export type BaseRow = {
  id: number | string;

  // 공통(좌측)
  barcode: string;
  lotNo: string;
  initFinal: string;
  itemCode: string;
  itemName: string;
  qty?: number;
  unit: string;
  decision: string;
  inspector: string;
  inspectedAt: string;
  actualDate: string;
  remark: string;
};

// 고전압선
export type WHEXFields = {
  appearance?: string;
  color?: string;
  label?: string;
  packing?: string;
  printing?: string;

  // 완성외경
  oDiameter1?: number;
  oDiameter2?: number;
  // 절연외경
  insulationOD1?: number;
  insulationOD2?: number;
  // 연선외경
  souterDiameter?: number;

  // 도체경
  cond1?: number;
  cond2?: number;
  cond3?: number;
  cond4?: number;
  //차폐도체경
  s_cond?: number;

  // 절연두께
  insulThk1?: number;
  insulThk2?: number;
  insulThk3?: number;
  insulThk4?: number;

  // 쉬즈두께
  shezThk1?: number;
  shezThk2?: number;
  shezThk3?: number;
  shezThk4?: number;

  // 인장강도
  tensile?: number;
  //신장률
  elongation?: number;
  //쉬즈인장강도
  //쉬즈신장률
  shez_tensile?: number;
  shez_elongation?: number;
  //소선수
  subStrandCnt?: number;
  //편조차폐(합)
  br_shield_s?: number;
  //편조차폐(타)
  br_shield_d?: number;
};

export type FrontRow = BaseRow & WHEXFields;

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
export const WHEX_FIELD_KEYS = {
  appearance: "WHEX-01-01-1", // 외관
  color: "WHEX-03-01-1", // 색상
  label: "WHEX-04-01-1", // 라벨
  packing: "WHEX-05-01-1", // 포장
  printing: "WHEX-06-01-1", // 인쇄

  //완성외경
  oDiameter: ["WHEX-07-01-1", "WHEX-07-01-2"] as const,

  // 절연외경(2포인트)
  insulationOD: ["WHEX-08-01-1", "WHEX-08-01-2"] as const,
  // 연선외경
  souterDiameter: "WHEX-09-01-1",

  // 도체경(1~4)
  cond: [
    "WHEX-10-01-1",
    "WHEX-10-01-2",
    "WHEX-10-01-3",
    "WHEX-10-01-4",
  ] as const,

  // 차폐도체경(단일)
  s_cond: "WHEX-11-01-1",

  // 절연두께(1~4)
  insulThk: [
    "WHEX-12-01-1",
    "WHEX-12-01-2",
    "WHEX-12-01-3",
    "WHEX-12-01-4",
  ] as const,

  // 쉬즈두께(1~4)
  shezThk: [
    "WHEX-13-01-1",
    "WHEX-13-01-2",
    "WHEX-13-01-3",
    "WHEX-13-01-4",
  ] as const,

  tensile: "WHEX-16-01-1", // 인장강도
  elongation: "WHEX-17-01-1", // 신장률
  shez_tensile: "WHEX-18-01-1", // 쉬즈 인장강도
  shez_elongation: "WHEX-19-01-1", // 쉬즈 신장률

  // 소선수
  subStrandCnt: "WHEX-21-01-1",

  // 편조차폐(합/타)
  br_shield_s: "WHEX-22-01-1",
  br_shield_d: "WHEX-23-01-1",
} as const;

// ===== 개별 행 변환 =====
export function normalizeServerRow(s: ServerRow, idx: number): FrontRow {
  // 공통(좌측)
  const barcode = toStringClean(s["MAX(A.BRCD)"]);
  const lotNo = toStringClean(s["MAX(G.LOTNO)"]);
  const initFinal = toStringClean(s["GET_CMNCD(MAX(D.GBNCD),'0')"]);
  const itemCode = toStringClean(s["MAX(A.ITMCD)"]);
  const itemName = toStringClean(s["MAX(C.ITMNM)"]);
  const qty = toNumber(s["MAX(E.QTY)"]);
  const unit = toStringClean(s["GET_CMNCD(MAX(C.UNIT),'0')"]);
  const decision = toStringClean(s["MAX(D.RST)"]);
  const inspector = toStringClean(s["MAX(F.USRNM)"]);
  const inspectedAt = toStringClean(
    s["DATE_FORMAT(MAX(A.REGDT),'%Y-%m-%d %H:%i')"]
  );
  const actualDate = (() => {
    const f = s["FDATE"];
    if (!f) return "";
    const iso = String(f);
    return iso.slice(0, 10);
  })();
  const remark = toStringClean(s["MAX(D.RMK)"]);

  const base: BaseRow = {
    id: barcode ? `${barcode}-${idx + 1}` : idx + 1,
    barcode,
    lotNo,
    initFinal,
    itemCode,
    itemName,
    qty,
    unit,
    decision,
    inspector,
    inspectedAt,
    actualDate,
    remark,
  };

  // ---- 고전압선(WHEX) ----
  const appearance = toStringClean(s[WHEX_FIELD_KEYS.appearance]);
  const color = toStringClean(s[WHEX_FIELD_KEYS.color]);
  const label = toStringClean(s[WHEX_FIELD_KEYS.label]);
  const packing = toStringClean(s[WHEX_FIELD_KEYS.packing]);
  const printing = toStringClean(s[WHEX_FIELD_KEYS.printing]);

  const [oDiameter1, oDiameter2] = WHEX_FIELD_KEYS.oDiameter.map((k) =>
    toNumber(s[k])
  );
  const [insulationOD1, insulationOD2] = WHEX_FIELD_KEYS.insulationOD.map((k) =>
    toNumber(s[k])
  );

  const souterDiameter = toNumber(s[WHEX_FIELD_KEYS.souterDiameter]);

  const [cond1, cond2, cond3, cond4] = (
    WHEX_FIELD_KEYS.cond as readonly string[]
  ).map((k) => toNumber(s[k]));
  const s_cond = toNumber(s[WHEX_FIELD_KEYS.s_cond]);
  const [insulThk1, insulThk2, insulThk3, insulThk4] = (
    WHEX_FIELD_KEYS.insulThk as readonly string[]
  ).map((k) => toNumber(s[k]));
  const [shezThk1, shezThk2, shezThk3, shezThk4] = (
    WHEX_FIELD_KEYS.shezThk as readonly string[]
  ).map((k) => toNumber(s[k]));

  const tensile = toNumber(s[WHEX_FIELD_KEYS.tensile]);
  const elongation = toNumber(s[WHEX_FIELD_KEYS.elongation]);
  const shez_tensile = toNumber(s[WHEX_FIELD_KEYS.shez_tensile]);
  const shez_elongation = toNumber(s[WHEX_FIELD_KEYS.shez_elongation]);
  const subStrandCnt = toNumber(s[WHEX_FIELD_KEYS.subStrandCnt]);

  const br_shield_s = toNumber(s[WHEX_FIELD_KEYS.br_shield_s]);
  const br_shield_d = toNumber(s[WHEX_FIELD_KEYS.br_shield_d]);

  return {
    ...base,
    appearance,
    color,
    label,
    packing,
    printing,
    oDiameter1,
    oDiameter2,
    insulationOD1,
    insulationOD2,
    souterDiameter,
    cond1,
    cond2,
    cond3,
    cond4,
    s_cond,
    insulThk1,
    insulThk2,
    insulThk3,
    insulThk4,
    shezThk1,
    shezThk2,
    shezThk3,
    shezThk4,
    tensile,
    elongation,
    shez_tensile,
    shez_elongation,
    subStrandCnt,
    br_shield_s,
    br_shield_d,
  };
}

// ===== 배열 변환 =====
export function transformServerData(arr: ServerRow[]): FrontRow[] {
  if (!Array.isArray(arr)) return [];
  console.log("data  ", arr);
  return arr.map((row, i) => normalizeServerRow(row, i));
}
