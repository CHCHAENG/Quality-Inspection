// ========== 순회검사일지 (압출) ==========

import { BaseRow_WE, WEFields } from "../InspDataTrans/prcsSubInspTrans";

export function splitProcessNameStdColorSimple(
  r: BaseRow_WE
): BaseRow_WE & { itemName: string; std: string; p_color: string } {
  const raw = (r.itemName ?? "").trim();

  const m = raw.match(/^(.*?)\s+([\d.]+)\s+([A-Za-z]+)(?:\s*\(.*\))?$/);

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

export function buildPreviewRow(r: WEFields): WEFields & {
  avg_insultaion?: number;
  avg_insulThk?: number;
  avg_cond?: number;
} {
  // 절연외경 평균
  const avg_insultaion = safeAvg([r.insulationOD1, r.insulationOD2]);

  // 절연두께 평균
  const avg_insulThk = safeAvg([
    r.insulThk1,
    r.insulThk2,
    r.insulThk3,
    r.insulThk4,
  ]);

  // 소선경 평균
  const avg_cond = safeAvg([r.cond1, r.cond2, r.cond3, r.cond4]);

  return {
    ...r,
    avg_insultaion,
    avg_insulThk,
    avg_cond,
  };
}
