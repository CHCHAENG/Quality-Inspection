import dayjs from "dayjs";

export function formatDateRange(
  start: string | Date | dayjs.Dayjs | null,
  end: string | Date | dayjs.Dayjs | null
) {
  if (!start || !end) return "";

  const s = dayjs(start).format("YYYY-MM-DD");
  const e = dayjs(end).format("YYYY-MM-DD");

  return `${s} ~ ${e}`;
}
