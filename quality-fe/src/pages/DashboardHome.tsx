// pages/DashboardHome.tsx
import { Box, Button, Typography } from "@mui/material";
import { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Common/Sidebar";

interface SectionProps {
  title: string;
  buttons: { label: string; path: string }[];
}

function Section({ title, buttons }: SectionProps) {
  return (
    <Box
      sx={{
        mb: 8,
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            mb: 1.5,
          }}
        >
          {title}
        </Typography>
        <Box sx={{ borderBottom: "1px solid #bdbdbd" }} />
      </Box>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          columnGap: 8,
          rowGap: 4,
        }}
      >
        {buttons.map((btn) => (
          <Button
            key={btn.label}
            component={Link}
            to={btn.path}
            variant="outlined"
            sx={{
              minWidth: 230,
              height: 54,
              borderRadius: 999,
              px: 4,
              fontSize: 15,
              borderColor: "#000",
              color: "#000",
              justifyContent: "center",
              textTransform: "none",
              transition: "background-color 0.2s ease, border-color 0.2s ease",

              "&:hover": {
                bgcolor: "#e0f2ff",
                borderColor: "#1976d2",
              },
            }}
          >
            {btn.label}
          </Button>
        ))}
      </Box>
    </Box>
  );
}

export default function DashboardHome() {
  const [collapsed, setCollapsed] = useState(false);
  const toggleSidebar = () => setCollapsed(!collapsed);

  return (
    <Box sx={{ display: "flex", width: "100%", height: "100vh" }}>
      <Sidebar collapsed={collapsed} toggleSidebar={toggleSidebar} />

      <Box
        sx={{
          pt: 5,
          pb: 8,
          px: 6,
          maxWidth: 1200,
          mx: "auto",
        }}
      >
        <Section
          title="품질검사 성적서"
          buttons={[
            { label: "원자재 수입검사", path: "/quality/mtr-insp/st" },
            { label: "일일 수입 검사일지", path: "/quality/mtr-insp/daily" },
            { label: "순회 검사일지", path: "/quality/prcs-insp/st" },
            {
              label: "고전압 완제품 검사일지",
              path: "/quality/final-insp/whex",
            },
            { label: "초종품 검사일지", path: "/quality/prcs-insp/we" },
          ]}
        />
      </Box>
    </Box>
  );
}
