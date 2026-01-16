import axios from "axios";

// 로그인
export async function login(sendData: string) {
  const res = await axios.post("/api/login", { sendData });
  return res.data;
}

// 수입검사 (연선, PVC, SCR)
export async function mtrInsp(sendData: string) {
  const res = await axios.post("/api/mtr", { sendData });
  return res.data;
}

// 수입검사일지
export async function mtrDailyInfo(sendData: string) {
  const res = await axios.post("/api/mtrDailyInfo", { sendData });
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

// 순회검사일지 (압출) - 검사규격
export async function prcsSubWEProd(sendData: string) {
  const res = await axios.post("/api/prcsSubWE/prod", { sendData });
  return res.data;
}

// 완제품검사일지 (고전압선, 저전압 압출, 저전압 조사후)
export async function finalInsp(sendData: string) {
  const res = await axios.post("/api/finalSub", { sendData });
  return res.data;
}

// 반제품검사일지 (=초종품검사일지 / 고전압 쉬즈, 고전압 압출, 저전압 조사전)
export async function initFinalinsp(sendData: string) {
  const res = await axios.post("/api/initFinalSub", { sendData });
  return res.data;
}
