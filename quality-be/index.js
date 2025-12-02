const express = require("express");
const cors = require("cors");
const { makeProcHandler } = require("./src/makeProcHandler");

const app = express();
app.use(cors());
app.use(express.json());

// 프로시저 매핑 테이블
const routes = [
  // 수입검사 원자재
  {
    path: "/api/mtr",
    proc: "TR52012",
    keys: ["i_SDATE", "i_EDATE", "i_ITM_GRP", "i_LANG", "i_STR"],
  },

  // 수입검사일지
  {
    path: "/api/mtrDailyInfo",
    proc: "TR59001",
    keys: ["i_SDATE", "i_EDATE", "i_FILEGBN", "i_LANG"],
  },

  // 순회검사 일지 (신선, 연선)
  {
    path: "/api/prcsSub",
    proc: "TR52122",
    keys: ["i_SDATE", "i_EDATE", "i_ITM_GRP", "i_LANG", "i_STR"],
  },
  // 순회검사 일지 (압출)
  {
    path: "/api/prcsSubWE",
    proc: "TR52112",
    keys: ["i_SDATE", "i_EDATE", "i_ITM_GRP", "i_LANG", "i_STR"],
  },
  // 순회검사 일지 (압출) 검사 규격
  {
    path: "/api/prcsSubWE/prod",
    proc: "TR14173",
    keys: ["i_ITMCD", "i_LANG"],
  },

  // 완제품 검사 (고전압선, 저전압 압출, 저전압 조사후)
  {
    path: "/api/finalSub",
    proc: "TR52042",
    keys: ["i_SDATE", "i_EDATE", "i_ITM_GRP", "i_LANG", "i_STR"],
  },

  //초종품 검사 (고전압 압출, 고전압 쉬즈, 저전압 조사전)
  {
    path: "/api/initFinalSub",
    proc: "TR52122",
    keys: ["i_SDATE", "i_EDATE", "i_ITM_GRP", "i_LANG", "i_STR"],
  },
];

// 자동 등록
for (const r of routes) {
  app.post(r.path, makeProcHandler(r));
  // console.log(POST ${r.path} -> CALL ${r.proc}(${r.keys.join(", ")})`);
}

app.listen(4000, () => console.log("Server running on port 4000"));
