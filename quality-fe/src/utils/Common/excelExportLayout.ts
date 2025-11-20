import { GridColDef } from "@mui/x-data-grid";
import * as XLSX from "xlsx-js-style";

type ExcelCell = string | number | null;

export interface ExportHeaderOptions {
  title?: string;
  inspectDateText?: string;
  inspectorNameText?: string;
  showApprovalLine?: boolean;
}

// 엑셀 내보내기 (제네릭 버전)
export function exportToXlsxStyled<T extends Record<string, unknown>>(
  data: T[],
  columns: GridColDef<T>[],
  filename: string,
  kind?: string,
  onFinished?: (success: boolean) => void,
  headerOptions?: ExportHeaderOptions
) {
  // 1) 헤더 텍스트 배열 (DataGrid 헤더)
  const headers = columns.map((c) => c.headerName ?? String(c.field));

  // 2) 본문 AoA
  const rowsAoA: ExcelCell[][] = [];
  const printHistoryRowIdxList: number[] = [];

  data.forEach((row) => {
    const baseRow: ExcelCell[] = columns.map((c) => {
      const field = c.field as keyof T;
      const v = row[field];

      if (v === null || v === undefined) return null;
      if (typeof v === "number") return v;
      return String(v);
    });

    rowsAoA.push(baseRow);

    // final_whex 용 인쇄이력 행
    if (kind === "final_whex") {
      const printHistoryRow: ExcelCell[] = columns.map((_, idx) =>
        idx === 0 ? "인쇄이력" : ""
      );
      rowsAoA.push(printHistoryRow);
      printHistoryRowIdxList.push(rowsAoA.length - 1); // rowsAoA 기준 index
    }
  });

  const printHistoryRowIdxSet = new Set(printHistoryRowIdxList);

  // 기본 AoA (헤더 1행 + 본문)
  const baseAoA: ExcelCell[][] = [headers, ...rowsAoA];

  let finalAoA: ExcelCell[][] = baseAoA;
  let usedHeaders: string[] = headers;
  const usedBodyAoA: ExcelCell[][] = rowsAoA;

  const isTransposeLike = kind === "transpose" || kind === "transparse";

  // 순회검사(압출) 일 경우 행/열 변환
  if (isTransposeLike) {
    const rowCount = baseAoA.length;
    const colCount = baseAoA[0]?.length ?? 0;

    const transposed: ExcelCell[][] = [];

    for (let c = 0; c < colCount; c++) {
      const newRow: ExcelCell[] = [];
      for (let r = 0; r < rowCount; r++) {
        newRow.push(baseAoA[r]?.[c] ?? null);
      }
      transposed.push(newRow);
    }

    finalAoA = transposed;
    usedHeaders = (transposed[0] ?? []).map((v) => String(v ?? ""));
  }

  // ================================
  // 2.5) 상단 "제목/검사일/검사자/결재선" 행 만들기
  // ================================
  const extraHeaderRows: ExcelCell[][] = [];
  const colCountForHeader = finalAoA[0]?.length ?? 0;

  let inspectRowIndex = -1;
  let inspectorRowIndex = -1;
  let approvalBottomRowIndex = -1;

  if (colCountForHeader > 0 && headerOptions) {
    const { title, inspectDateText, inspectorNameText, showApprovalLine } =
      headerOptions;

    const useApproval = !!showApprovalLine;
    const approvalCols = useApproval ? 4 : 0;
    const approvalStartCol =
      approvalCols > 0
        ? Math.max(colCountForHeader - approvalCols, 0)
        : colCountForHeader;

    const makeBlankRow = () => new Array<ExcelCell>(colCountForHeader).fill("");

    const hasMeta = !!inspectDateText || !!inspectorNameText || useApproval;

    extraHeaderRows.push(makeBlankRow());

    // (1) 제목 행 (2번째 행)
    if (title) {
      const titleRow = makeBlankRow();
      titleRow[0] = title;
      extraHeaderRows.push(titleRow);
    }

    if (hasMeta) {
      extraHeaderRows.push(makeBlankRow());
    }

    // (2) 검사일 / 결재(상단 + 작성/검토/승인)
    if (inspectDateText || useApproval) {
      const row = makeBlankRow();
      if (inspectDateText) {
        row[0] = `검사일 : ${inspectDateText}`;
      }
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
      if (inspectorNameText) {
        row[0] = `검사자 : ${inspectorNameText}`;
      }
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

  // ================================
  // 3.5) 상단 제목/결재 영역 병합 설정
  // ================================
  const merges: XLSX.Range[] = ws["!merges"] ?? [];
  if (headerOffset > 0 && colCountForHeader > 0 && headerOptions) {
    const { title, inspectDateText, inspectorNameText, showApprovalLine } =
      headerOptions;

    const useApproval = !!showApprovalLine;
    const approvalCols = useApproval ? 4 : 0;
    const approvalStartCol =
      approvalCols > 0
        ? Math.max(colCountForHeader - approvalCols, 0)
        : colCountForHeader;

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
  const headerStyle = {
    border: {
      top: { style: "thin", color: { rgb: "FF5A6A7D" } },
      right: { style: "thin", color: { rgb: "FF5A6A7D" } },
      bottom: { style: "thin", color: { rgb: "FF5A6A7D" } },
      left: { style: "thin", color: { rgb: "FF5A6A7D" } },
    },
    font: { bold: true, sz: 10, color: { rgb: "FF000000" } },
    fill: { patternType: "solid", fgColor: { rgb: "FFC5D9F1" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
  };

  // 시트 범위
  const range = XLSX.utils.decode_range(ws["!ref"] as string);

  const bodyBorder = {
    top: { style: "thin", color: { rgb: "FF5A6A7D" } },
    right: { style: "thin", color: { rgb: "FF5A6A7D" } },
    bottom: { style: "thin", color: { rgb: "FF5A6A7D" } },
    left: { style: "thin", color: { rgb: "FF5A6A7D" } },
  };

  // (4-1) 맨 위 제목/결재 영역 스타일
  if (headerOffset > 0 && colCountForHeader > 0 && headerOptions) {
    const { title, inspectDateText, inspectorNameText, showApprovalLine } =
      headerOptions;

    const useApproval = !!showApprovalLine;
    const approvalCols = useApproval ? 4 : 0;
    const approvalStartCol =
      approvalCols > 0
        ? Math.max(colCountForHeader - approvalCols, 0)
        : colCountForHeader;

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

    if (hasMeta) {
      r++;
    }

    const metaRowsSet = new Set<number>();
    if (inspectRowIndex >= 0) metaRowsSet.add(inspectRowIndex);
    if (inspectorRowIndex >= 0) metaRowsSet.add(inspectorRowIndex);
    if (approvalBottomRowIndex >= 0) metaRowsSet.add(approvalBottomRowIndex);

    const metaRows = Array.from(metaRowsSet);

    for (const rowIdx of metaRows) {
      for (let c = 0; c < colCountForHeader; c++) {
        const addr = XLSX.utils.encode_cell({ r: rowIdx, c });
        if (!ws[addr]) {
          ws[addr] = { t: "s", v: "" };
        }

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
      if (!ws[addr]) {
        ws[addr] = { t: "s", v: "" };
      }

      const cell = ws[addr];
      const v = cell.v;
      const isNumCell = typeof v === "number";

      const prevStyle = cell.s || {};
      cell.s = {
        ...prevStyle,
        border: bodyBorder,
        alignment: {
          horizontal: isNumCell ? "right" : "left",
          vertical: "center",
          wrapText: true,
        },
        ...(isPrintHistoryRow
          ? {
              fill: {
                patternType: "solid",
                fgColor: { rgb: "FFFFFF00" },
              },
              font: {
                ...(prevStyle.font || {}),
                bold: true,
              },
            }
          : {}),
      };
    }
  }

  // 7) 열 너비 자동
  function visualLen(str: unknown) {
    return String(str ?? "")
      .split(/\r?\n/)
      .map((line) =>
        [...line].reduce(
          (acc, ch) => acc + (ch.charCodeAt(0) > 0xff ? 2 : 1),
          0
        )
      )
      .reduce((a, b) => Math.max(a, b), 0);
  }

  const widths = usedHeaders.map((header, cIdx) => {
    const headerLen = visualLen(header);
    const maxCellLen = usedBodyAoA.length
      ? Math.max(...usedBodyAoA.map((row) => visualLen(row[cIdx])))
      : 0;

    const pad = isTransposeLike ? 5 : columns[cIdx]?.type === "number" ? 3 : 5;

    const wch = Math.min(
      Math.max(Math.max(headerLen, maxCellLen) + pad, 10),
      60
    );
    return { wch };
  });

  ws["!cols"] = widths;

  // 8) "인쇄이력" 행 셀 병합 (A열 ~ 마지막 열)
  if (kind === "final_whex" && printHistoryRowIdxList.length > 0) {
    for (const idx of printHistoryRowIdxList) {
      const excelRow = bodyStartRow + idx;

      merges.push({
        s: { r: excelRow, c: 0 },
        e: { r: excelRow, c: columns.length - 1 },
      });
    }
  }

  if (merges.length > 0) {
    ws["!merges"] = merges;
  }

  // 9) 저장
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  try {
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
