const fs = require("fs");
const path = require("path");
const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const { redact } = require("./redact");
const { getContext } = require("./requestContext");

// 루트 logs 폴더
const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), "logs");
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const env = process.env.NODE_ENV || "development";
const isProd = env === "production";

// requestId/userId 같은 컨텍스트 주입
const injectContext = winston.format((info) => {
  const ctx = getContext();
  if (ctx.requestId && !info.requestId) info.requestId = ctx.requestId;
  if (ctx.userId && !info.userId) info.userId = ctx.userId;
  return info;
});

// 값 덮어쓰기
const redactFormat = winston.format((info) => {
  const safe = redact(info);
  for (const k of Object.keys(safe)) {
    info[k] = safe[k];
  }
  return info;
});

const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.errors({ stack: true }),
  injectContext(),
  redactFormat(),
  winston.format.json()
);

const rotateCommon = {
  dirname: path.join(LOG_DIR, "%DATE%"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m", // 20MB 넘으면 분할
};

const appFile = new DailyRotateFile({
  ...rotateCommon,
  filename: "app.log",
  level: "http",
  maxFiles: "14d",
  auditFile: path.join(LOG_DIR, ".audit-app.json"),
});

const errFile = new DailyRotateFile({
  ...rotateCommon,
  filename: "error.log",
  level: "error",
  maxFiles: "14d",
  auditFile: path.join(LOG_DIR, ".audit-app.json"),
});

const exceptionFile = new DailyRotateFile({
  ...rotateCommon,
  filename: "exceptions.log",
  maxFiles: "14d",
  auditFile: path.join(LOG_DIR, ".audit-app.json"),
});

const rejectionFile = new DailyRotateFile({
  ...rotateCommon,
  filename: "rejections.log",
  maxFiles: "14d",
  auditFile: path.join(LOG_DIR, ".audit-app.json"),
});

const logger = winston.createLogger({
  level: isProd ? "http" : "debug",
  format: jsonFormat,
  transports: [appFile, errFile, ...[]],
  exceptionHandlers: [exceptionFile],
  rejectionHandlers: [rejectionFile],
});

// 로거 자체 에러
logger.on("error", (e) => console.error("LOGGER ERROR:", e));

module.exports = { logger, LOG_DIR };
