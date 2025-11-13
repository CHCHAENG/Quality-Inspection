import { BaseRow } from "../InspDataTrans/finalSubInspTrans";

// ========== 완제품검사 ==========
export function splitProcessNameStdColor(
  r: BaseRow
): BaseRow & { itemName: string; std: string; p_color: string } {
  const raw = (r.itemName ?? "").trim();

  const m = raw.match(/^(.*?)\s+([\d.]+)\s+([A-Za-z]+)$/);

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
