import { InspGridPage } from "../Common/InspGridPage";
import {
  type ServerRow,
  type DailyInspField,
  transformServerData_Daliy,
} from "../../utils/InspDataTrans/mtrInspTrans";
import { mtrDailyInfo } from "../../api/api";
import { buildPreviewRow } from "../../utils/SelectedRow/mtrInsp";
import {
  getMtrDailyColumns,
  getMtrDailySelectedColumns,
} from "../../utils/Columns/mtrDailyInspColumns";

type Kind = "daily";

function kindFromPath() {
  return "daily" as const;
}

function buildSendData(_kind: Kind, s: string, e: string) {
  return `${s};${e};G-D;0;`;
}

export default function MtrDaliyInspDataGrid() {
  return (
    <InspGridPage<Kind, ServerRow, DailyInspField, DailyInspField>
      pathname={"daily"}
      kindFromPath={kindFromPath}
      fetcher={mtrDailyInfo}
      buildSendData={buildSendData}
      transformRows={(raw) => transformServerData_Daliy(raw)}
      getColumns={() => getMtrDailyColumns()}
      getSelectedColumns={() => getMtrDailySelectedColumns()}
      mapSelectedBase={(rows) => rows.map(buildPreviewRow)}
      excel={{
        filename: () => "일일 수입검사일지.xlsx",
        headerTitle: () => "일일 수입검사 일지 (독정리)",
        showApprovalLine: true,
      }}
    />
  );
}
