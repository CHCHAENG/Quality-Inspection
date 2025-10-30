function parseDelimited(sendData, keys, delimiter = ";") {
  if (typeof sendData !== "string") {
    throw new Error("sendData 타입 확인");
  }

  const parts = sendData.split(delimiter);
  if (parts[parts.length - 1] === "") parts.pop();

  if (parts.length !== keys.length) {
    throw new Error(
      `Parameter 개수 오류. expected=${keys.length}, got=${parts.length}`
    );
  }

  const result = {};
  keys.forEach((k, i) => (result[k] = (parts[i] || "").trim()));
  return result;
}

module.exports = { parseDelimited };
 