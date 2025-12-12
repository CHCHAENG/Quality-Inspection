import { useLocation } from "react-router-dom";
import { InspGridPage } from "../Common/InspGridPage";
import {
  transformServerData,
  type ServerRow,
  type FrontRow,
  type ItemKind,
} from "../../utils/InspDataTrans/prcsSubInspTrans";
import { prcsSub } from "../../api/api";
import {
  getPrcsSubColumns,
  getPrcsSubSelectedColumns,
} from "../../utils/Columns/prcsSubInspColumns";

function kindFromPath(pathname: string): ItemKind {
  const p = pathname.toLowerCase();
  if (p.includes("dr")) return "dr";
  return "st";
}

function buildSendDataString(kind: ItemKind, s: string, e: string) {
  if (kind === "dr")
    return `${s};${e};23;0;DR-01-01:1!DR-02-01:1!DR-03-01:1!DR-03-01:2!DR-03-01:3!DR-03-01:4!;`;
  return `${s};${e};24;0;ST-00-01:1!ST-01-01:1!ST-03-01:1!ST-03-02:1!ST-04-01:1!ST-05-01:1!ST-05-01:2!ST-05-01:3!ST-05-01:4!;`;
}

export default function PrcsSubInspDataGrid() {
  const { pathname } = useLocation();

  return (
    <InspGridPage<ItemKind, ServerRow, FrontRow, FrontRow>
      pathname={pathname}
      kindFromPath={kindFromPath}
      fetcher={prcsSub}
      buildSendData={buildSendDataString}
      transformRows={transformServerData}
      getColumns={getPrcsSubColumns}
      getSelectedColumns={getPrcsSubSelectedColumns}
      excel={{
        filename: (kind) =>
          kind === "dr" ? "순회검사_신선.xlsx" : "순회검사_연선.xlsx",
        headerTitle: (kind) =>
          kind === "dr" ? "순회검사일지 신선" : "순회검사일지 연선",
        showApprovalLine: true,
      }}
    />
  );
}
