export type ServerRow = Record<string, unknown>;

export type BaseRow = {
  id: number | string;

  // 공통(좌측)
  barcode: string;
  lotNo: string; // 로트번호
  itemCode: string; // 품목코드
  itemName: string; // 품목명
  processName: string; // 생산공정
  actualDate: string; // 실검일자 (YYYY-MM-DD)
  qty?: number; // 수량
  unit: string; // 단위
  decision: string; // 결과 (OK/NG 등)
  inspector: string; // 검사자
  inspectedAt: string; // 검사일시 (YYYY-MM-DD HH:mm)
  remark: string; // 비고
};

export type BaseRow_WE = {
  id: number | string;

  actualDate: string;
  inspLot: string;
  itemCode: string;
  itemName: string;
  processName_we: string;
  roundTime: string;
  inspector: string;
  inspectedAt: string;
  remark: string;
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

// 신 선
export type DRFields = {
  appearance?: string;
  strandCount?: number;
  cond1?: number;
  cond2?: number;
  cond3?: number;
  cond4?: number;
};

// 압출
export type WEFields = {
  appearance?: string;
  color?: string;
  label?: string;
  packing?: string;
  printing?: string;

  insulationOD1?: number;
  insulationOD2?: number;
  souterDiameter?: number;
  eccentricity?: number;

  cond1?: number;
  cond2?: number;
  cond3?: number;
  cond4?: number;

  insulThk1?: number;
  insulThk2?: number;
  insulThk3?: number;
  insulThk4?: number;

  tensile?: number;
  elongation?: number;
  subStrandCnt?: number;
  pitch?: number;

  // selected
  std?: string;
  p_color?: string;
  sampleSize?: string;
  conductorConfig?: string;
  avg_insultaion?: number;
  avg_souterDiameter?: number;
  avg_cond?: number;
  avg_insulThk?: number;
  twistDirection?: string;
};

// 검사규격
export type WEProdStdRow = {
  inspCode: string;
  inspName: string;
  valMin: string;
  valMax: string;
};

export type FrontRow = BaseRow & STFields & DRFields;
export type FrontRow_WE = BaseRow_WE & WEFields;

export type ItemKind = "st" | "dr";

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

const DR_FIELD_KEYS = {
  appearance: "DR-01-01-1",
  strandCount: "DR-02-01-1",
  singleDiameters: [
    "DR-03-01-1",
    "DR-03-01-2",
    "DR-03-01-3",
    "DR-03-01-4",
  ] as const,
} as const;

const WE_FIELD_KEYS = {
  appearance: "WE-01-01-1",
  color: "WE-02-01-1",
  label: "WE-03-01-1",
  packing: "WE-04-01-1",
  printing: "WE-05-01-1",

  insulationOD: ["WE-06-01-1", "WE-06-01-2"] as const,
  souterDiameter: "WE-07-01-1",
  eccentricity: "WE-08-01-1",

  conductorDiameters: [
    "WE-09-01-1",
    "WE-09-01-2",
    "WE-09-01-3",
    "WE-09-01-4",
  ] as const,
  insulationThickness: [
    "WE-10-01-1",
    "WE-10-01-2",
    "WE-10-01-3",
    "WE-10-01-4",
  ] as const,

  tensile: "WE-11-01-1",
  elongation: "WE-12-01-1",
  subStrandCnt: "WE-13-01-1",
  pitch: "WE-14-01-1",
} as const;

const WE_PROD_STD_KEYS = {
  inspName:
    "CASE WHEN $i_LANG = '0' THEN B.INSPNM ELSE IFNULL(B.INSPNM_L, B.INSPNM) END",
} as const;

// ===== 개별 행 변환 (연선, 신선)=====
export function normalizeServerRow(
  s: ServerRow,
  idx: number,
  kind?: ItemKind
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

  const base: BaseRow = {
    id: barcode || lotNo ? `${barcode || lotNo}-${idx + 1}` : idx + 1,
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
  };

  // ---- 연선(ST) ----
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

  // ---- 신선(DR) ----
  const appearance = toStringClean(s[DR_FIELD_KEYS.appearance]);
  const strandCount = toNumber(s[DR_FIELD_KEYS.strandCount]);
  const [d1, d2, d3, d4] = DR_FIELD_KEYS.singleDiameters.map((k) =>
    toNumber(s[k])
  );

  return {
    ...base,
    appearance,
    strandCount,
    cond1: d1,
    cond2: d2,
    cond3: d3,
    cond4: d4,
  };
}

export function normalizeServerRow_WE(s: ServerRow, idx: number): FrontRow_WE {
  // 공통(좌측)
  const actualDate = (() => {
    const f = s["MAX(D.PDATE)"] ?? s["FDATE"];
    return f ? String(f).slice(0, 10) : "";
  })();

  const inspLot = toStringClean(s["MAX(A.INSPNO)"]);
  const itemCode = toStringClean(s["MAX(A.ITMCD)"]);
  const itemName = toStringClean(s["MAX(C.ITMNM)"]);
  const processName_we = toStringClean(
    s["MAX(CASE WHEN  '0'  = '0' THEN H.MCHNM ELSE H.MCHNM_L END)"]
  );
  const roundTime = toStringClean(s["ROUNDDT"]);
  const inspector = toStringClean(s["MAX(F.USRNM)"]);
  const inspectedAt =
    toStringClean(s["DATE_FORMAT(MAX(D.REGDT),'%Y-%m-%d %H:%i')"]) ||
    toStringClean(s["DATE_FORMAT(MAX(A.REGDT),'%Y-%m-%d %H:%i')"]);
  const remark = toStringClean(s["MAX(D.RMK)"]);

  const base: BaseRow_WE = {
    id: inspLot || itemCode ? `${inspLot || itemCode}-${idx + 1}` : idx + 1,
    actualDate,
    inspLot,
    itemCode,
    itemName,
    processName_we,
    roundTime,
    inspector,
    inspectedAt,
    remark,
  };
  // ---- 압출(WE) ----
  const appearance = toStringClean(s[WE_FIELD_KEYS.appearance]);
  const color = toStringClean(s[WE_FIELD_KEYS.color]);
  const label = toStringClean(s[WE_FIELD_KEYS.label]);
  const packing = toStringClean(s[WE_FIELD_KEYS.packing]);
  const printing = toStringClean(s[WE_FIELD_KEYS.printing]);

  const [insulationOD1, insulationOD2] = WE_FIELD_KEYS.insulationOD.map((k) =>
    toNumber(s[k])
  );
  const souterDiameter = toNumber(s[WE_FIELD_KEYS.souterDiameter]);
  const eccentricity = toNumber(s[WE_FIELD_KEYS.eccentricity]);

  const [cond1, cond2, cond3, cond4] = WE_FIELD_KEYS.conductorDiameters.map(
    (k) => toNumber(s[k])
  );
  const [insulThk1, insulThk2, insulThk3, insulThk4] =
    WE_FIELD_KEYS.insulationThickness.map((k) => toNumber(s[k]));

  const tensile = toNumber(s[WE_FIELD_KEYS.tensile]);
  const elongation = toNumber(s[WE_FIELD_KEYS.elongation]);
  const subStrandCnt = toNumber(s[WE_FIELD_KEYS.subStrandCnt]);
  const pitch = toNumber(s[WE_FIELD_KEYS.pitch]);

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
    eccentricity,
    cond1,
    cond2,
    cond3,
    cond4,
    insulThk1,
    insulThk2,
    insulThk3,
    insulThk4,
    tensile,
    elongation,
    subStrandCnt,
    pitch,
  };
}

export function normalizeWEProdStdRow(s: ServerRow): WEProdStdRow {
  const inspCode = toStringClean(s["INSPCD"]);
  const inspName = toStringClean(s[WE_PROD_STD_KEYS.inspName]);
  const valMin = toStringClean(s["VALMIN"]);
  const valMax = toStringClean(s["VALMAX"]);

  return {
    inspCode,
    inspName,
    valMin,
    valMax,
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

export function transformServerData_WE(arr: ServerRow[]): FrontRow_WE[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((row, i) => normalizeServerRow_WE(row, i));
}

export function transformWEProdStdData(arr: ServerRow[]): WEProdStdRow[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((row) => normalizeWEProdStdRow(row));
}
