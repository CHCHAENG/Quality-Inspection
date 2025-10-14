import { useNavigate, useLocation } from "react-router-dom";

import {
  Box,
  Toolbar,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
} from "@mui/material";
import { FiAlignJustify } from "react-icons/fi";
import {
  RiDashboardHorizontalFill,
  RiBarChartHorizontalFill,
} from "react-icons/ri";

interface SidebarProps {
  collapsed: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ collapsed, toggleSidebar }: SidebarProps) {
  const menuItems = [
    { label: "Dashboard", icon: RiDashboardHorizontalFill, path: "/" },
    {
      label: "Statistics",
      icon: RiBarChartHorizontalFill,
      path: "/statistics",
    },
  ];

  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box
      sx={{
        width: collapsed ? 60 : 260,
        height: "100vh",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#f4f6f8",
        overflowY: "auto",
        borderRight: "1px solid #e0e0e0",
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: collapsed ? "center" : "flex-end",
        }}
      >
        <IconButton onClick={toggleSidebar}>
          <FiAlignJustify />
        </IconButton>
      </Toolbar>

      <List>
        {menuItems.map((item, index) => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <ListItem disablePadding key={index}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  px: 2,
                  justifyContent: collapsed ? "center" : "flex-start",
                  bgcolor: isActive ? "#e0f2ff" : "transparent",
                  "&:hover": {
                    bgcolor: isActive ? "#b3e5fc" : "#f5f5f5",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: collapsed ? 0 : 2,
                    display: "flex",
                    justifyContent: "center",
                    color: isActive ? "#0288d1" : "#757575",
                  }}
                >
                  <IconComponent size={collapsed ? 28 : 20} />
                </ListItemIcon>
                {!collapsed && (
                  <span
                    style={{
                      color: isActive ? "#0288d1" : "#424242",
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}
