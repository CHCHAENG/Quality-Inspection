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
  appearance?: string; // ST-03-02
  pitch?: number; // ST-01-01
  strandCount?: number; // ST-03-01
  twistDirection?: string; // ST-02-01
  outerDiameter?: number; // ST-04-01
  cond1?: number; // ST-05-01
  cond2?: number; // ST-05-02
  cond3?: number; // ST-05-03
  cond4?: number; // ST-05-04
};

// PVC
export type PVCFields = {
  pvcCheck1?: string; // PVC-01-01 → 외관상태
  pvcCheck2?: string; // PVC-02-01 → 색상상태
  pvcCheck3?: string; // PVC-03-01 → 포장상태
};

// SCR
export type SCRFields = {
  appearance?: string; // CU-00-01
  cond1?: number; // CU-01-01
  cond2?: number; // CU-01-02
  cond3?: number; // CU-01-03
  cond4?: number; // CU-01-04
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

// ===== 배열 변환 =====
export function transformServerData(
  arr: ServerRow[],
  kind: ItemKind
): FrontRow[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((row, i) => normalizeServerRow(row, i, kind));
}
