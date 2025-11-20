import { Button, type ButtonProps } from "@mui/material";
import { type GridColDef } from "@mui/x-data-grid";
import {
  exportToXlsxStyled,
  type ExportHeaderOptions,
} from "../../utils/Common/excelExportLayout";
import { useAlert } from "../../context/AlertContext";

type ExcelDownloadButtonProps<T extends Record<string, unknown>> = {
  data: T[];
  columns: GridColDef<T>[];
  filename: string;
  kind?: string;
  label?: string;
  buttonProps?: ButtonProps;
  headerOptions?: ExportHeaderOptions;
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

    try {
      exportToXlsxStyled(
        data,
        columns,
        filename,
        kind,
        (success) => {
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
        },
        headerOptions
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
