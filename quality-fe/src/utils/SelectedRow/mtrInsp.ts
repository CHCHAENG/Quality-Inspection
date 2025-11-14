import { BaseRow, DailyInspField } from "../InspDataTrans/mtrInspTrans";

// ========== 원자재 수입검사일지 ==========
// PVC - 품명에서 색상 값 추출
export function splitItemNameAndColor(
  r: BaseRow
): BaseRow & { itemName: string; itemColor: string } {
  const rawName = (r.itemName ?? "").trim();
  const m = rawName.match(/^(.*?)[\s_-]*([A-Za-z]+)\s*\([^)]+\)\s*$/);
  const itemName = m ? m[1].trim() : rawName;
  const itemColor = m ? m[2].toUpperCase() : "";

  return {
    ...r,
    itemName,
    itemColor,
  };
}

// ========== 일일 수입검사일지 ==========
// 절연 평균
function safeAvg(nums: Array<number | undefined>) {
  const arr = nums.filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v)
  );
  if (arr.length === 0) return undefined;

  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.round(avg * 100) / 100;
}

// 편심율
function calcEccentricityPercent(values: Array<number | undefined>) {
  const arr = values.filter((v): v is number => Number.isFinite(v as number));
  if (arr.length < 2) return undefined;

  const max = Math.max(...arr);
  const min = Math.min(...arr);
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
  if (avg === 0) return undefined;

  const result = 100 - ((max - min) / avg) * 100;
  return Math.round(result * 10) / 10;
}

export function buildPreviewRow(r: DailyInspField): DailyInspField & {
  avg_insulThk?: number;
  eccentricity?: number;
} {
  // 절연두께 평균
  const avg_insulThk = safeAvg([
    r.insulThk1,
    r.insulThk2,
    r.insulThk3,
    r.insulThk4,
  ]);

  // 편심율
  const eccentricity = calcEccentricityPercent([
    r.insulThk1,
    r.insulThk2,
    r.insulThk3,
    r.insulThk4,
  ]);

  return {
    ...r,
    avg_insulThk,
    eccentricity,
  };
}
