import { BaseRow, WHEXFields } from "../InspDataTrans/finalSubInspTrans";

// ========== 완제품검사 ==========
export function splitProcessNameStdColor<T extends BaseRow>(
  r: T
): T & { std: string; p_color: string } {
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

export function getBraidedShieldValue<T extends WHEXFields>(
  r: T
): T & { br_shield: string } {
  const s = r.br_shield_s ?? "";
  const d = r.br_shield_d ?? "";

  const br_shield = s !== "" && d !== "" ? `${s}/${d}` : "";

  return {
    ...r,
    br_shield,
  };
}
