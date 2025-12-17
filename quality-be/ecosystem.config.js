// C:/MES_PROJECT/01.WebProject/Quality-Inspection/quality-be/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "quality-api",
      script: "index.js",
      cwd: "C:/MES_PROJECT/01.WebProject/Quality-Inspection/quality-be",

      // ── 프로덕션 클러스터 설정 ───────────────────────────────
      exec_mode: "cluster",
      instances: 1, // 코어 수만큼 워커
      node_args: [], // 필요시 "--max-old-space-size=1024"
      watch: false, // 운영에선 비활성 권장
      max_memory_restart: "512M", // 메모리 초과 시 재시작
      autorestart: true,
      restart_delay: 2000,

      // ── 로그 ───────────────────────────────────────────────
      output:
        "C:/MES_PROJECT/01.WebProject/Quality-Inspection/logs/quality-api.out.log",
      error:
        "C:/MES_PROJECT/01.WebProject/Quality-Inspection/logs/quality-api.err.log",
      pid_file:
        "C:/MES_PROJECT/01.WebProject/Quality-Inspection/logs/quality-api.pid",
      merge_logs: true,
      time: true,

      // ── 환경변수 ───────────────────────────────────────────
      env: {
        NODE_ENV: "production",
        PORT: 4000,
        // .env 사용 중이면 DB_HOST/USER/PASS/NAME 등은 index.js에서 dotenv로 로드됨
      },

      // PM2가 종료 신호 보낼 때 종료를 기다리도록(선택)
      kill_timeout: 10000,
    },
  ],
};
