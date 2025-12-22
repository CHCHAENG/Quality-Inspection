import { GridColDef } from "@mui/x-data-grid";
import * as XLSX from "xlsx-js-style";

type ExcelCell = string | number | null;

export interface ExportHeaderOptions {
  title?: string;
  inspectDateText?: string;
  inspectorNameText?: string;
  showApprovalLine?: boolean;
}

export function exportToXlsxStyledTransposedMerged<
  T extends Record<string, unknown>
>(
  data: T[],
  columns: GridColDef<T>[],
  filename: string,
  headerOptions?: ExportHeaderOptions,
  onFinished?: (success: boolean) => void
) {
  try {
    const MERGE_STOP_EXCEL_ROW = 13;
    const MERGE_STOP_R0 = MERGE_STOP_EXCEL_ROW - 1;

    // ----------------------------
    // 0) 입력 정리
    // ----------------------------
    const safeData = Array.isArray(data) ? data : [];
    const sampleCount = safeData.length;

    const labelCols = columns.filter((c) => {
      const h = (c.headerName ?? String(c.field)).trim();
      return h !== "NO" && String(c.field).toLowerCase() !== "no";
    });

    const labelNames = labelCols.map((c) =>
      (c.headerName ?? String(c.field)).trim()
    );

    const getCellValue = (row: T, col: GridColDef<T>): ExcelCell => {
      const field = col.field as keyof T;
      const v = row?.[field];

      if (v === null || v === undefined) return "-";
      if (typeof v === "number") return v;
      return String(v);
    };

    const totalCols = 1 + sampleCount * 2;
    const makeBlankRow = () => new Array<ExcelCell>(totalCols).fill("");

    // ----------------------------
    // 1) 메인 테이블 AoA
    // ----------------------------
    const tableHeaderRow = makeBlankRow();
    tableHeaderRow[0] = "NO";
    for (let i = 0; i < sampleCount; i++) {
      const cStart = 1 + i * 2;
      tableHeaderRow[cStart] = i + 1;
      tableHeaderRow[cStart + 1] = "";
    }

    const bodyRows: ExcelCell[][] = [];
    for (let li = 0; li < labelCols.length; li++) {
      const row = makeBlankRow();
      row[0] = labelNames[li];

      const colDef = labelCols[li];

      for (let si = 0; si < sampleCount; si++) {
        const cStart = 1 + si * 2;
        const cSecond = cStart + 1;
        row[cStart] = getCellValue(safeData[si], colDef);
        row[cSecond] = "";
      }

      bodyRows.push(row);
    }

    const mainAoA: ExcelCell[][] = [tableHeaderRow, ...bodyRows];

    // ----------------------------
    // 2) 상단 헤더
    // ----------------------------
    const extraHeaderRows: ExcelCell[][] = [];

    let titleRowIndex = -1;
    let inspectRowIndex = -1;
    let inspectorRowIndex = -1;
    let approvalBottomRowIndex = -1;
    let approvalStartCol = -1;

    if (headerOptions) {
      const { title, inspectDateText, inspectorNameText, showApprovalLine } =
        headerOptions;

      const useApproval = !!showApprovalLine;

      const approvalCols = useApproval ? 7 : 0;

      approvalStartCol =
        approvalCols > 0 ? Math.max(totalCols - approvalCols, 0) : -1;

      const hasMeta = !!inspectDateText || !!inspectorNameText || useApproval;

      extraHeaderRows.push(makeBlankRow());

      if (title) {
        const row = makeBlankRow();
        row[0] = title;
        titleRowIndex = extraHeaderRows.length;
        extraHeaderRows.push(row);
      }

      if (hasMeta) extraHeaderRows.push(makeBlankRow());

      if (inspectDateText || useApproval) {
        const row = makeBlankRow();
        if (inspectDateText) row[0] = `검사일 : ${inspectDateText}`;

        if (useApproval && approvalStartCol >= 0) {
          const base = approvalStartCol;

          row[base + 0] = "결재";

          row[base + 1] = "작성";
          row[base + 2] = "";

          row[base + 3] = "검토";
          row[base + 4] = "";

          row[base + 5] = "승인";
          row[base + 6] = "";
        }

        inspectRowIndex = extraHeaderRows.length;
        extraHeaderRows.push(row);
      }

      if (inspectorNameText || useApproval) {
        const row = makeBlankRow();
        if (inspectorNameText) row[0] = `검사자 : ${inspectorNameText}`;

        inspectorRowIndex = extraHeaderRows.length;
        extraHeaderRows.push(row);
      }

      if (useApproval) {
        extraHeaderRows.push(makeBlankRow());
        extraHeaderRows.push(makeBlankRow());
        approvalBottomRowIndex = extraHeaderRows.length - 1;
      }
    }

    const headerOffset = extraHeaderRows.length;
    const sheetAoA =
      headerOffset > 0 ? [...extraHeaderRows, ...mainAoA] : mainAoA;

    const tableHeaderExcelRow = headerOffset + 0;
    const firstBodyExcelRow = headerOffset + 1;

    // ----------------------------
    // 3) Sheet 생성
    // ----------------------------
    const ws = XLSX.utils.aoa_to_sheet(sheetAoA);

    // ----------------------------
    // 4) 병합(merge)
    // ----------------------------
    const merges: XLSX.Range[] = [];

    if (headerOptions?.title && titleRowIndex >= 0) {
      merges.push({
        s: { r: titleRowIndex, c: 0 },
        e: { r: titleRowIndex, c: totalCols - 1 },
      });
    }

    if (headerOptions?.showApprovalLine && approvalStartCol >= 0) {
      if (inspectRowIndex >= 0 && approvalStartCol > 0) {
        merges.push({
          s: { r: inspectRowIndex, c: 0 },
          e: { r: inspectRowIndex, c: approvalStartCol - 1 },
        });
      }
      if (inspectorRowIndex >= 0 && approvalStartCol > 0) {
        merges.push({
          s: { r: inspectorRowIndex, c: 0 },
          e: { r: inspectorRowIndex, c: approvalStartCol - 1 },
        });
      }

      if (
        inspectRowIndex >= 0 &&
        inspectorRowIndex >= 0 &&
        approvalBottomRowIndex >= 0
      ) {
        const base = approvalStartCol;

        merges.push({
          s: { r: inspectRowIndex, c: base + 0 },
          e: { r: approvalBottomRowIndex, c: base + 0 },
        });

        merges.push({
          s: { r: inspectRowIndex, c: base + 1 },
          e: { r: inspectRowIndex, c: base + 2 },
        });
        merges.push({
          s: { r: inspectorRowIndex, c: base + 1 },
          e: { r: approvalBottomRowIndex, c: base + 2 },
        });

        merges.push({
          s: { r: inspectRowIndex, c: base + 3 },
          e: { r: inspectRowIndex, c: base + 4 },
        });
        merges.push({
          s: { r: inspectorRowIndex, c: base + 3 },
          e: { r: approvalBottomRowIndex, c: base + 4 },
        });

        merges.push({
          s: { r: inspectRowIndex, c: base + 5 },
          e: { r: inspectRowIndex, c: base + 6 },
        });
        merges.push({
          s: { r: inspectorRowIndex, c: base + 5 },
          e: { r: approvalBottomRowIndex, c: base + 6 },
        });
      }
    }

    // 메인 테이블
    for (let i = 0; i < sampleCount; i++) {
      const cStart = 1 + i * 2;
      const cEnd = cStart + 1;

      if (tableHeaderExcelRow < MERGE_STOP_R0) {
        merges.push({
          s: { r: tableHeaderExcelRow, c: cStart },
          e: { r: tableHeaderExcelRow, c: cEnd },
        });
      }

      for (let li = 0; li < labelCols.length; li++) {
        const r = firstBodyExcelRow + li;
        if (r >= MERGE_STOP_R0) continue;
        merges.push({ s: { r, c: cStart }, e: { r, c: cEnd } });
      }
    }

    // 인쇄이력
    const RIGHT_MERGE_1_START = 13 - 1;
    const RIGHT_MERGE_1_END = 20 - 1;
    const RIGHT_MERGE_2_START = 21 - 1;

    const lastRow = firstBodyExcelRow + labelCols.length - 1;

    for (let si = 0; si < sampleCount; si++) {
      const cRight = 1 + si * 2 + 1;

      if (RIGHT_MERGE_1_START <= lastRow) {
        merges.push({
          s: { r: Math.max(RIGHT_MERGE_1_START, firstBodyExcelRow), c: cRight },
          e: { r: Math.min(RIGHT_MERGE_1_END, lastRow), c: cRight },
        });
      }

      if (RIGHT_MERGE_2_START <= lastRow) {
        merges.push({
          s: { r: Math.max(RIGHT_MERGE_2_START, firstBodyExcelRow), c: cRight },
          e: { r: lastRow, c: cRight },
        });
      }
    }

    // 인쇄이력
    const PRINT_HISTORY_ROW = 13 - 1;
    for (let si = 0; si < sampleCount; si++) {
      const cRight = 1 + si * 2 + 1;
      const r = Math.max(PRINT_HISTORY_ROW, firstBodyExcelRow);

      if (r <= lastRow) {
        const addr = XLSX.utils.encode_cell({ r, c: cRight });
        if (!ws[addr]) ws[addr] = { t: "s", v: "" };
        ws[addr].v = "인\n쇄\n이\n력";
        ws[addr].t = "s";
      }
    }

    ws["!merges"] = merges;

    // ----------------------------
    // 5) 스타일
    // ----------------------------
    const borderThin = {
      top: { style: "thin", color: { rgb: "FF5A6A7D" } },
      right: { style: "thin", color: { rgb: "FF5A6A7D" } },
      bottom: { style: "thin", color: { rgb: "FF5A6A7D" } },
      left: { style: "thin", color: { rgb: "FF5A6A7D" } },
    };

    const tableHeaderStyle = {
      border: borderThin,
      font: { bold: true, sz: 10, color: { rgb: "FF000000" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
    };

    const labelStyle = {
      border: borderThin,
      font: { bold: true, sz: 11, color: { rgb: "FF000000" } },
      fill: { patternType: "solid", fgColor: { rgb: "FFC5D9F1" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
    };

    const valueStyle = {
      border: borderThin,
      font: { sz: 10, color: { rgb: "FF000000" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
    };

    const titleStyle = {
      font: { bold: true, sz: 18, color: { rgb: "FF000000" } },
      alignment: { horizontal: "center", vertical: "center" },
    };

    if (titleRowIndex >= 0) {
      for (let c = 0; c < totalCols; c++) {
        const addr = XLSX.utils.encode_cell({ r: titleRowIndex, c });
        if (!ws[addr]) ws[addr] = { t: "s", v: "" };
        ws[addr].s = titleStyle;
      }
    }

    const metaLeftStyle = {
      alignment: { horizontal: "left", vertical: "center", wrapText: true },
      font: { sz: 11, color: { rgb: "FF000000" } },
    };
    if (inspectRowIndex >= 0) {
      const addr = XLSX.utils.encode_cell({ r: inspectRowIndex, c: 0 });
      if (ws[addr]) ws[addr].s = metaLeftStyle;
    }
    if (inspectorRowIndex >= 0) {
      const addr = XLSX.utils.encode_cell({ r: inspectorRowIndex, c: 0 });
      if (ws[addr]) ws[addr].s = metaLeftStyle;
    }

    // 결재 박스
    if (headerOptions?.showApprovalLine && approvalStartCol >= 0) {
      const top = inspectRowIndex;
      const mid = inspectorRowIndex;
      const bot = approvalBottomRowIndex;

      if (top >= 0 && mid >= 0 && bot >= 0) {
        for (let r = top; r <= bot; r++) {
          for (let c = approvalStartCol; c < approvalStartCol + 7; c++) {
            const addr = XLSX.utils.encode_cell({ r, c });
            if (!ws[addr]) ws[addr] = { t: "s", v: "" };
            ws[addr].s = {
              border: borderThin,
              alignment: {
                horizontal: "center",
                vertical: "center",
                wrapText: true,
              },
              font: {
                sz: 10,
                color: { rgb: "FF000000" },
              },
            };
          }
        }
      }
    }

    // 메인 테이블 헤더
    for (let c = 0; c < totalCols; c++) {
      const addr = XLSX.utils.encode_cell({ r: tableHeaderExcelRow, c });
      if (!ws[addr]) ws[addr] = { t: "s", v: "" };
      ws[addr].s = tableHeaderStyle;
    }

    {
      const addrA = XLSX.utils.encode_cell({ r: tableHeaderExcelRow, c: 0 });
      if (!ws[addrA]) ws[addrA] = { t: "s", v: "" };

      ws[addrA].s = {
        ...(ws[addrA].s ?? {}),
        fill: { patternType: "solid", fgColor: { rgb: "FFC5D9F1" } },
      };
    }

    // 본문
    for (let li = 0; li < labelCols.length; li++) {
      const r = firstBodyExcelRow + li;

      {
        const addr0 = XLSX.utils.encode_cell({ r, c: 0 });
        if (!ws[addr0]) ws[addr0] = { t: "s", v: "" };
        ws[addr0].s = labelStyle;
      }

      for (let c = 1; c < totalCols; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        if (!ws[addr]) ws[addr] = { t: "s", v: "" };
        ws[addr].s = valueStyle;
      }
    }

    // ----------------------------
    // 6) 열 너비
    // ----------------------------
    const cols = new Array<{ wch: number }>(totalCols).fill({ wch: 6.6 });
    cols[0] = { wch: 10.7 };
    ws["!cols"] = cols;

    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    const rows: { hpt?: number }[] = [];

    for (let r = 0; r <= range.e.r; r++) {
      if (r >= 7) {
        rows[r] = { hpt: 20.3 };
      }
    }

    ws["!rows"] = rows;
    // ----------------------------
    // 7) 저장
    // ----------------------------
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "검사일지");

    XLSX.writeFile(
      wb,
      filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`
    );
    onFinished?.(true);
  } catch (e) {
    console.error(e);
    onFinished?.(false);
  }
}
