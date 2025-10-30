import axios from "axios";

// 수입검사 (원자재, PVC, SCR)
export async function mtrInsp() {
  const sendData =
    "2025-10-14;2025-10-30;22;0;PVC-01-01:1!PVC-02-01:1!PVC-03-01:1!;";

  const res = await axios.post("/api/mtr", { sendData });
  return res.data;
}

// 수입검사일지
export async function mtrDailyInfo() {
  const sendData = "PD3F1BK0Q300SK125627029;0;";

  const res = await axios.post("/api/mtrDailyInfo", { sendData });
  return res.data;
}
export async function mtrDailyDetail() {
  const sendData = "PD3F1BK0Q300SK125627029;2D3F1BK0D;NE-28-01;1;0;";

  const res = await axios.post("/api/mtrDailyDetail", { sendData });
  return res.data;
}

// 순회검사일지 (신선, 연선)
export async function prcsSub() {
  const sendData =
    "2025-10-28;2025-10-30;24;0;ST-00-01:1!ST-01-01:1!ST-03-01:1!ST-03-02:1!ST-04-01:1!ST-05-01:1!ST-05-01:2!ST-05-01:3!ST-05-01:4!;";

  const res = await axios.post("/api/prcsSub", { sendData });
  return res.data;
}
