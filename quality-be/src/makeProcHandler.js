const { parseDelimited } = require("./parser");
const { callProcedure } = require("./db");

function makeProcHandler(config) {
  const { proc, keys, delimiter = ";" } = config;

  return async (req, res) => {
    try {
      const body = req.body || {};
      let paramObj = {};

      // sendData 기반 파싱
      if (typeof body.sendData === "string" && body.sendData.length > 0) {
        paramObj = parseDelimited(body.sendData, keys, delimiter);
      } else {
        // 키 기반 전송일 때
        for (const k of keys) {
          if (body[k] === undefined) {
            return res.status(400).json({ message: `Missing param: ${k}` });
          }
          paramObj[k] = String(body[k]).trim();
        }
      }

      const paramsInOrder = keys.map((k) => paramObj[k]);
      const result = await callProcedure(proc, paramsInOrder);
      res.json(result);
    } catch (err) {
      console.error(`[${proc}] error:`, err);
      res.status(500).json({ message: "DB 호출 오류", detail: err.message });
    }
  };
}

module.exports = { makeProcHandler };
