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
  excelOptions_trnas?: TransposeExcelOptions;
};

export function ExcelDownloadButton<T extends Record<string, unknown>>(
  props: ExcelDownloadButtonProps<T>
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
    excelOptions_trnas,
  } = props;

  const { showAlert } = useAlert();

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

    const callback = (success: boolean) => {
      if (success) {
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
          excelOptions_trnas?.widthOptions,
          excelOptions_trnas?.heightOptions
        );
        return;
      }

      if (kind === "transposeMerged") {
        exportToXlsxStyledTransposedMerged(
          data,
          columns,
          filename,
          headerOptions,
          callback
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
        excelOptions?.heightOptions
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
