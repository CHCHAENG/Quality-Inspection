const express = require("express");
const cors = require("cors");
const { randomUUID } = require("crypto");
const { makeProcHandler } = require("./src/makeProcHandler");
const { logger } = require("./src/logger");
const { runWithContext } = require("./src/logger/requestContext");

const app = express();
app.use(cors());
app.use(express.json());

// =====================================================
// 1) requestId context
// =====================================================
app.use((req, res, next) => {
  const rid = req.headers["x-request-id"] || randomUUID();
  res.setHeader("X-Request-Id", rid);

  runWithContext({ requestId: rid }, () => next());
});

// =====================================================
// 2) HTTP 로그
// =====================================================
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const ms = Date.now() - start;

    logger.http("HTTP", {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      ms,
      ip: req.ip,
      ua: req.headers["user-agent"],
    });
  });

  next();
});

// 프로시저 매핑 테이블
const routes = [
  // 로그인
  {
    path: "/api/login",
    proc: "TR00001",
    keys: ["i_USRID", "i_PSWD"],
  },

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

  // 초종품 검사 (고전압 압출, 고전압 쉬즈, 저전압 조사전)
  {
    path: "/api/initFinalSub",
    proc: "TR52122",
    keys: ["i_SDATE", "i_EDATE", "i_ITM_GRP", "i_LANG", "i_STR"],
  },

  // 사용자 로그인 기록
  {
    path: "/api/log/login",
    proc: "TR59003",
    keys: ["i_DATE", "i_START_TS"],
  },

  // 사용자 조회 카운트
  {
    path: "/api/log/search",
    proc: "TR59002",
    keys: ["i_DATE", "i_TYPE"],
  },
];

// =====================================================
// 4) 라우트 등록
// =====================================================
for (const r of routes) {
  const baseHandler = makeProcHandler(r);

  app.post(r.path, async (req, res, next) => {
    // 프로시저 호출 시작
    logger.info("proc request", {
      path: r.path,
      proc: r.proc,
      bodyKeys: req.body ? Object.keys(req.body) : [],
    });

    try {
      await Promise.resolve(baseHandler(req, res, next));
    } catch (err) {
      logger.error("proc handler error", {
        path: r.path,
        proc: r.proc,
        err:
          err && err.stack ? { message: err.message, stack: err.stack } : err,
      });
      next(err);
    }
  });
}

// =====================================================
// 5) Express 에러 핸들러
// =====================================================
app.use((err, req, res, next) => {
  logger.error("unhandled express error", {
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    err: err && err.stack ? { message: err.message, stack: err.stack } : err,
  });

  res.status(500).json({
    ok: false,
    message: "Internal Server Error",
  });
});

// =====================================================
// 6) 서버 시작
// =====================================================
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  logger.info("server started", { port: PORT, env: process.env.NODE_ENV });
});
