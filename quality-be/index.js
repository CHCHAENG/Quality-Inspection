require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./server/db");

const app = express();

app.use(
  cors({
    origin: "*", // 운영에서는 특정 도메인만 허용하세요
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

/**
 * GET: 사용자 조회 → CALL TR_GET_USERS()
 * (프로시저는 SELECT id,name,email FROM users; 반환한다고 가정)
 */
app.get("/api/users", async (req, res) => {
  try {
    const [rowsSets] = await pool.query("CALL TR_GET_USERS()");
    const rows = rowsSets?.[0] ?? [];
    res.json(rows);
  } catch (err) {
    console.error("[TR_GET_USERS]", err);
    res.status(500).json({ message: err.sqlMessage || "DB 조회 오류" });
  }
});

/**
 * POST: 사용자 추가 → CALL TR_ADD_USER(?, ?)
 * (프로시저 내부에서 INSERT 처리한다고 가정)
 */
app.post("/api/users", async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ ok: false, message: "이름/이메일은 필수" });
    }

    const [rowsSets] = await pool.query("CALL TR_ADD_USER(?, ?)", [
      name,
      email,
    ]);

    // 프로시저에서 SELECT LAST_INSERT_ID() AS id; 반환한다고 가정
    const result = rowsSets?.[0]?.[0] || {};
    res.json({ ok: true, id: result.id });
  } catch (err) {
    console.error("[TR_ADD_USER]", err);
    res
      .status(500)
      .json({ ok: false, message: err.sqlMessage || "DB 입력 오류" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
