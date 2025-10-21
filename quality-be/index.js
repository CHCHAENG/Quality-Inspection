require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./src/db");

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// api test
app.post("/api/test", async (req, res) => {
  try {
    const { sendData } = req.body;

    const parts = sendData.split(";");

    const i_SDATE = parts[0];
    const i_EDATE = parts[1];
    const i_CMCD = parts[2];
    const i_CSTCD = parts[3];
    const i_LANG = parts[4];

    const [rows] = await pool.query("CALL TR25031(?, ?, ?, ?, ?)", [
      i_SDATE,
      i_EDATE,
      i_CMCD,
      i_CSTCD,
      i_LANG,
    ]);

    res.json(rows); // 프로시저 결과 반환
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB 호출 오류" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
