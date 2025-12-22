import type { GridColDef, GridRowId } from "@mui/x-data-grid";

export type RowSelectionModelV8 = {
  type: "include" | "exclude";
  ids: Set<GridRowId>;
};

export type ColWchByField = Record<string, number>;

export type ExcelOptions = {
  widthOptions: {
    approvalWch: [number, number, number, number];
    colWchByField: ColWchByField;
  };
  heightOptions: {
    headerHpt: number;
    bodyHpt: number;
  };
};

export type InspectionType = "mtr" | "prcs" | "final" | "initFinal" | "other";

export type WithId = { id: string | number };
export type WithInspector = { inspector?: unknown };

export type InspGridPageConfig<
  Kind extends string,
  ServerRow,
  FrontRow extends WithId & WithInspector,
  ExcelRow extends WithId & WithInspector
> = {
  // kind/경로
  kindFromPath: (pathname: string) => Kind;
  pathname: string;

  // API
  fetcher: (sendData: string) => Promise<ServerRow[] | undefined | null>;
  buildSendData: (kind: Kind, s: string, e: string) => string;

  // 변환/컬럼
  transformRows: (raw: ServerRow[], kind: Kind) => FrontRow[];
  getColumns: (kind: Kind) => GridColDef[];
  getSelectedColumns: (kind: Kind) => GridColDef[];

  mapExcludedRow?: (row: FrontRow, kind: Kind) => FrontRow;
  mapSelectedBase?: (rows: FrontRow[], kind: Kind) => ExcelRow[];
  toExcelRow?: (row: ExcelRow, no: number) => ExcelRow;

  // 엑셀 옵션
  excel: {
    filename: (kind: Kind) => string;
    kindProp?: (kind: Kind) => string;
    headerTitle: (kind: Kind) => string;
    showApprovalLine?: boolean;
    label?: string;
  };

  // 그리드 옵션
  pageSize?: number;
  previewPageSize?: number;
  inspectionType?: InspectionType;
};
