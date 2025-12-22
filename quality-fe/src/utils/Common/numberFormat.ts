import type { GridColDef, GridValueFormatter } from "@mui/x-data-grid";

export function getMaxDecimalScale(
  rows: Record<string, unknown>[],
  field: string
): number {
  let max = 0;

  for (const r of rows) {
    const v = r[field];
    if (typeof v === "number" && Number.isFinite(v)) {
      const s = v.toString();
      const idx = s.indexOf(".");
      if (idx >= 0) max = Math.max(max, s.length - idx - 1);
    }
  }
  return max;
}

export function withDecimalFormatter(
  columns: GridColDef[],
  rows: Record<string, unknown>[]
): GridColDef[] {
  return columns.map((col) => {
    if (col.type !== "number") return col;

    const scale = getMaxDecimalScale(rows, col.field);
    if (scale === 0) return col;

    const valueFormatter: GridValueFormatter = ((value: unknown) => {
      return typeof value === "number" && Number.isFinite(value)
        ? value.toFixed(scale)
        : "";
    }) as GridValueFormatter;

    return { ...col, valueFormatter };
  });
}
