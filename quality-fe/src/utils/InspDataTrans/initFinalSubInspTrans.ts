export type ServerRow = Record<string, unknown>;

export type BaseRow = {
  id: number | string;

  // 공통(좌측)
  barcode: string;
  lotNo: string;
  itemCode: string;
  itemName: string;
  processName: string;
  actualDate: string;
  qty?: number;
  unit: string;
  decision: string;
  inspector: string;
  inspectedAt: string;
  remark: string;
  initFinal: string;
};

// 저전압 조사전
export type WXFields = {
  appearance?: string;
  color?: string;
  label?: string;
  packing?: string;
  printing?: string;

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
};

// 고전압 쉬즈
export type WHEXFields = {
  // 완성외경
  oDiameter1?: number;
  oDiameter2?: number;
  oDiameter3?: number;
  oDiameter4?: number;
  // 절연외경
  insulationOD1?: number;
  insulationOD2?: number;
  //차폐도체경
  s_cond1?: number;
  s_cond2?: number;
  // 쉬즈두께
  shezThk1?: number;
  shezThk2?: number;
  shezThk3?: number;
  shezThk4?: number;
  // 쉬즈 탈피력
  shez_peel?: number;
  // 절연 탈피력
  insul_peel?: number;
};

// 고전압 압출
export type WHBSFields = {
  appearance?: string;
  color?: string;
  printing?: string;

  // 절연외경
  insulationOD1?: number;
  insulationOD2?: number;
  insulationOD3?: number;
  insulationOD4?: number;
  // 연선외경
  souterDiameter?: number;
  // 소선경
  cond1?: number;
  cond2?: number;
  cond3?: number;
  cond4?: number;
  // 절연두께
  insulThk1?: number;
  insulThk2?: number;
  insulThk3?: number;
  insulThk4?: number;
  insulThk5?: number;
  insulThk6?: number;
  // 편심
  eccentricity?: number;
  //소선수
  subStrandCnt?: number;
};

export type FrontRow = BaseRow & WHEXFields & WXFields & WHBSFields;

export type ItemKind = "whex" | "whbs" | "wx";

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

// 저전압 조사전 스키마 =====
export const WX_FIELD_KEYS = {
  appearance: "WX-01-01-1",
  color: "WX-02-01-1",
  label: "WX-03-01-1",
  packing: "WX-04-01-1",
  printing: "WX-05-01-1",

  // 절연외경
  insulationOD1: "WX-06-01-1",
  insulationOD2: "WX-06-01-2",
  // 연선외경
  souterDiameter: "WX-07-01-1",

  // 도체경(1~4)
  cond: ["WX-09-01-1", "WX-09-01-2", "WX-09-01-3", "WX-09-01-4"] as const,
} as const;

// 고전압 쉬즈
export const WHEX_FIELD_KEYS = {
  //완성외경
  oDiameter: [
    "WHEX-07-01-1",
    "WHEX-07-01-2",
    "WHEX-07-01-3",
    "WHEX-07-01-4",
  ] as const,
  // 절연외경
  insulationOD: ["WHEX-08-01-1", "WHEX-08-01-2"] as const,
  // 차폐도체경
  s_cond: ["WHEX-11-01-1", "WHEX-11-01-2"] as const,
  // 쉬즈두께(1~4)
  shezThk: [
    "WHEX-13-01-1",
    "WHEX-13-01-2",
    "WHEX-13-01-3",
    "WHEX-13-01-4",
  ] as const,
  shez_peel: "WHEX-24-01-1",
  insul_peel: "WHEX-24-02-1",
} as const;

// 고전압 압출
export const WHBS_FIELD_KEYS = {
  appearance: "WHBS-01-01-1",
  color: "WHBS-02-01-1",
  printing: "WHBS-05-01-1",
  // 절연외경
  insulationOD1: "WHBS-06-01-1",
  insulationOD2: "WHBS-06-01-2",
  insulationOD3: "WHBS-06-01-3",
  insulationOD4: "WHBS-06-01-4",
  // 연선외경
  souterDiameter: "WHBS-07-01-1",
  // 소선경(1~4)
  cond: [
    "WHBS-08-01-1",
    "WHBS-08-01-2",
    "WHBS-08-01-3",
    "WHBS-08-01-4",
  ] as const,
  // 절연두께(1~6)
  insulThk: [
    "WHBS-09-01-1",
    "WHBS-09-01-2",
    "WHBS-09-01-3",
    "WHBS-09-01-4",
    "WHBS-09-01-5",
    "WHBS-09-01-6",
  ] as const,
  eccentricity: "WHBS-10-01-1",
  subStrandCnt: "WHBS-11-01-1",
} as const;

