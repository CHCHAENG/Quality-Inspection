import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { ReactNode } from "react";

interface DashboardProps {
  children?: ReactNode;
}
export default function Dashboard({ children }: DashboardProps) {
  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        height: "100vh",
        transition: "margin 0.3s",
      }}
    >
      {/* 본문 영역 */}
      {children ?? <Outlet />}
    </Box>
  );
}
