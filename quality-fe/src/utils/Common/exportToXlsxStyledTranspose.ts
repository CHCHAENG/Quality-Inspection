import { GridColDef } from "@mui/x-data-grid";
import * as XLSX from "xlsx-js-style";
import { ExportHeaderOptions } from "./exportToXlsxStyled";
import { WEProdStdRow } from "../InspDataTrans/prcsSubInspTrans";

type ExcelCell = string | number | null;

export type WEProdStdByHoGi = Record<string, WEProdStdRow[]>;

const TEMPLATE_URL = "/template.xlsx";

export function exportToXlsxStyledTranspose<T extends Record<string, unknown>>(
  data: T[],
  columns: GridColDef<T>[],
  filename: string,
  onFinished?: (success: boolean) => void,
  headerOptions?: ExportHeaderOptions,
  weProdStdByHoGi?: WEProdStdByHoGi
) {
  // 1) 헤더 텍스트 배열
  const headers = columns.map((c) => c.headerName ?? String(c.field));

  // 2) 본문 AoA
  const rowsAoA: ExcelCell[][] = [];

  const normalize = (v: unknown) =>
    String(v ?? "")
      .replace(/\s+/g, "")
      .toUpperCase();

  data.forEach((row) => {
    const baseRow: ExcelCell[] = columns.map((c) => {
      const field = c.field as keyof T;
      const header = normalize(c.headerName ?? c.field);
      const v = row[field];

      if (header === "꼬임방향") {
        return "S";
      }

      if (header === "검사결과") {
        return "합격";
      }

      if (v === null || v === undefined) return null;
      if (typeof v === "number") return v;
      return String(v);
    });

    rowsAoA.push(baseRow);
  });

  const baseAoA: ExcelCell[][] = [headers, ...rowsAoA];

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

  const finalAoA: ExcelCell[][] = transposed;

  // ---------------------------------------
  // 2-1) 규격 행 삽입
  // ---------------------------------------
  if (weProdStdByHoGi && finalAoA.length > 1) {
    const headerRow = finalAoA[0];
    const colCountForRow = headerRow.length;

    const isNA = (v?: string) => !v || v.toUpperCase() === "N/A" || v === "-";

    const trimTrailingZero = (raw?: string): string => {
      if (!raw) return "";
      const s = raw.trim();
      if (!/^-?\d+(\.\d+)?$/.test(s)) return s;

      const [intPart, fracPart] = s.split(".");
      if (fracPart === undefined) return intPart;

      const trimmedFrac = fracPart.replace(/0+$/, "");
      if (trimmedFrac === "") return intPart;

      return `${intPart}.${trimmedFrac}`;
    };

    const normSpecKey = (code?: string): string => {
      const s = String(code ?? "")
        .toUpperCase()
        .trim();
      const noOpt = s.split(":")[0];
      return noOpt.replace(/^(WE|WX)-/, "");
    };

    const getStdValue = (hoGiName: string, specKey: string): string => {
      const list = weProdStdByHoGi[hoGiName];
      if (!list || list.length === 0) return "";

      const found = list.find((row) => normSpecKey(row.inspCode) === specKey);
      if (!found) return "";

      const rawMin = found.valMin?.trim();
      const rawMax = found.valMax?.trim();

      const hasMin = !isNA(rawMin);
      const hasMax = !isNA(rawMax);

      const min = hasMin ? trimTrailingZero(rawMin) : "";
      const max = hasMax ? trimTrailingZero(rawMax) : "";

      if (hasMin && hasMax) return `${min} ~ ${max}`;
      if (hasMin) return min;
      if (hasMax) return max;
      return "";
    };

    const insertSpecRow = (
      targetLabel: string,
      specLabel: string,
      specKey: string
    ) => {
      const labelCol = 0;

      const idx = finalAoA.findIndex(
        (row, i) => i > 0 && row[labelCol] === targetLabel
      );
      if (idx <= 0) return;

      const newRow: ExcelCell[] = new Array(colCountForRow).fill("");
      newRow[0] = specLabel;

      for (let c = 1; c < colCountForRow; c++) {
        const hoGiName = String(headerRow[c] ?? "");
        if (!hoGiName) continue;

        const val = getStdValue(hoGiName, specKey);
        if (val) newRow[c] = val;
      }

      finalAoA.splice(idx, 0, newRow);
    };

    // 규격 행 삽입
    insertSpecRow("절연외경1", "절연외경 규격", "06-01");
    insertSpecRow("연선외경", "연선외경 규격", "07-01");
    insertSpecRow("피치", "피치 규격", "14-01");
    insertSpecRow("소선경1", "소선경 검사규격", "09-01");
    insertSpecRow("절연두께1", "절연두께 규격", "10-01");
    insertSpecRow("편심율", "편심율 규격", "08-01");
    insertSpecRow("인장강도", "인장강도 규격", "11-01");
    insertSpecRow("신장율", "신장율 규격", "12-01");
  }

  // ---------------------------------------
  // 2-2) 편심율 위에 행 삽입
  // ---------------------------------------
  let eccentricityTallRowIndex: number | null = null;
  const eccIdx = finalAoA.findIndex((row) => row[0] === "편심율");

  if (eccIdx >= 0) {
    const colCountForRow = finalAoA[0]?.length ?? 0;

    const tallRow: ExcelCell[] = new Array(colCountForRow).fill("");
    tallRow[0] = "편심율";

    finalAoA.splice(eccIdx, 0, tallRow);
    eccentricityTallRowIndex = eccIdx;

    const numericRow = finalAoA[eccIdx + 1];
    if (numericRow) {
      numericRow[0] = "편심율";
    }
  }

  const yellowRowIdxSet = new Set<number>();

  for (let i = 0; i < finalAoA.length; i++) {
    const label = String(finalAoA[i]?.[0] ?? "").trim();
    if (label === "편심율 규격" || label === "검사결과") {
      yellowRowIdxSet.add(i);
    }
  }

  // ================================
  // 2.5) 상단 "제목/검사일/검사자/결재선" 행
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

    if (title) {
      const titleRow = makeBlankRow();
      titleRow[0] = title;
      extraHeaderRows.push(titleRow);
    }

    if (hasMeta) {
      extraHeaderRows.push(makeBlankRow());
    }

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

    if (inspectorNameText || useApproval) {
      const row = makeBlankRow();
      if (inspectorNameText) {
        row[0] = `검사자 : ${inspectorNameText}`;
      }
      inspectorRowIndex = extraHeaderRows.length;
      extraHeaderRows.push(row);
    }

    if (useApproval) {
      approvalBottomRowIndex = extraHeaderRows.length;
      extraHeaderRows.push(makeBlankRow());
    }

    extraHeaderRows.push(makeBlankRow());
  }

  const headerOffset = extraHeaderRows.length;
  const sheetAoA: ExcelCell[][] =
    headerOffset > 0 ? [...extraHeaderRows, ...finalAoA] : finalAoA;

  // 3) 시트 생성
  const ws = XLSX.utils.aoa_to_sheet(sheetAoA);

  // 편심율 타이틀 행 높이 설정
  if (eccentricityTallRowIndex !== null) {
    const wsAny = ws as XLSX.WorkSheet & {
      "!rows"?: { hpt?: number; hpx?: number }[];
    };

    const excelRowIndex = headerOffset + eccentricityTallRowIndex;

    wsAny["!rows"] = wsAny["!rows"] ?? [];
    wsAny["!rows"]![excelRowIndex] = {
      ...(wsAny["!rows"]![excelRowIndex] || {}),
      hpt: 85,
    };
  }

  if (!ws["!ref"]) {
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
    return;
  }

  const range = XLSX.utils.decode_range(ws["!ref"] as string);

  // ================================
  // 3.5) 병합 (제목/결재선)
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
        const c = approvalStartCol + i;
        if (c >= colCountForHeader) break;

        merges.push({
          s: { r: middle, c },
          e: { r: bottom, c },
        });
      }
    }
  }

  // 4) 스타일 공통
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

  // (4-1) 제목/결재 영역 스타일
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
  const headerRowIndex2 = headerOffset;
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: headerRowIndex2, c });
    if (ws[addr]) ws[addr].s = headerStyle;
  }

  // (4-3) 본문 스타일
  const bodyStartRow = headerRowIndex2 + 1;

  for (let r = bodyStartRow; r <= range.e.r; r++) {
    const finalAoAIdx = r - headerOffset;
    const isYellowRow = finalAoAIdx >= 0 && yellowRowIdxSet.has(finalAoAIdx);

    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) {
        ws[addr] = { t: "s", v: "" };
      }

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

        ...(isYellowRow
          ? {
              fill: {
                patternType: "solid",
                fgColor: { rgb: "FFFFFF00" },
              },
            }
          : {}),
      };
    }
  }

  // 5) 열 너비
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

  if (ws["!ref"]) {
    const startRowForWidth = bodyStartRow;

    const colWidths: { wch: number }[] = [];

    for (let c = range.s.c; c <= range.e.c; c++) {
      let maxLen = 0;

      for (let r = startRowForWidth; r <= range.e.r; r++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[addr];
        if (!cell || cell.v === undefined || cell.v === null) continue;

        const len = visualLen(cell.v);
        if (len > maxLen) maxLen = len;
      }

      const wch = Math.max(maxLen + 4, 5);
      colWidths[c] = { wch };
    }

    const hoGiCols: number[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const headerAddr = XLSX.utils.encode_cell({
        r: headerRowIndex2,
        c,
      });
      const headerCell = ws[headerAddr];
      const text = headerCell?.v;

      if (
        typeof text === "string" &&
        (/(압출|조사)\s*\d+\s*호기/.test(text) || text === "압출호기")
      ) {
        hoGiCols.push(c);
      }
    }

    if (hoGiCols.length > 0) {
      let maxWch = 0;
      for (const c of hoGiCols) {
        const w = colWidths[c]?.wch ?? 0;
        if (w > maxWch) maxWch = w;
      }
      if (maxWch > 0) {
        for (const c of hoGiCols) {
          colWidths[c] = { wch: maxWch };
        }
      }
    }

    ws["!cols"] = colWidths;
  }

  if (merges.length > 0) {
    ws["!merges"] = merges;
  }

  // 6) 템플릿 읽은 후 저장
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
