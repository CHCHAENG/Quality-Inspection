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
    proc: "TR51315",
    keys: ["i_BRCD", "i_LANG"],
  },
  {
    path: "/api/mtrDailyDetail",
    proc: "TR51313",
    keys: ["i_BRCD", "i_ITMCD", "i_GRPCD", "i_INSPSEQ", "i_LANG"],
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

  // 완제품 검사 (고전압선)
  {
    path: "/api/finalSub",
    proc: "TR52042",
    keys: ["i_SDATE", "i_EDATE", "i_ITM_GRP", "i_LANG", "i_STR"],
  },
];

// 자동 등록
for (const r of routes) {
  app.post(r.path, makeProcHandler(r));
  // console.log(POST ${r.path} -> CALL ${r.proc}(${r.keys.join(", ")})`);
}

app.listen(4000, () => console.log("Server running on port 4000"));
