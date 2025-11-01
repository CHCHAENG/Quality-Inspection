// src/utils/inspectTransform.ts
export type ServerRow = Record<string, unknown>;

export type FrontRow = {
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

  // 스크린샷 맞춤(우측)
  appearance: string; // 외관상태
  pitch?: number; // 피치
  strandCount?: number; // 가닥수
  twistDirection: string; // 꼬임방향(문자)
  outerDiameter?: number; // 연선외경
  cond1?: number; // 도체경1
  cond2?: number; // 도체경2
  cond3?: number; // 도체경3
  cond4?: number; // 도체경4

  vendorRemark: string;
};

// ===== 키 매핑(현장 규칙만 바꾸면 됨) =====
export const FIELD_KEYS = {
  appearance: "ST-03-02", // 외관상태
  pitch: "ST-01-01", // 피치
  strandCount: "ST-03-01", // 가닥수
  twistDirection: "ST-03-02", // 꼬임방향 (❗실제 키로 교체 필요)
  outerDiameter: "ST-04-01", // 연선외경
  conductorDiameters: [
    // 도체경1~4
    "ST-05-01",
    "ST-05-02",
    "ST-05-03",
    "ST-05-04",
  ] as const,
} as const;

// ===== 기본 유틸 =====
export const toNumber = (v: unknown): number | undefined => {
  if (v === null || v === undefined) return undefined;
  const n = Number(String(v).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : undefined;
};

export const toStringClean = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  return String(v).trim();
};

// 개별 행 변환
export function normalizeServerRow(s: ServerRow, idx: number): FrontRow {
  // 좌측 공통
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

  // 우측(스크린샷)
  const appearance = toStringClean(s[FIELD_KEYS.appearance]);
  const pitch = toNumber(s[FIELD_KEYS.pitch]);
  const strandCount = toNumber(s[FIELD_KEYS.strandCount]);
  const twistDirection = toStringClean(s[FIELD_KEYS.twistDirection]);
  const outerDiameter = toNumber(s[FIELD_KEYS.outerDiameter]);

  const [c1, c2, c3, c4] = FIELD_KEYS.conductorDiameters.map((k) =>
    toNumber(s[k])
  );

  // id는 reqNo+barcode 우선
  const id = reqNo || barcode ? `${reqNo}-${barcode || idx + 1}` : idx + 1;

  return {
    id,
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
    appearance,
    pitch,
    strandCount,
    twistDirection,
    outerDiameter,
    cond1: c1,
    cond2: c2,
    cond3: c3,
    cond4: c4,
    vendorRemark,
  };
}

// 배열 변환
export function transformServerData(arr: ServerRow[]): FrontRow[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((row, i) => normalizeServerRow(row, i));
}
