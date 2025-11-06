import axios from "axios";

// 수입검사 (연선, PVC, SCR)
export async function mtrInsp(sendData: string) {
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
export async function prcsSub(sendData: string) {
  const res = await axios.post("/api/prcsSub", { sendData });
  return res.data;
}

// 순회검사일지 (압출)
export async function prcsSubWE(sendData: string) {
  const res = await axios.post("/api/prcsSubWE", { sendData });
  return res.data;
}

// 완제품검사일지 (고전압선)
export async function finalInsp(sendData: string) {
  const res = await axios.post("/api/finalSub", { sendData });
  return res.data;
}
