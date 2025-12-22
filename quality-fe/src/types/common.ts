import type { GridRowId } from "@mui/x-data-grid";

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