// ===== 개별 행 변환 =====
export function normalizeServerRow(
  s: ServerRow,
  idx: number,
  kind: ItemKind
): FrontRow {
  // 공통(좌측)
  const barcode = toStringClean(s["MAX(A.BRCD)"]);
  const lotNo = toStringClean(s["MAX(E.LOTNO)"]);
  const itemCode = toStringClean(s["MAX(A.ITMCD)"]);
  const itemName = toStringClean(s["MAX(C.ITMNM)"]);
  const processName = toStringClean(
    s["MAX(CASE WHEN '0' = '0' THEN H.MCHNM ELSE H.MCHNM_L END)"]
  );
  const actualDate = (() => {
    const f = s["FDATE"];
    if (!f) return "";
    const iso = String(f);
    return iso.slice(0, 10);
  })();
  const qty = toNumber(s["MAX(E.QTY)"]);
  const unit = toStringClean(s["GET_CMNCD(MAX(C.UNIT),'0')"]);
  const decision = toStringClean(s["MAX(D.RST)"]);
  const inspector = toStringClean(s["MAX(F.USRNM)"]);
  const inspectedAt = toStringClean(
    s["DATE_FORMAT(MAX(A.REGDT),'%Y-%m-%d %H:%i')"]
  );

  const remark = toStringClean(s["MAX(D.RMK)"]);
  const initFinal = toStringClean(
    s[
      "CASE WHEN IFNULL(MAX(D.GBNCD),'') = '' THEN '-' ELSE GET_CMNCD(MAX(D.GBNCD), '0') END"
    ]
  );

  const base: BaseRow = {
    id: barcode ? `${barcode}-${idx + 1}` : idx + 1,
    barcode,
    lotNo,
    itemCode,
    itemName,
    processName,
    actualDate,
    qty,
    unit,
    decision,
    inspector,
    inspectedAt,
    remark,
    initFinal,
  };

  // ---- 저전압 조사전 (WX) ----
  if (kind === "wx") {
    const appearance = toStringClean(s[WX_FIELD_KEYS.appearance]);
    const color = toStringClean(s[WX_FIELD_KEYS.color]);
    const label = toStringClean(s[WX_FIELD_KEYS.label]);
    const packing = toStringClean(s[WX_FIELD_KEYS.packing]);
    const printing = toStringClean(s[WX_FIELD_KEYS.printing]);
    const insulationOD1 = toNumber(s[WX_FIELD_KEYS.insulationOD1]);
    const insulationOD2 = toNumber(s[WX_FIELD_KEYS.insulationOD2]);
    const souterDiameter = toNumber(s[WX_FIELD_KEYS.souterDiameter]);
    const [cond1, cond2, cond3, cond4] = (
      WX_FIELD_KEYS.cond as readonly string[]
    ).map((k) => toNumber(s[k]));

    return {
      ...base,
      appearance,
      color,
      label,
      packing,
      printing,
      insulationOD1,
      insulationOD2,
      souterDiameter,
      cond1,
      cond2,
      cond3,
      cond4,
    };
  }

  // ---- 고전압선(WHEX) ----
  if (kind === "whex") {
    const [oDiameter1, oDiameter2, oDiameter3, oDiameter4] =
      WHEX_FIELD_KEYS.oDiameter.map((k) => toNumber(s[k]));
    const [insulationOD1, insulationOD2] = WHEX_FIELD_KEYS.insulationOD.map(
      (k) => toNumber(s[k])
    );
    const [s_cond1, s_cond2] = WHEX_FIELD_KEYS.s_cond.map((k) =>
      toNumber(s[k])
    );
    const [shezThk1, shezThk2, shezThk3, shezThk4] = (
      WHEX_FIELD_KEYS.shezThk as readonly string[]
    ).map((k) => toNumber(s[k]));
    const shez_peel = toNumber(s[WHEX_FIELD_KEYS.shez_peel]);
    const insul_peel = toNumber(s[WHEX_FIELD_KEYS.insul_peel]);

    return {
      ...base,
      oDiameter1,
      oDiameter2,
      oDiameter3,
      oDiameter4,
      insulationOD1,
      insulationOD2,
      s_cond1,
      s_cond2,
      shezThk1,
      shezThk2,
      shezThk3,
      shezThk4,
      shez_peel,
      insul_peel,
    };
  }

  // ---- 고전압 압출 (WHBS) ----
  const appearance = toStringClean(s[WHBS_FIELD_KEYS.appearance]);
  const color = toStringClean(s[WHBS_FIELD_KEYS.color]);
  const printing = toStringClean(s[WHBS_FIELD_KEYS.printing]);
  const insulationOD1 = toNumber(s[WHBS_FIELD_KEYS.insulationOD1]);
  const insulationOD2 = toNumber(s[WHBS_FIELD_KEYS.insulationOD2]);
  const insulationOD3 = toNumber(s[WHBS_FIELD_KEYS.insulationOD3]);
  const insulationOD4 = toNumber(s[WHBS_FIELD_KEYS.insulationOD4]);
  const souterDiameter = toNumber(s[WHBS_FIELD_KEYS.souterDiameter]);
  const [cond1, cond2, cond3, cond4] = (
    WHBS_FIELD_KEYS.cond as readonly string[]
  ).map((k) => toNumber(s[k]));
  const [insulThk1, insulThk2, insulThk3, insulThk4, insulThk5, insulThk6] = (
    WHBS_FIELD_KEYS.insulThk as readonly string[]
  ).map((k) => toNumber(s[k]));
  const eccentricity = toNumber(s[WHBS_FIELD_KEYS.eccentricity]);
  const subStrandCnt = toNumber(s[WHBS_FIELD_KEYS.subStrandCnt]);

  return {
    ...base,
    appearance,
    color,
    printing,
    insulationOD1,
    insulationOD2,
    insulationOD3,
    insulationOD4,
    souterDiameter,
    cond1,
    cond2,
    cond3,
    cond4,
    insulThk1,
    insulThk2,
    insulThk3,
    insulThk4,
    insulThk5,
    insulThk6,
    eccentricity,
    subStrandCnt,
  };
}

// ===== 배열 변환 =====
export function transformServerData(
  arr: ServerRow[],
  kind: ItemKind
): FrontRow[] {
  if (!Array.isArray(arr)) return [];

  // 고전압(쉬즈) WHEX-01-01-1 이 null인 행만 렌더링
  const filtered =
    kind === "whex"
      ? arr.filter(
          (row) => row["WHEX-01-01-1"] === null || row["WHEX-01-01-1"] === ""
        )
      : arr;

  return filtered.map((row, i) => normalizeServerRow(row, i, kind));
}
