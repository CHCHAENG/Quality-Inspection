import type { GridRowId } from "@mui/x-data-grid";

export type RowSelectionModelV8 = {
  type: "include" | "exclude";
  ids: Set<GridRowId>;
};
