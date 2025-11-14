import { BaseRow, WHEXFields } from "../InspDataTrans/finalSubInspTrans";

// ========== 완제품검사 ==========
export function splitProcessNameStdColor(
  r: BaseRow
): BaseRow & { itemName: string; std: string; p_color: string } {
  const raw = (r.itemName ?? "").trim();

  const m = raw.match(/^(.*?)\s+([\d.]+)\s+([A-Za-z]+)\s*$/);

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

export function getBraidedShieldValue(r: WHEXFields): WHEXFields & {
  br_shield_s?: number;
  br_shield_d?: number;
} {
  const s = r.br_shield_s ?? "";
  const d = r.br_shield_d ?? "";

  // 둘 다 값이 있으면 "합/타"로
  if (s !== "" && d !== "") return { ...r, br_shield: `${s}/${d}` };

  // 둘 다 없으면 빈 문자열
  return { ...r, br_shield: "" };
}
