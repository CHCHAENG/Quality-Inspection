// components/Common/DashboardLayout.tsx

import { Box, Grid } from "@mui/material";
import Sidebar from "@/components/Common/SideBar";
import { ReactNode, useState } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
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
          padding: 3,
          transition: "margin 0.3s",
        }}
      >
        <Grid container spacing={2}>
          <Box sx={{ p: 3, width: "100%" }}>{children}</Box>
        </Grid>
      </Box>
    </Box>
  );
}
