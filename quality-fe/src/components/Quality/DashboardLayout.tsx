import { Box } from "@mui/material";
import { useState } from "react";
import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Common/Sidebar";

interface DashboardLayoutProps {
  children?: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const toggleSidebar = () => setCollapsed(!collapsed);

  return (
    <Box sx={{ display: "flex", width: "100%", height: "100vh" }}>
      {/* 사이드바 */}
      <Sidebar collapsed={collapsed} toggleSidebar={toggleSidebar} />

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
