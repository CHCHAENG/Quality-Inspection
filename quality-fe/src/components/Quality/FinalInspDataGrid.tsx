import { useLocation } from "react-router-dom";
import { InspGridPage } from "../Common/InspGridPage";
import {
  type ServerRow,
  type FrontRow,
  transformServerData,
  ItemKind,
} from "../../utils/InspDataTrans/finalSubInspTrans";
import { finalInsp } from "../../api/api";
import {
  getBraidedShieldValue,
  splitProcessNameStdColor,
} from "../../utils/SelectedRow/finalInsp";
import {
  getFinalColumns,
  getFinalSelectedColumns,
} from "../../utils/Columns/finalInspColumns";

function kindFromPath(pathname: string): ItemKind {
  const p = pathname.toLowerCase();
  if (p.includes("wx")) return "wx";
  if (p.includes("we")) return "we";
  return "whex";
}

function buildSendDataString(kind: ItemKind, s: string, e: string) {
  if (kind === "wx")
    return `${s};${e};28;0;WX-01-01:1!WX-02-01:1!WX-03-01:1!WX-04-01:1!WX-05-01:1!WX-05-02:1!WX-06-01:1!WX-06-01:2!WX-07-01:1!WX-09-01:1!WX-09-01:2!WX-09-01:3!WX-09-01:4!WX-13-01:1!;`;

  if (kind === "we")
    return `${s};${e};27;0;WE-01-01:1!WE-02-01:1!WE-03-01:1!WE-04-01:1!WE-05-01:1!WE-05-02:1!WE-06-01:1!WE-06-01:2!WE-07-01:1!WE-09-01:1!WE-09-01:2!WE-09-01:3!WE-09-01:4!WE-13-01:1!;`;

  return `${s};${e};3C;0;WHEX-01-01:1!WHEX-03-01:1!WHEX-04-01:1!WHEX-05-01:1!WHEX-06-01:1!WHEX-07-01:1!WHEX-07-01:2!WHEX-08-01:1!WHEX-08-01:2!WHEX-09-02:1!WHEX-10-01:1!WHEX-10-01:2!WHEX-10-01:3!WHEX-10-01:4!WHEX-11-01:1!WHEX-12-01:1!WHEX-12-01:2!WHEX-12-01:3!WHEX-12-01:4!WHEX-13-01:1!WHEX-13-01:2!WHEX-13-01:3!WHEX-13-01:4!WHEX-16-01:1!WHEX-17-01:1!WHEX-18-01:1!WHEX-19-01:1!WHEX-21-01:1!WHEX-22-01:1!WHEX-23-01:1!;`;
}

export default function FinalInspDataGrid() {
  const { pathname } = useLocation();

  return (
    <InspGridPage<ItemKind, ServerRow, FrontRow, FrontRow>
      pathname={pathname}
      kindFromPath={kindFromPath}
      fetcher={finalInsp}
      buildSendData={buildSendDataString}
      transformRows={transformServerData}
      getColumns={getFinalColumns}
      getSelectedColumns={getFinalSelectedColumns}
      mapExcludedRow={(row) => splitProcessNameStdColor(row)}
      mapSelectedBase={(rows, kind) =>
        kind === "whex" ? rows.map(getBraidedShieldValue) : rows
      }
      excel={{
        filename: (kind) =>
          kind === "whex"
            ? "완제품검사(고전압).xlsx"
            : kind === "we"
            ? "초종품검사(저전압 압출).xlsx"
            : "초종품검사(저전압 조사후).xlsx",
        kindProp: (kind) =>
          kind === "whex" ? "transposeMerged" : kind === "we" ? "final_we" : "",
        headerTitle: (kind) =>
          kind === "whex"
            ? "고전압 완제품 검사일지"
            : kind === "we"
            ? "압출 초종품 검사일지(조사전)"
            : "초종품 검사일지(저전압 조사후)",
        showApprovalLine: true,
      }}
      inspectionType="final"
    />
  );
}
