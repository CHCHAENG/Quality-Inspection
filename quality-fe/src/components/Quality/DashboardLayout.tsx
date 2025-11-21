import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";

interface DashboardLayoutProps {
  children?: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <Box sx={{ display: "flex", width: "100%", height: "100vh" }}>
      {/* 본문 영역 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: "100%",

          transition: "margin 0.3s",
        }}
      >
        {children ?? <Outlet />}
      </Box>
    </Box>
  );
}
