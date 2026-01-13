import { useLocation } from "react-router-dom";
import { InspGridPage } from "../Common/InspGridPage";
import {
  type ServerRow,
  type FrontRow,
  transformServerData,
  ItemKind,
} from "../../utils/InspDataTrans/initFinalSubInspTrans";
import { initFinalinsp } from "../../api/api";
import {
  buildPreviewRow,
  splitProcessNameStdColor_WH,
  splitProcessNameStdColor_WX,
} from "../../utils/SelectedRow/initFinalInsp";
import {
  getInitialFinalColumns,
  getInitialFinalSelectedColumns,
} from "../../utils/Columns/initFinalInspColumns";

function kindFromPath(pathname: string): ItemKind {
  const p = pathname.toLowerCase();
  if (p.includes("wx")) return "wx";
  if (p.includes("whbs")) return "whbs";
  return "whex";
}

function buildSendDataString(kind: ItemKind, s: string, e: string) {
  if (kind === "wx")
    return `${s};${e};28;0;WX-01-01:1!WX-02-01:1!WX-03-01:1!WX-04-01:1!WX-05-01:1!WX-05-02:1!WX-06-01:1!WX-06-01:2!WX-07-01:1!WX-09-01:1!WX-09-01:2!WX-09-01:3!WX-09-01:4!;`;

  if (kind === "whbs")
    return `${s};${e};3F;0;WHBS-01-01:1!WHBS-02-01:1!WHBS-05-01:1!WHBS-06-01:1!WHBS-06-01:2!WHBS-06-01:3!WHBS-06-01:4!WHBS-07-01:1!WHBS-08-01:1!WHBS-08-01:2!WHBS-08-01:3!WHBS-08-01:4!WHBS-09-01:1!WHBS-09-01:2!WHBS-09-01:3!WHBS-09-01:4!WHBS-09-01:5!WHBS-09-01:6!WHBS-10-01:1!WHBS-11-01:1!;`;

  return `${s};${e};3C;0;WHEX-01-01:1!WHEX-03-01:1!WHEX-04-01:1!WHEX-05-01:1!WHEX-06-01:1!WHEX-07-01:1!WHEX-07-01:2!WHEX-07-01:3!WHEX-07-01:4!WHEX-08-01:1!WHEX-08-01:2!WHEX-11-01:1!WHEX-11-01:2!WHEX-13-01:1!WHEX-13-01:2!WHEX-13-01:3!WHEX-13-01:4!WHEX-24-01:1!WHEX-24-02:1!;`;
}

export default function InitialInspDataGrid() {
  const { pathname } = useLocation();

  return (
    <InspGridPage<ItemKind, ServerRow, FrontRow, FrontRow>
      pathname={pathname}
      kindFromPath={kindFromPath}
      fetcher={initFinalinsp}
      buildSendData={buildSendDataString}
      transformRows={transformServerData}
      getColumns={getInitialFinalColumns}
      getSelectedColumns={getInitialFinalSelectedColumns}
      mapSelectedBase={(rows, kind) => {
        const splitter =
          kind === "wx"
            ? splitProcessNameStdColor_WX
            : splitProcessNameStdColor_WH;

        const parsed = rows.map(splitter);
        return kind === "whbs" ? parsed.map(buildPreviewRow) : parsed;
      }}
      excel={{
        filename: (kind) =>
          kind === "wx"
            ? "초종품검사(저전압 조사전).xlsx"
            : kind === "whex"
            ? "초종품검사(고전압 쉬즈).xlsx"
            : "초종품검사(고전압 압출).xlsx",
        kindProp: (kind) => (kind === "wx" ? "initialFinal_wx" : ""),
        headerTitle: (kind) =>
          kind === "wx"
            ? "압출 초종품 검사일지(조사전)"
            : kind === "whex"
            ? "초종품 검사일지(고전압 쉬즈)"
            : "초종품 검사일지(고전압 압출)",
        showApprovalLine: true,
      }}
      inspectionType={"initFinal"}
    />
  );
}
