import axios from "axios";

export async function getUsers() {
  const res = await axios.get("/api/users");
  return res.data; // rows 배열
}

export async function addUser(name: string, email: string) {
  const res = await axios.post("/api/users", { name, email });
  return res.data; // {ok:true, id:...}
}

// 실제 SP 테스트
// interface ProcedureParams {
//   i_SDATE: string;
//   i_EDATE: string;
//   i_ITM_GRP: string;
//   i_LANG: string;
//   i_STR: string; // LONGTEXT (JSON or CSV 형식 문자열)
// }

export async function dataTest() {
  const sendData = "2025-10-01;2025-10-16;;;0;";

  const res = await axios.post("/api/test", { sendData });
  return res.data;
}
