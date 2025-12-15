import { useLocation } from "react-router-dom";
import { InspGridPage } from "../Common/InspGridPage";
import {
  transformServerData,
  type ServerRow,
  type FrontRow,
  type ItemKind,
} from "../../utils/InspDataTrans/mtrInspTrans";
import { mtrInsp } from "../../api/api";
import { splitItemNameAndColor } from "../../utils/SelectedRow/mtrInsp";
import {
  getMtrInspColumns,
  getMtrInspSelectedColumns,
} from "../../utils/Columns/mtrInspColumns";

function kindFromPath(pathname: string): ItemKind {
  const p = pathname.toLowerCase();
  if (p.includes("pvc")) return "pvc";
  if (p.includes("scr")) return "scr";
  return "st";
}

function buildSendDataString(kind: ItemKind, s: string, e: string) {
  if (kind === "pvc")
    return `${s};${e};22;0;PVC-01-01:1!PVC-02-01:1!PVC-03-01:1!;`;

  if (kind === "scr")
    return `${s};${e};21;0;CU-00-01:1!CU-01-01:1!CU-01-01:2!CU-01-01:3!CU-01-01:4!CU-02-01:1!;`;

  return `${s};${e};24;0;ST-00-01:1!ST-01-01:1!ST-02-01:1!ST-03-01:1!ST-03-02:1!ST-04-01:1!ST-05-01:1!ST-05-01:2!ST-05-01:3!ST-05-01:4!;`;
}

export default function MtrInspDataGrid() {
  const { pathname } = useLocation();

  return (
    <InspGridPage<ItemKind, ServerRow, FrontRow, FrontRow>
      pathname={pathname}
      kindFromPath={kindFromPath}
      fetcher={mtrInsp}
      buildSendData={buildSendDataString}
      transformRows={transformServerData}
      getColumns={getMtrInspColumns}
      getSelectedColumns={getMtrInspSelectedColumns}
      mapSelectedBase={(rows, kind) =>
        kind === "pvc" ? rows.map(splitItemNameAndColor) : rows
      }
      excel={{
        filename: (kind) =>
          kind === "pvc"
            ? "수입검사(원자재)_PVC.xlsx"
            : kind === "scr"
            ? "수입검사(원자재)_SCR.xlsx"
            : "수입검사(원자재)_연선.xlsx",
        headerTitle: (kind) =>
          kind === "pvc"
            ? "원자재 수입검사 일지(PVC)"
            : kind === "scr"
            ? "원자재 수입검사 일지(SCR)"
            : "원자재 수입검사 일지(연선)",
        showApprovalLine: true,
      }}
      inspectionType={"mtr"}
    />
  );
}
