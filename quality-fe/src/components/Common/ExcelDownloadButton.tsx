import { Button, type ButtonProps } from "@mui/material";
import { type GridColDef } from "@mui/x-data-grid";
import { exportToXlsxStyled } from "../../utils/Common/exportToXlsxStyled";
import { useAlert } from "../../context/AlertContext";
import { exportToXlsxStyledTranspose } from "../../utils/Common/exportToXlsxStyledTranspose";
import { exportToXlsxStyledTransposedMerged } from "../../utils/Common/exportToXlsxStyledTransposedMerged";
import {
  ExcelOptions,
  ExportHeaderOptions,
  TransposeExcelOptions,
  WEProdStdByHoGi,
} from "../../types/common";
import { logSearch } from "../../api/api";
import dayjs from "dayjs";

type ExcelDownloadButtonProps<T extends Record<string, unknown>> = {
  data: T[];
  columns: GridColDef<T>[];
  filename: string;
  kind?: string;
  label?: string;
  buttonProps?: ButtonProps;
  headerOptions?: ExportHeaderOptions;
  onBeforeDownload?: () => boolean | void;
  transposeSource?: WEProdStdByHoGi;
  excelOptions?: ExcelOptions;
  excelOptions_trans?: TransposeExcelOptions;
};

export function ExcelDownloadButton<T extends Record<string, unknown>>(
  props: ExcelDownloadButtonProps<T>,
) {
  const {
    data,
    columns,
    filename,
    kind,
    label = "엑셀 다운로드",
    buttonProps,
    headerOptions,
    onBeforeDownload,
    transposeSource,
    excelOptions,
    excelOptions_trans,
  } = props;

  const { showAlert } = useAlert();

  // 다운로드 로그 카운트 통신
  async function recordDownloadCount() {
    try {
      const result = await logSearch(`${dayjs().format("YYYY-MM-DD")};1;`);

      console.log("다운로드", result);
    } catch (e) {
      console.error("조회 카운트 실패:", e);
    }
  }

  const handleClick = () => {
    if (!data || data.length === 0) {
      showAlert({
        message: "다운로드할 데이터가 없습니다.",
        severity: "warning",
      });
      return;
    }

    // 엑셀 다운로드 전 검사자 선택
    if (onBeforeDownload) {
      const result = onBeforeDownload();
      if (result === false) return;
    }

    const callback = async (success: boolean) => {
      if (success) {
        await recordDownloadCount();
        showAlert({
          message: "엑셀 파일이 정상적으로 저장되었습니다.",
          severity: "success",
        });
      } else {
        showAlert({
          message: "엑셀 파일 저장 중 오류가 발생했습니다.",
          severity: "error",
        });
      }
    };

    try {
      if (kind === "transpose") {
        exportToXlsxStyledTranspose(
          data,
          columns,
          filename,
          callback,
          headerOptions,
          transposeSource,
          excelOptions_trans?.widthOptions,
          excelOptions_trans?.heightOptions,
        );
        return;
      }

      if (kind === "transposeMerged") {
        exportToXlsxStyledTransposedMerged(
          data,
          columns,
          filename,
          headerOptions,
          callback,
        );
        return;
      }

      exportToXlsxStyled(
        data,
        columns,
        filename,
        kind,
        callback,
        headerOptions,
        excelOptions?.widthOptions,
        excelOptions?.heightOptions,
      );
    } catch (e) {
      console.error(e);
      showAlert({
        message: "엑셀 파일 저장 중 예기치 않은 오류가 발생했습니다.",
        severity: "error",
      });
    }
  };

  return (
    <Button
      variant="contained"
      onClick={handleClick}
      disabled={!data || data.length === 0 || buttonProps?.disabled}
      {...buttonProps}
    >
      {label}
    </Button>
  );
}
