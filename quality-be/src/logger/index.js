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

const devConsoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss.SSS" }),
  winston.format.errors({ stack: true }),
  injectContext(),
  redactFormat(),
  winston.format.printf((info) => {
    const { timestamp, level, message, requestId, stack, ...rest } = info;
    const ctx = requestId ? ` rid=${requestId}` : "";
    const meta = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : "";
    const msg = stack ? `${message}\n${stack}` : message;
    return `${timestamp} ${level}${ctx} ${msg}${meta}`;
  })
);

const rotateCommon = {
  dirname: path.join(LOG_DIR, "%DATE%"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m", // 같은 날짜 안에서도 20MB 넘으면 분할
};

const appFile = new DailyRotateFile({
  ...rotateCommon,
  filename: "app-%DATE%.log",
  level: "info",
  maxFiles: "14d",
});

const errFile = new DailyRotateFile({
  ...rotateCommon,
  filename: "error-%DATE%.log",
  level: "error",
  maxFiles: "30d",
});

const exceptionFile = new DailyRotateFile({
  ...rotateCommon,
  filename: "exceptions-%DATE%.log",
  maxFiles: "30d",
});

const rejectionFile = new DailyRotateFile({
  ...rotateCommon,
  filename: "rejections-%DATE%.log",
  maxFiles: "30d",
});

const logger = winston.createLogger({
  level: isProd ? "info" : "debug",
  format: jsonFormat,
  transports: [
    appFile,
    errFile,
    ...(isProd
      ? []
      : [new winston.transports.Console({ format: devConsoleFormat })]),
  ],
  exceptionHandlers: [exceptionFile],
  rejectionHandlers: [rejectionFile],
});

// 로거 자체 에러
logger.on("error", (e) => console.error("LOGGER ERROR:", e));

module.exports = { logger, LOG_DIR };
