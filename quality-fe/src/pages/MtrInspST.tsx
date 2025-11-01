import { Box } from "@mui/material";
import { useState, type ReactNode } from "react";
import Sidebar from "../components/Common/Sidebar";
import { Outlet } from "react-router-dom";
import DataGridSelectAndExport from "../components/Common/DataGridSelectAndExport";

interface MtrInspSTProps {
  children?: ReactNode;
}

export default function MtrInspST({ children }: MtrInspSTProps) {
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
          // width: "100%",
          height: "100dvh",
          minHeight: 0,
          p: 3,
          transition: "margin 0.3s",
        }}
      >
        {children ?? <Outlet />}
        <DataGridSelectAndExport />
      </Box>
    </Box>
  );
}
