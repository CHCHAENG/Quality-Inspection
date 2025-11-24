import { BaseRow, WHBSFields } from "../InspDataTrans/initFinalSubInspTrans";

// ========== 품명 파싱 (제네릭) ==========
export function splitProcessNameStdColor<T extends BaseRow>(
  r: T
): T & { itemName: string; std: string; p_color: string } {
  const raw = (r.itemName ?? "").trim();

  const m = raw.match(/^(.*?)\s+([\d.]+)\s+([A-Za-z]+)\s*\((.*?)\)$/);

  const itemName = m ? m[1].trim() : raw;
  const std = m ? m[2].trim() : "";
  const p_color = m ? m[3].trim().toUpperCase() : "";

  return {
    ...r,
    itemName,
    std,
    p_color,
  };
}

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
  const arr = values.filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v)
  );
  if (arr.length < 2) return undefined;

  const max = Math.max(...arr);
  const min = Math.min(...arr);
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
  if (avg === 0) return undefined;

  const result = 100 - ((max - min) / avg) * 100;
  return Math.round(result * 10) / 10;
}

// ========== 미리보기 행 생성 (제네릭) ==========
export function buildPreviewRow<T extends WHBSFields>(
  r: T
): T & {
  avg_insulThk?: number;
  eccentricity?: number;
} {
  // 절연두께 평균
  const avg_insulThk = safeAvg([
    r.insulThk1,
    r.insulThk2,
    r.insulThk3,
    r.insulThk4,
    r.insulThk5,
    r.insulThk6,
  ]);

  // 편심율
  const eccentricity = calcEccentricityPercent([
    r.insulThk1,
    r.insulThk2,
    r.insulThk3,
    r.insulThk4,
    r.insulThk5,
    r.insulThk6,
  ]);

  return {
    ...r,
    avg_insulThk,
    eccentricity,
  };
}
