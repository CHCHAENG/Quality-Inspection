import { GridColDef } from "@mui/x-data-grid";
import * as XLSX from "xlsx-js-style";
import { visualLen } from "./visualLen";
import {
  ExportHeaderOptions,
  ExportRowHeightOptions,
  ExportWidthOptions,
} from "../../types/common";

type ExcelCell = string | number | null;

const TEMPLATE_URL = "/template.xlsx";

export function exportToXlsxStyled<T extends Record<string, unknown>>(
  data: T[],
  columns: GridColDef<T>[],
  filename: string,
  kind?: string,
  onFinished?: (success: boolean) => void,
  headerOptions?: ExportHeaderOptions,
  widthOptions?: ExportWidthOptions,
  heightOptions?: ExportRowHeightOptions
) {
  // 1) 헤더 텍스트 배열 (DataGrid 헤더)
  let headers = columns.map((c) => c.headerName ?? String(c.field));

  // 2) 본문 AoA
  const rowsAoA: ExcelCell[][] = [];
  const printHistoryRowIdxList: number[] = [];

  data.forEach((row) => {
    const baseRow: ExcelCell[] = columns.map((c) => {
      const field = c.field as keyof T;
      const v = row[field];

      if (v === null || v === undefined) return "-";
      if (typeof v === "number") return v;
      return String(v);
    });

    rowsAoA.push(baseRow);
  });

  const printHistoryRowIdxSet = new Set(printHistoryRowIdxList);
  const sampleHeaderName = "시료확인";
  const sampleColIndexRaw = headers.findIndex((h) => h === sampleHeaderName);

  const fieldKeys = columns.map((c) => String(c.field));

  if (
    (kind === "final_we" || kind === "initialFinal_wx") &&
    sampleColIndexRaw >= 0
  ) {
    headers = [
      ...headers.slice(0, sampleColIndexRaw + 1),
      "",
      ...headers.slice(sampleColIndexRaw + 1),
    ];

    for (let i = 0; i < rowsAoA.length; i++) {
      const r = rowsAoA[i];
      rowsAoA[i] = [
        ...r.slice(0, sampleColIndexRaw + 1),
        "",
        ...r.slice(sampleColIndexRaw + 1),
      ];
    }
  }

  const baseAoA: ExcelCell[][] = [headers, ...rowsAoA];
  const finalAoA: ExcelCell[][] = baseAoA;

  // ================================
  // 2.5) 상단 "제목/검사일/검사자/결재선"
  // ================================
  const extraHeaderRows: ExcelCell[][] = [];
  const colCountForHeader = finalAoA[0]?.length ?? 0;

  let inspectRowIndex = -1;
  let inspectorRowIndex = -1;
  let approvalBottomRowIndex = -1;

  const getApprovalStartCol = (colCount: number) => {
    const useApproval = !!headerOptions?.showApprovalLine;
    if (!useApproval) return colCount;

    const approvalCols = 4;

    if (
      (kind === "final_we" || kind === "initialFinal_wx") &&
      sampleColIndexRaw >= 0
    ) {
      return Math.min(sampleColIndexRaw, Math.max(colCount - approvalCols, 0));
    }

    return Math.max(colCount - approvalCols, 0);
  };

  if (colCountForHeader > 0 && headerOptions) {
    const { title, inspectDateText, inspectorNameText, showApprovalLine } =
      headerOptions;

    const useApproval = !!showApprovalLine;
    const approvalStartCol = getApprovalStartCol(colCountForHeader);

    const makeBlankRow = () => new Array<ExcelCell>(colCountForHeader).fill("");

    const hasMeta = !!inspectDateText || !!inspectorNameText || useApproval;

    extraHeaderRows.push(makeBlankRow());

    // (1) 제목 행
    if (title) {
      const titleRow = makeBlankRow();
      titleRow[0] = title;
      extraHeaderRows.push(titleRow);
    }

    if (hasMeta) {
      extraHeaderRows.push(makeBlankRow());
    }

    // (2) 검사일 / 결재
    if (inspectDateText || useApproval) {
      const row = makeBlankRow();
      if (inspectDateText) row[0] = `검사일 : ${inspectDateText}`;

      if (useApproval && approvalStartCol < colCountForHeader) {
        row[approvalStartCol] = "결재";
        if (approvalStartCol + 1 < colCountForHeader)
          row[approvalStartCol + 1] = "작성";
        if (approvalStartCol + 2 < colCountForHeader)
          row[approvalStartCol + 2] = "검토";
        if (approvalStartCol + 3 < colCountForHeader)
          row[approvalStartCol + 3] = "승인";
      }

      inspectRowIndex = extraHeaderRows.length;
      extraHeaderRows.push(row);
    }

    // (3) 검사자
    if (inspectorNameText || useApproval) {
      const row = makeBlankRow();
      if (inspectorNameText) row[0] = `검사자 : ${inspectorNameText}`;
      inspectorRowIndex = extraHeaderRows.length;
      extraHeaderRows.push(row);
    }

    // (4) 결재 박스 3번째 행
    if (useApproval) {
      approvalBottomRowIndex = extraHeaderRows.length;
      extraHeaderRows.push(makeBlankRow());
    }

    extraHeaderRows.push(makeBlankRow());
  }

  const headerOffset = extraHeaderRows.length;
  const sheetAoA: ExcelCell[][] =
    headerOffset > 0 ? [...extraHeaderRows, ...finalAoA] : finalAoA;

  // 3) AoA -> Sheet
  const ws = XLSX.utils.aoa_to_sheet(sheetAoA);

  const range = XLSX.utils.decode_range(ws["!ref"] as string);

  const f_headerRowIndex = headerOffset;
  const f_bodyStartRow = f_headerRowIndex + 1;

  const headerHpt = heightOptions?.headerHpt ?? 33;
  const bodyHpt = heightOptions?.bodyHpt ?? 18;

  const wsAny = ws as XLSX.WorkSheet & { "!rows"?: { hpt?: number }[] };
  wsAny["!rows"] = wsAny["!rows"] ?? [];

  // 필드명 행 높이
  wsAny["!rows"][f_headerRowIndex] = {
    ...(wsAny["!rows"][f_headerRowIndex] || {}),
    hpt: headerHpt,
  };

  // 본문 행 높이
  for (let r = f_bodyStartRow; r <= range.e.r; r++) {
    wsAny["!rows"][r] = { ...(wsAny["!rows"][r] || {}), hpt: bodyHpt };
  }

  ws["!rows"] = ws["!rows"] ?? [];
  ws["!rows"][4] = { hpt: 28.5 };
  ws["!rows"][5] = { hpt: 28.5 };

  // ================================
  // 3.5) 상단 제목/결재 영역 병합 설정
  // ================================
  const merges: XLSX.Range[] = ws["!merges"] ?? [];

  if (headerOffset > 0 && colCountForHeader > 0 && headerOptions) {
    const { title, inspectDateText, inspectorNameText, showApprovalLine } =
      headerOptions;

    const useApproval = !!showApprovalLine;
    const approvalCols = useApproval ? 4 : 0;
    const approvalStartCol = getApprovalStartCol(colCountForHeader);

    if (title) {
      merges.push({
        s: { r: 1, c: 0 },
        e: { r: 1, c: colCountForHeader - 1 },
      });
    }

    if (inspectRowIndex >= 0 && inspectDateText && approvalStartCol > 0) {
      merges.push({
        s: { r: inspectRowIndex, c: 0 },
        e: { r: inspectRowIndex, c: approvalStartCol - 1 },
      });
    }

    if (inspectorRowIndex >= 0 && inspectorNameText && approvalStartCol > 0) {
      merges.push({
        s: { r: inspectorRowIndex, c: 0 },
        e: { r: inspectorRowIndex, c: approvalStartCol - 1 },
      });
    }

    if (
      useApproval &&
      inspectRowIndex >= 0 &&
      inspectorRowIndex >= 0 &&
      approvalBottomRowIndex >= 0 &&
      approvalStartCol < colCountForHeader
    ) {
      const top = inspectRowIndex;
      const middle = inspectorRowIndex;
      const bottom = approvalBottomRowIndex;

      merges.push({
        s: { r: top, c: approvalStartCol },
        e: { r: bottom, c: approvalStartCol },
      });

      for (let i = 1; i < approvalCols; i++) {
        const col = approvalStartCol + i;
        if (col >= colCountForHeader) break;

        merges.push({
          s: { r: middle, c: col },
          e: { r: bottom, c: col },
        });
      }
    }
  }

  // 4) 스타일 설정

  const bodyBorder = {
    top: { style: "thin", color: { rgb: "FF5A6A7D" } },
    right: { style: "thin", color: { rgb: "FF5A6A7D" } },
    bottom: { style: "thin", color: { rgb: "FF5A6A7D" } },
    left: { style: "thin", color: { rgb: "FF5A6A7D" } },
  };

  const headerStyle = {
    border: bodyBorder,
    font: { bold: true, sz: 10, color: { rgb: "FF000000" } },
    fill: { patternType: "solid", fgColor: { rgb: "FFC5D9F1" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
  };

  // (4-1) 맨 위 제목/결재 영역 스타일
  if (headerOffset > 0 && colCountForHeader > 0 && headerOptions) {
    const { title, inspectDateText, inspectorNameText, showApprovalLine } =
      headerOptions;

    const useApproval = !!showApprovalLine;
    const approvalCols = useApproval ? 4 : 0;
    const approvalStartCol = getApprovalStartCol(colCountForHeader);

    const hasMeta =
      !!inspectDateText || !!inspectorNameText || !!showApprovalLine;

    let r = 1;

    if (title) {
      for (let c = 0; c < colCountForHeader; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        if (!ws[addr]) continue;
        ws[addr].s = {
          ...(ws[addr].s || {}),
          font: { bold: true, sz: 18 },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }
      r++;
    }

    if (hasMeta) r++;

    const metaRowsSet = new Set<number>();
    if (inspectRowIndex >= 0) metaRowsSet.add(inspectRowIndex);
    if (inspectorRowIndex >= 0) metaRowsSet.add(inspectorRowIndex);
    if (approvalBottomRowIndex >= 0) metaRowsSet.add(approvalBottomRowIndex);

    const metaRows = Array.from(metaRowsSet);

    for (const rowIdx of metaRows) {
      for (let c = 0; c < colCountForHeader; c++) {
        const addr = XLSX.utils.encode_cell({ r: rowIdx, c });
        if (!ws[addr]) ws[addr] = { t: "s", v: "" };

        const isApprovalBlock =
          useApproval &&
          approvalStartCol < colCountForHeader &&
          c >= approvalStartCol &&
          c < approvalStartCol + approvalCols;

        ws[addr].s = {
          ...(ws[addr].s || {}),
          alignment: {
            horizontal: c === 0 ? "left" : "center",
            vertical: "center",
            wrapText: true,
          },
          ...(isApprovalBlock ? { border: bodyBorder } : {}),
        };
      }
    }
  }

  // (4-2) DataGrid 헤더 행 스타일
  const headerRowIndex = headerOffset;
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: headerRowIndex, c });
    if (ws[addr]) ws[addr].s = headerStyle;
  }

  // (4-3) 본문 스타일링
  const bodyStartRow = headerRowIndex + 1;
  for (let r = bodyStartRow; r <= range.e.r; r++) {
    const logicalBodyIdx = r - bodyStartRow;
    const isPrintHistoryRow =
      kind === "final_whex" && printHistoryRowIdxSet.has(logicalBodyIdx);

    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) ws[addr] = { t: "s", v: "" };

      const cell = ws[addr];
      const prevStyle = cell.s || {};

      cell.s = {
        ...prevStyle,
        border: bodyBorder,
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        ...(isPrintHistoryRow
          ? {
              fill: { patternType: "solid", fgColor: { rgb: "FFFFFF00" } },
              font: { ...(prevStyle.font || {}), bold: true },
            }
          : {}),
      };
    }
  }

  const fixedSampleStartColIndex =
    kind === "final_we" || kind === "initialFinal_wx" ? sampleColIndexRaw : -1;

  if (ws["!ref"]) {
    const startRowForWidth = bodyStartRow;
    const colWidths: { wch: number }[] = [];

    // 결재 칸 너비
    const aw = widthOptions?.approvalWch;
    const approvalWch =
      aw &&
      aw.length === 4 &&
      aw.every((n) => typeof n === "number" && Number.isFinite(n) && n > 0)
        ? aw
        : undefined;

    const approvalStartCol =
      headerOptions?.showApprovalLine && colCountForHeader > 0
        ? getApprovalStartCol(colCountForHeader)
        : -1;

    const getApprovalWch = (c: number) => {
      if (!approvalWch) return undefined;
      if (approvalStartCol < 0) return undefined;
      const idx = c - approvalStartCol;
      if (idx < 0 || idx > 3) return undefined;
      return approvalWch[idx];
    };

    const widthByField = widthOptions?.colWchByField;
    const widthByIndex = widthOptions?.colWchByIndex;

    for (let c = range.s.c; c <= range.e.c; c++) {
      if (widthByIndex && widthByIndex[c] != null) {
        colWidths[c] = { wch: widthByIndex[c] };
        continue;
      }

      const field = fieldKeys[c]; // c번 엑셀 컬럼이 어떤 field인지
      const fw = field && widthByField ? widthByField[field] : undefined;
      if (fw != null && Number.isFinite(fw) && fw > 0) {
        colWidths[c] = { wch: fw };
        continue;
      }

      const awch = getApprovalWch(c);
      if (awch !== undefined) {
        colWidths[c] = { wch: awch };
        continue;
      }

      if (
        (kind === "final_we" || kind === "initialFinal_wx") &&
        fixedSampleStartColIndex >= 0
      ) {
        if (c === fixedSampleStartColIndex) {
          colWidths[c] = { wch: 15.86 };
          continue;
        }
        if (c === fixedSampleStartColIndex + 1) {
          colWidths[c] = { wch: 2 };
          continue;
        }
      }

      let maxLen = 0;
      for (let r = startRowForWidth; r <= range.e.r; r++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[addr];
        if (!cell || cell.v === undefined || cell.v === null) continue;

        const len = visualLen(cell.v);
        if (len > maxLen) maxLen = len;
      }

      const wch = Math.max(maxLen + 3.1, 5);
      colWidths[c] = { wch };
    }

    ws["!cols"] = colWidths;
  }

  // =========================================================
  // 6-1) final_we : 시료확인
  // =========================================================
  if (
    (kind === "final_we" || kind === "initialFinal_wx") &&
    sampleColIndexRaw >= 0
  ) {
    const START_EXCEL_ROW = 7;
    const c1 = sampleColIndexRaw;
    const c2 = sampleColIndexRaw + 1;

    for (let r = START_EXCEL_ROW; r <= range.e.r; r++) {
      merges.push({
        s: { r, c: c1 },
        e: { r, c: c2 },
      });
    }
  }

  if (merges.length > 0) {
    ws["!merges"] = merges;
  }

  // 7) 템플릿 읽기
  (async () => {
    try {
      const res = await fetch(TEMPLATE_URL);
      if (!res.ok) {
        throw new Error(`템플릿 로드 실패: ${res.status} ${res.statusText}`);
      }
      const arrayBuffer = await res.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: "array" });

      const sheetName = wb.SheetNames[0];
      wb.Sheets[sheetName] = ws;

      XLSX.writeFile(
        wb,
        filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`
      );
      onFinished?.(true);
    } catch (e) {
      console.error(e);
      onFinished?.(false);
    }
  })();
}
