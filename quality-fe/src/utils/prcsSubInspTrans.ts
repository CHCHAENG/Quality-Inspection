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

// 연선
export type STFields = {
  appearance?: string; // 외관상태
  pitch?: number; // 피치
  strandCount?: number; // 가닥수
  twistDirection?: string; // 꼬임방향
  outerDiameter?: number; // 외경값
  cond1?: number;
  cond2?: number;
  cond3?: number;
  cond4?: number;
};

// 신선(단선)
export type DRFields = {
  appearance?: string;
  strandCount?: number;
  cond1?: number;
  cond2?: number;
  cond3?: number;
  cond4?: number;
};

export type FrontRow = BaseRow & STFields & DRFields;

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

  // ---- 신선(DR)
  const appearance = toStringClean(s[DR_FIELD_KEYS.appearance]); // 외관상태
  const strandCount = toNumber(s[DR_FIELD_KEYS.strandCount]); // 가닥수
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

// ===== 배열 변환 =====
export function transformServerData(
  arr: ServerRow[],
  kind: ItemKind
): FrontRow[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((row, i) => normalizeServerRow(row, i, kind));
}
