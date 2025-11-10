import { Box } from "@mui/material";
import { useState, type ReactNode } from "react";
import Sidebar from "../components/Common/Sidebar";
import { Outlet } from "react-router-dom";

interface FinalInspProps {
  children?: ReactNode;
}

export default function FinalInsp({ children }: FinalInspProps) {
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
          flexBasis: 0,
          minWidth: 0,
          height: "100%",
          minHeight: 0,
          p: 2,
          transition: "margin 0.3s",
        }}
      >
        {children ?? <Outlet />}
      </Box>
    </Box>
  );
}
