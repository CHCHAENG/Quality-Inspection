const express = require("express");
const cors = require("cors");
const { makeProcHandler } = require("./src/makeProcHandler");

const app = express();
app.use(cors());
app.use(express.json());

// 프로시저 매핑 테이블
const routes = [
  {
    path: "/api/test",
    proc: "TR25031",
    keys: ["i_SDATE", "i_EDATE", "i_CMCD", "i_CSTCD", "i_LANG"],
  },
  {
    path: "/api/tr52042",
    proc: "TR52042",
    keys: ["i_SDATE", "i_EDATE", "i_ITM_GRP", "i_LANG", "i_STR"],
  },
];

// 자동 등록
for (const r of routes) {
  app.post(r.path, makeProcHandler(r));
  // console.log(POST ${r.path} -> CALL ${r.proc}(${r.keys.join(", ")})`);
}

app.listen(4000, () => console.log("🚀 Server running on port 4000"));
