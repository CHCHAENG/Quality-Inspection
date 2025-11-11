import { DailyInspField } from "../mtrInspTrans";

// 절연 평균
function safeAvg(nums: Array<number | undefined>) {
  const arr = nums.filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v)
  );
  if (arr.length === 0) return undefined;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
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
