import { Box } from "@mui/material";
import { Outlet, useNavigate } from "react-router-dom";
import { ReactNode, useEffect } from "react";

interface DashboardProps {
  children?: ReactNode;
}
export default function Dashboard({ children }: DashboardProps) {
  const chkLogin = window.sessionStorage.getItem("user");
  const navigate = useNavigate();

  useEffect(() => {
    if (chkLogin === null) navigate("/"); // 로그인되지 않은 경우 로그인페이지로 리다이렉트
  }, [chkLogin, navigate]);

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100vh",
        transition: "margin 0.3s",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 12,
          right: 0,
          fontSize: 14,
          color: "text.secondary",
          zIndex: 10,
        }}
      >
        접속자 : {chkLogin}
      </Box>

      {/* 본문 영역 */}
      {children ?? <Outlet />}
    </Box>
  );
}
