// components/Common/DashboardLayout.tsx

import { Box, Grid } from "@mui/material";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { prcsSub } from "../../api/api";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children?: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const toggleSidebar = () => setCollapsed(!collapsed);

  useEffect(() => {
    (async () => {
      const result = await prcsSub();
      console.log("52122: ", result);
    })();
  }, []);

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
          p: 3,
          transition: "margin 0.3s",
        }}
      >
        <Grid container spacing={2}>
          {/* ✅ Grid container의 자식은 item 이어야 함 */}

          <Box sx={{ width: "100%" }}>
            {/* ✅ children이 없으면 <Outlet /> 대체 렌더 */}
            {children ?? <Outlet />}
          </Box>
        </Grid>
      </Box>
    </Box>
  );
}
