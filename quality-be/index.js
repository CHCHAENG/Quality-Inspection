const express = require("express");
const cors = require("cors");
const { randomUUID } = require("crypto");

const { makeProcHandler } = require("./src/makeProcHandler");

// ✅ winston logger (내가 전에 준 파일 기준)
const { logger } = require("./src/logger"); // 경로가 다르면 수정: "./src/logger" 등
const { runWithContext } = require("./src/logger/requestContext"); // 경로 수정 가능

const app = express();
app.use(cors());
app.use(express.json());

// =====================================================
// 1) requestId 컨텍스트 (요청 단위 추적)
// =====================================================
app.use((req, res, next) => {
  const rid = req.headers["x-request-id"] || randomUUID();
  // 응답 헤더에도 넣어주면, 프론트/프록시에서 추적 쉬움
  res.setHeader("X-Request-Id", rid);

  runWithContext({ requestId: rid }, () => next());
});

// =====================================================
// 2) HTTP 접근 로그 (http-YYYY-MM-DD.log로 저장됨)
// =====================================================
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const ms = Date.now() - start;

    logger.log({
      level: "http",
      message: "HTTP",
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
];

// =====================================================
// 4) 라우트 등록 (프로시저 핸들러를 로그 래핑)
//    - 요청/응답 과정에서 proc/path를 로그로 남김
// =====================================================
for (const r of routes) {
  const baseHandler = makeProcHandler(r);

  app.post(r.path, async (req, res, next) => {
    // ✅ “프로시저 호출 시작” 로그 (원치 않으면 이 블록 삭제)
    logger.info("proc request", {
      path: r.path,
      proc: r.proc,
      // 필요한 값만 남겨 (req.body 통째는 위험할 수 있음)
      bodyKeys: req.body ? Object.keys(req.body) : [],
    });

    try {
      // makeProcHandler가 async가 아닐 수도 있으니 Promise.resolve로 감쌈
      await Promise.resolve(baseHandler(req, res, next));
    } catch (err) {
      // ✅ 여기서 잡히는 에러는 error-YYYY-MM-DD.log로 감
      logger.error("proc handler error", {
        path: r.path,
        proc: r.proc,
        err:
          err && err.stack ? { message: err.message, stack: err.stack } : err,
      });
      next(err);
    }
  });

  // logger.info(`POST ${r.path} -> CALL ${r.proc}(${r.keys.join(", ")})`);
}

// =====================================================
// 5) Express 에러 핸들러 (마지막에 있어야 함)
//    - next(err)로 넘어온 에러를 최종 기록
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
