import type { GridColDef, GridSortModel } from "@mui/x-data-grid";

export function keepRight15(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = String(v).trim();
  return s.length > 15 ? s.slice(-15) : s;
}

export function normalizeHeader(v: string | undefined): string {
  return (v ?? "").toUpperCase().replace(/\s+/g, "");
}

function getMaxDecimalScaleFromRows(
  rows: Record<string, unknown>[],
  field: string
): number {
  let max = 0;

  for (const r of rows) {
    const v = r[field];
    if (typeof v === "number" && Number.isFinite(v)) {
      const s = String(v);
      const idx = s.indexOf(".");
      if (idx >= 0) max = Math.max(max, s.length - idx - 1);
    }
  }

  return max;
}

function buildScaleMap(
  columns: GridColDef[],
  rows: Record<string, unknown>[]
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const c of columns) {
    if (c.type !== "number") continue;
    const scale = getMaxDecimalScaleFromRows(rows, c.field);
    if (scale > 0) map[c.field] = scale;
  }
  return map;
}

export function formatRowsForExcel(
  rows: Record<string, unknown>[],
  columns: GridColDef[]
): Record<string, unknown>[] {
  const scaleMap = buildScaleMap(columns, rows);

  const fields = Object.keys(scaleMap);
  if (fields.length === 0) return rows;

  return rows.map((r) => {
    const out: Record<string, unknown> = { ...r };

    for (const field of fields) {
      const v = out[field];
      const scale = scaleMap[field];

      if (typeof v === "number" && Number.isFinite(v)) {
        out[field] = v.toFixed(scale);
      }
    }

    return out;
  });
}

type WithId = { id: string | number };
type SortableRowBase = WithId & Record<string, unknown>;

function isNumberLike(v: unknown) {
  if (v == null) return false;
  const s = String(v).trim();
  if (!s) return false;
  return !Number.isNaN(Number(s));
}

function compareValues(a: unknown, b: unknown) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  if (isNumberLike(a) && isNumberLike(b)) {
    const na = Number(String(a).trim());
    const nb = Number(String(b).trim());
    return na === nb ? 0 : na < nb ? -1 : 1;
  }

  if (a instanceof Date && b instanceof Date) {
    const ta = a.getTime();
    const tb = b.getTime();
    return ta === tb ? 0 : ta < tb ? -1 : 1;
  }

  return String(a).localeCompare(String(b), "ko");
}

function getSortValue<Row extends SortableRowBase>(
  row: Row,
  col: GridColDef
): unknown {
  const raw = row[col.field];

  const vg = col.valueGetter;
  if (typeof vg !== "function") return raw;

  const fn = vg as unknown as (...args: unknown[]) => unknown;

  const params = {
    id: row.id,
    field: col.field,
    row,
    value: raw,
    api: undefined as unknown,
  };

  try {
    // valueGetter 시그니처 호환
    if (fn.length >= 2) return fn(raw, row, col, undefined);
    return fn(params);
  } catch {
    return raw;
  }
}

export function sortRowsByModel<Row extends SortableRowBase>(
  rows: readonly Row[],
  sortModel: GridSortModel,
  columns: readonly GridColDef[]
): Row[] {
  if (sortModel.length === 0) return [...rows];

  const columnMap = new Map(columns.map((c) => [c.field, c]));
  const indexed = rows.map((row, index) => ({ row, index }));

  indexed.sort((a, b) => {
    for (const { field, sort } of sortModel) {
      const col = columnMap.get(field);
      if (!col) continue;

      const av = getSortValue(a.row, col);
      const bv = getSortValue(b.row, col);

      const cmp = compareValues(av, bv);
      if (cmp !== 0) return sort === "desc" ? -cmp : cmp;
    }
    return a.index - b.index;
  });

  return indexed.map((x) => x.row);
}
