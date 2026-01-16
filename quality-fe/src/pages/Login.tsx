import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Stack,
} from "@mui/material";

const logo = "/logo.jpg";

type LoginPageProps = {
  onLogin?: (payload: { id: string; password: string }) => void | Promise<void>;
  title?: string;
};

export default function Login({
  onLogin,
  title = "장안 품질검사 성적서",
}: LoginPageProps) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(
    () => id.trim().length > 0 && password.trim().length > 0 && !loading,
    [id, password, loading]
  );

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      setLoading(true);
      await onLogin?.({ id: id.trim(), password });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        bgcolor: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pt: { xs: 10, md: 14 },
        px: 2,
        overflow: "hidden",
      }}
    >
      {/* 로고 */}
      <Box
        component="img"
        src={logo}
        alt="logo"
        sx={{
          height: { xs: 36, md: 44 },
          mb: { xs: 6, md: 7 },
          userSelect: "none",
        }}
      />

      {/* 로그인 카드 */}
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 620,
          borderRadius: 4,
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
          px: { xs: 3, md: 6 },
          py: { xs: 4, md: 5 },
        }}
      >
        <Typography
          sx={{
            textAlign: "center",
            fontWeight: 700,
            fontSize: { xs: 20, md: 28 },
            mb: { xs: 4, md: 5 },
          }}
        >
          {title}
        </Typography>

        <Box sx={{ maxWidth: 560, mx: "auto" }}>
          {/* ID Row */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems="center"
            spacing={2}
            sx={{ mb: 2 }}
          >
            {/* 라벨 - 카드 왼쪽 시작선 */}
            <Box sx={{ width: 120 }}>
              <Typography
                sx={{
                  fontWeight: 600,
                  color: "#334155",
                  textAlign: "left",
                  lineHeight: "46px",
                }}
              >
                ID
              </Typography>
            </Box>

            {/* 입력칸 */}
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                value={id}
                onChange={(e) => setId(e.target.value)}
                autoComplete="username"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 46,
                    bgcolor: "#fff",
                  },
                }}
              />
            </Box>
          </Stack>

          {/* Password Row */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems="center"
            spacing={2}
            sx={{ mb: 3 }}
          >
            {/* 라벨 - 카드 왼쪽 시작선 */}
            <Box sx={{ width: 120 }}>
              <Typography
                sx={{
                  fontWeight: 600,
                  color: "#334155",
                  textAlign: "left",
                  lineHeight: "46px",
                }}
              >
                Password
              </Typography>
            </Box>

            {/* 입력칸 */}
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 46,
                    bgcolor: "#fff",
                  },
                }}
              />
            </Box>
          </Stack>

          {/* 버튼 (그대로 유지) */}
          <Button
            fullWidth
            size="large"
            variant="contained"
            disabled={!canSubmit}
            onClick={handleSubmit}
            sx={{
              height: 46,
              fontWeight: 700,
              borderRadius: 1,
              textTransform: "none",
              bgcolor: "#324a6d",
              "&:hover": { bgcolor: "#2b3f5d" },
            }}
          >
            {loading ? "로그인 중..." : "로그인"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
