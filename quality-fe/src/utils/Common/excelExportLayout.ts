import { GridColDef } from "@mui/x-data-grid";
import { DailyInspField, FrontRow } from "../InspDataTrans/mtrInspTrans";
import * as XLSX from "xlsx-js-style";

// 엑셀 내보내기
export function exportToXlsxStyled(
  data: DailyInspField[] | FrontRow[],
  columns: GridColDef[],
  filename: string
) {
  // 1) 헤더 텍스트 배열
  const headers = columns.map((c) => c.headerName ?? String(c.field));

  // 2) 본문 AoA (컬럼 순서 고정)
  const rowsAoA = data.map((r) =>
    columns.map((c) => (r as any)[c.field as string])
  );

  // 3) AoA -> Sheet (헤더 1행 + 본문)
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rowsAoA]);

  // 4) 헤더 스타일 적용
  const headerStyle = {
    border: {
      top: { style: "thin", color: { rgb: "FFB0BEC5" } },
      right: { style: "thin", color: { rgb: "FFB0BEC5" } },
      bottom: { style: "thin", color: { rgb: "FFB0BEC5" } },
      left: { style: "thin", color: { rgb: "FFB0BEC5" } },
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

  // 6) 숫자 컬럼 서식(옵션): DataGrid 컬럼 type이 number면 표시 형식 지정
  for (let r = 1; r <= range.e.r; r++) {
    columns.forEach((col, c) => {
      if (col.type === "number") {
        const addr = XLSX.utils.encode_cell({ r, c });
        if (ws[addr]) ws[addr].z = "0.000"; // 필요 시 "0.0" 등으로 조정
      }
    });
  }

  // 7) 열 너비 자동
  function visualLen(str: unknown) {
    // 줄바꿈 고려: 각 라인 중 가장 긴 라인의 ‘시각 길이’
    return String(str ?? "")
      .split(/\r?\n/)
      .map((line) =>
        [...line].reduce(
          (acc, ch) => acc + (ch.charCodeAt(0) > 0xff ? 2 : 1), // 한글/전각 2, 영문/숫자 1
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

    // 숫자열은 패딩 3, 그 외 5
    const pad = col.type === "number" ? 3 : 5;

    // 최소 10, 최대 60 컬럼폭으로 클램프
    const wch = Math.min(
      Math.max(Math.max(headerLen, maxCellLen) + pad, 10),
      60
    );
    return { wch };
  });

  ws["!cols"] = widths;

  // 8) 저장
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(
    wb,
    filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`
  );
}
