import { GridColDef } from "@mui/x-data-grid";
import * as XLSX from "xlsx-js-style";

type ExcelCell = string | number | null;

// 엑셀 내보내기 (제네릭 버전)
export function exportToXlsxStyled<T extends Record<string, unknown>>(
  data: T[],
  columns: GridColDef<T>[],
  filename: string,
  kind?: string
) {
  // 1) 헤더 텍스트 배열
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

    // 기존 final_whex 용 인쇄이력 행
    if (kind === "final_whex") {
      const printHistoryRow: ExcelCell[] = columns.map((_, idx) =>
        idx === 0 ? "인쇄이력" : ""
      );
      rowsAoA.push(printHistoryRow);
      printHistoryRowIdxList.push(rowsAoA.length - 1);
    }
  });

  const printHistoryRowIdxSet = new Set(printHistoryRowIdxList);

  // 기본 AoA (헤더 1행 + 본문)
  const baseAoA: ExcelCell[][] = [headers, ...rowsAoA];

  let finalAoA: ExcelCell[][] = baseAoA;
  let usedHeaders: string[] = headers;
  let usedBodyAoA: ExcelCell[][] = rowsAoA;

  const isTransposeLike = kind === "transpose" || kind === "transparse";

  // 순회검사(압출) 일 경우 행/열 변환 (+ transparse 포함)
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

    // 🔹 kind === "transparse" 인 경우에만 마지막 행에 "판정 / OK" 추가
    if (kind === "transparse") {
      const colCount2 = transposed[0]?.length ?? 0;
      const judgeRow: ExcelCell[] = [];

      for (let c = 0; c < colCount2; c++) {
        if (c === 0) judgeRow.push("판정"); // 첫 번째 열: 필드명
        else judgeRow.push("OK"); // 나머지 열: OK
      }

      transposed.push(judgeRow);
    }

    finalAoA = transposed;
    usedHeaders = (transposed[0] ?? []).map((v) => String(v ?? ""));
    usedBodyAoA = transposed.slice(1); // 판정 행 포함
  }

  // 3) AoA -> Sheet
  const ws = XLSX.utils.aoa_to_sheet(finalAoA);

  // 4) 헤더 스타일 적용
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

  // 5) 1행(헤더) 셀에 스타일 설정
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[addr]) ws[addr].s = headerStyle;
  }

  const bodyBorder = {
    top: { style: "thin", color: { rgb: "FF5A6A7D" } },
    right: { style: "thin", color: { rgb: "FF5A6A7D" } },
    bottom: { style: "thin", color: { rgb: "FF5A6A7D" } },
    left: { style: "thin", color: { rgb: "FF5A6A7D" } },
  };

  // 6) 본문 스타일링
  for (let r = 1; r <= range.e.r; r++) {
    const isPrintHistoryRow =
      kind === "final_whex" && printHistoryRowIdxSet.has(r - 1);

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
              // 인쇄이력 행
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

  // 8) "인쇄이력" 행 셀 병합 (A열 ~ 마지막 열) - 기존 기능 유지
  if (kind === "final_whex" && printHistoryRowIdxList.length > 0) {
    const merges: XLSX.Range[] = ws["!merges"] ?? [];

    for (const idx of printHistoryRowIdxList) {
      const excelRow = 1 + idx;

      merges.push({
        s: { r: excelRow, c: 0 },
        e: { r: excelRow, c: columns.length - 1 },
      });
    }

    ws["!merges"] = merges;
  }

  // 9) 저장
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(
    wb,
    filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`
  );
}
