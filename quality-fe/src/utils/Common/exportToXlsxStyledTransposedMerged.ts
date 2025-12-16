import { GridColDef } from "@mui/x-data-grid";
import * as XLSX from "xlsx-js-style";

type ExcelCell = string | number | null;

export interface ExportHeaderOptions {
  title?: string;
  inspectDateText?: string;
  inspectorNameText?: string;
  showApprovalLine?: boolean;
}

/**
 * transposeMerged:
 * - 샘플 1개당 2열(B~C, D~E...) 병합해서 값 표시
 * - 단, "엑셀 13번째 행부터"는 샘플 2열 병합을 하지 않음
 *   => 왼쪽 셀(값)은 채우고, 오른쪽 셀은 항상 빈칸 유지
 * - 상단 헤더(제목/검사일/검사자/결재선)는 첫 번째 코드 스타일
 */
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
    // ====== 병합 중단 기준(엑셀 행번호 13부터 병합X) ======
    const MERGE_STOP_EXCEL_ROW = 13; // 1-base
    const MERGE_STOP_R0 = MERGE_STOP_EXCEL_ROW - 1; // 0-base r
    // =======================================================

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
      // 오른쪽 셀은 빈칸 유지
      tableHeaderRow[cStart + 1] = "";
    }

    const bodyRows: ExcelCell[][] = [];
    for (let li = 0; li < labelCols.length; li++) {
      const row = makeBlankRow();
      row[0] = labelNames[li];

      const colDef = labelCols[li];

      for (let si = 0; si < sampleCount; si++) {
        const cStart = 1 + si * 2; // 병합쌍의 첫칸(왼쪽)
        const cSecond = cStart + 1; // 병합쌍의 두번째칸(오른쪽)

        // 왼쪽 셀에 값
        row[cStart] = getCellValue(safeData[si], colDef);

        // ✅ 오른쪽 셀은 항상 빈칸 (13행 이후도 포함)
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
      const approvalCols = useApproval ? 4 : 0;
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
          row[approvalStartCol + 0] = "결재";
          row[approvalStartCol + 1] = "작성";
          row[approvalStartCol + 2] = "검토";
          row[approvalStartCol + 3] = "승인";
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
        approvalBottomRowIndex = extraHeaderRows.length;
        extraHeaderRows.push(makeBlankRow());
      }

      extraHeaderRows.push(makeBlankRow());
    }

    const headerOffset = extraHeaderRows.length;
    const sheetAoA =
      headerOffset > 0 ? [...extraHeaderRows, ...mainAoA] : mainAoA;

    // 메인 테이블의 실제 시작 r(0-index)
    const tableHeaderExcelRow = headerOffset + 0;
    const firstBodyExcelRow = headerOffset + 1;

    // ✅ 여기에서 "13행부터 오른쪽 칸에 값 복사" 로직을 제거함
    // (오른쪽 칸은 원래 AoA 생성 단계에서 이미 ""로 채워져 있음)

    // ----------------------------
    // 3) Sheet 생성
    // ----------------------------
    const ws = XLSX.utils.aoa_to_sheet(sheetAoA);

    // ----------------------------
    // 4) 병합(merge)
    // ----------------------------
    const merges: XLSX.Range[] = [];

    // 제목 병합
    if (headerOptions?.title && titleRowIndex >= 0) {
      merges.push({
        s: { r: titleRowIndex, c: 0 },
        e: { r: titleRowIndex, c: totalCols - 1 },
      });
    }

    // 상단 결재 병합
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
        merges.push({
          s: { r: inspectRowIndex, c: approvalStartCol + 0 },
          e: { r: approvalBottomRowIndex, c: approvalStartCol + 0 },
        });

        for (let i = 1; i < 4; i++) {
          merges.push({
            s: { r: inspectorRowIndex, c: approvalStartCol + i },
            e: { r: approvalBottomRowIndex, c: approvalStartCol + i },
          });
        }
      }
    }

    // ✅ 메인 테이블: 샘플 2열 병합(헤더 + 데이터) BUT 13행부터는 병합 금지
    for (let i = 0; i < sampleCount; i++) {
      const cStart = 1 + i * 2;
      const cEnd = cStart + 1;

      // 테이블 헤더(번호) 병합은 유지 (원하면 이것도 끊을 수 있음)
      if (tableHeaderExcelRow < MERGE_STOP_R0) {
        merges.push({
          s: { r: tableHeaderExcelRow, c: cStart },
          e: { r: tableHeaderExcelRow, c: cEnd },
        });
      }

      // 데이터 영역 병합: r < 13 행까지만
      for (let li = 0; li < labelCols.length; li++) {
        const r = firstBodyExcelRow + li;
        if (r >= MERGE_STOP_R0) continue;

        merges.push({ s: { r, c: cStart }, e: { r, c: cEnd } });
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
      fill: { patternType: "solid", fgColor: { rgb: "FFC5D9F1" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
    };

    const labelStyle = {
      border: borderThin,
      font: { bold: true, sz: 10, color: { rgb: "FF000000" } },
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

    if (headerOptions?.showApprovalLine && approvalStartCol >= 0) {
      const top = inspectRowIndex;
      const mid = inspectorRowIndex;
      const bot = approvalBottomRowIndex;

      if (top >= 0 && mid >= 0 && bot >= 0) {
        for (let r = top; r <= bot; r++) {
          for (let c = approvalStartCol; c < approvalStartCol + 4; c++) {
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
                bold: r === top,
                sz: 10,
                color: { rgb: "FF000000" },
              },
            };
          }
        }
      }
    }

    // 메인 테이블 헤더 스타일
    for (let c = 0; c < totalCols; c++) {
      const addr = XLSX.utils.encode_cell({ r: tableHeaderExcelRow, c });
      if (!ws[addr]) ws[addr] = { t: "s", v: "" };
      ws[addr].s = tableHeaderStyle;
    }

    // 본문 스타일
    for (let li = 0; li < labelCols.length; li++) {
      const r = firstBodyExcelRow + li;

      // 라벨(A열)
      {
        const addr = XLSX.utils.encode_cell({ r, c: 0 });
        if (!ws[addr]) ws[addr] = { t: "s", v: "" };
        ws[addr].s = labelStyle;
      }

      // 값(샘플 영역)
      for (let c = 1; c < totalCols; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        if (!ws[addr]) ws[addr] = { t: "s", v: "" };
        ws[addr].s = valueStyle;
      }
    }

    // ----------------------------
    // 6) 저장
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
