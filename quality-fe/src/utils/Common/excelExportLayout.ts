import { GridColDef } from "@mui/x-data-grid";
import {
  DailyInspField,
  FrontRow as FrontRow_MTR,
} from "../InspDataTrans/mtrInspTrans";
import {
  FrontRow as FrontRow_PRCS,
  FrontRow_WE,
} from "../InspDataTrans/prcsSubInspTrans";
import { FrontRow as FrontRow_FINAL } from "../InspDataTrans/finalSubInspTrans";
import { FrontRow as FrontRow_INITFINAL } from "../InspDataTrans/initFinalSubInspTrans";

import * as XLSX from "xlsx-js-style";

// 엑셀 내보내기
export function exportToXlsxStyled(
  data:
    | DailyInspField[]
    | FrontRow_MTR[]
    | FrontRow_PRCS[]
    | FrontRow_WE[]
    | FrontRow_FINAL[]
    | FrontRow_INITFINAL[],
  columns: GridColDef[],
  filename: string,
  kind?: string
) {
  // 1) 헤더 텍스트 배열
  const headers = columns.map((c) => c.headerName ?? String(c.field));

  // 2) 본문 AoA (컬럼 순서 고정)
  const rowsAoA: any[][] = [];
  const printHistoryRowIdxList: number[] = []; // 인쇄이력 행 인덱스

  (data as any[]).forEach((row) => {
    // 기본 데이터 한 줄
    const baseRow = columns.map((c) => row[c.field as string]);
    rowsAoA.push(baseRow);

    if (kind === "final_whex") {
      const printHistoryRow = columns.map((col, idx) =>
        idx === 0 ? "인쇄이력" : ""
      );
      rowsAoA.push(printHistoryRow);
      printHistoryRowIdxList.push(rowsAoA.length - 1);
    }
  });
  const printHistoryRowIdxSet = new Set(printHistoryRowIdxList);

  // 3) AoA -> Sheet (헤더 1행 + 본문)
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rowsAoA]);

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
      kind === "final_whex" && printHistoryRowIdxSet.has(r - 1); // rowsAoA index = r-1

    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) {
        ws[addr] = { t: "s", v: "" };
      }
      const isNum = columns[c]?.type === "number";

      const prevStyle = ws[addr].s || {};
      ws[addr].s = {
        ...prevStyle,
        border: bodyBorder,
        alignment: {
          horizontal: isNum ? "right" : "left",
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

  const widths = columns.map((col, cIdx) => {
    const header = headers[cIdx] ?? String(col.field);
    const headerLen = visualLen(header);
    const maxCellLen = rowsAoA.length
      ? Math.max(...rowsAoA.map((row) => visualLen(row[cIdx])))
      : 0;

    const pad = col.type === "number" ? 3 : 5;

    const wch = Math.min(
      Math.max(Math.max(headerLen, maxCellLen) + pad, 10),
      60
    );
    return { wch };
  });

  ws["!cols"] = widths;

  // 8) "인쇄이력" 행 셀 병합 (A열 ~ 마지막 열)
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
