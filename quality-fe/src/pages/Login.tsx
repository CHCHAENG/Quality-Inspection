import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { login } from "../api/api";

const logo = "/logo.jpg";

export default function Login({
  title = "장안 품질검사 성적서",
}: {
  title?: string;
}) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const canSubmit = useMemo(
    () => id.trim().length > 0 && password.trim().length > 0 && !loading,
    [id, password, loading]
  );

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      const res = await login(`${id};${password};`);

      if (res?.ok === false) {
        setError(res.detail || "로그인에 실패했습니다.");
        return;
      }

      navigate("/quality"); // 메인 페이지로 이동
    } catch (err: unknown) {
      setError("로그인 중 오류가 발생했습니다." || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100dvh",
        width: "100%",
        bgcolor: "#fff",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <Box sx={{ width: "100%" }}>
        <Box
          component="img"
          src={logo}
          alt="logo"
          sx={{
            display: "block",
            height: { xs: 36, md: 44 },
            mb: { xs: 4, md: 5 },
            mx: "auto",
          }}
        />

        <Paper
          elevation={0}
          sx={{
            maxWidth: 620,
            mx: "auto",
            borderRadius: 4,
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
            backgroundColor: "#f4f6f8",
            px: { xs: 3, md: 6 },
            py: { xs: 4, md: 5 },
          }}
        >
          <Typography
            sx={{
              textAlign: "center",
              fontWeight: 700,
              fontSize: { xs: 20, md: 28 },
              mb: { xs: 3, md: 4 },
            }}
          >
            {title}
          </Typography>

          <Box sx={{ maxWidth: 560, mx: "auto" }}>
            {/* ID */}
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Box sx={{ width: 120 }}>
                <Typography sx={{ lineHeight: "46px", fontWeight: 600 }}>
                  ID
                </Typography>
              </Box>
              <TextField
                fullWidth
                value={id}
                onChange={(e) => setId(e.target.value)}
              />
            </Stack>

            {/* Password */}
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Box sx={{ width: 120 }}>
                <Typography sx={{ lineHeight: "46px", fontWeight: 600 }}>
                  Password
                </Typography>
              </Box>
              <TextField
                fullWidth
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </Stack>

            {/* ❌ 에러 메시지 */}
            {error && (
              <Typography
                sx={{ color: "error.main", mb: 2, textAlign: "center" }}
              >
                {error}
              </Typography>
            )}

            <Button
              fullWidth
              variant="contained"
              disabled={!canSubmit}
              onClick={handleSubmit}
              sx={{
                height: 46,
                fontWeight: 700,
                bgcolor: "#324a6d",
              }}
            >
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
