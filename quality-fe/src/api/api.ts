import axios from "axios";

export async function getUsers() {
  const res = await axios.get("/api/users");
  return res.data; // rows 배열
}

export async function addUser(name: string, email: string) {
  const res = await axios.post("/api/users", { name, email });
  return res.data; // {ok:true, id:...}
}
