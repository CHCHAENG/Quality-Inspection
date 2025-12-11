// Sidebar.tsx
import { useMemo, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Toolbar,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Tooltip,
} from "@mui/material";
import { RiDashboardHorizontalFill } from "react-icons/ri";
import { MdExpandMore, MdChevronRight } from "react-icons/md";
import type { IconType } from "react-icons";
import { Link } from "react-router-dom";

interface SidebarProps {
  collapsed: boolean;
  toggleSidebar: () => void;
}

export interface MenuNode {
  id: string;
  label: string;
  path?: string;
  icon?: IconType;
  children?: MenuNode[];
}

// 메뉴 데이터
const MENU: MenuNode[] = [
  {
    id: "quality",
    label: "품질검사성적서",
    icon: RiDashboardHorizontalFill,
    path: "/quality",
    children: [
      {
        id: "mtr-insp",
        label: "원자재 수입검사 일지",
        children: [
          { id: "mtr-insp-ST", label: "연선", path: "/quality/mtr-insp/st" },
          { id: "mtr-insp-PVC", label: "PVC", path: "/quality/mtr-insp/pvc" },
          { id: "mtr-insp-SCR", label: "SCR", path: "/quality/mtr-insp/scr" },
        ],
      },
      {
        id: "mtr-daily",
        label: "일일 수입검사일지",
        path: "/quality/mtr-insp/daily",
      },
      {
        id: "prcs-insp",
        label: "순회검사 일지",
        children: [
          { id: "prcs-insp-ST", label: "연선", path: "/quality/prcs-insp/st" },
          { id: "prcs-insp-DR", label: "신선", path: "/quality/prcs-insp/dr" },
          { id: "prcs-insp-WE", label: "압출", path: "/quality/prcs-insp/we" },
        ],
      },
      {
        id: "final-insp",
        label: "고전압 완제품 검사 일지",
        path: "/quality/final-insp/whex",
      },
      {
        id: "initFinal-insp",
        label: "초종품 검사일지",
        children: [
          {
            id: "final-insp-WE",
            label: "저전압 압출",
            path: "/quality/final-insp/we",
          },
          {
            id: "initFinal-insp-WX",
            label: "저전압 조사전",
            path: "/quality/initFinal-insp/wx",
          },
          {
            id: "final-insp-WX",
            label: "저전압 조사후",
            path: "/quality/final-insp/wx",
          },
          {
            id: "initFinal-insp-WHEX",
            label: "고전압 쉬즈",
            path: "/quality/initFinal-insp/whex",
          },
          {
            id: "initFinal-insp-WHBS",
            label: "고전압 압출",
            path: "/quality/initFinal-insp/whbs",
          },
        ],
      },
    ],
  },
];

// 활성 경로 판별
const isPathActive = (currentPath: string, nodePath?: string) => {
  if (!nodePath) return false;
  if (nodePath === "/") return currentPath === "/";
  return currentPath === nodePath || currentPath.startsWith(nodePath + "/");
};

export default function Sidebar({ collapsed, toggleSidebar }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  // 현재 경로에 해당하는 체인 자동 펼침
  const autoOpenIds = useMemo(() => {
    const ids = new Set<string>();
    const dfs = (nodes: MenuNode[], chain: string[]) => {
      nodes.forEach((n) => {
        const next = [...chain, n.id];
        if (n.path && isPathActive(location.pathname, n.path)) {
          next.forEach((id) => ids.add(id));
        }
        if (n.children) dfs(n.children, next);
      });
    };
    dfs(MENU, []);
    return ids;
  }, [location.pathname]);

  const isOpen = useCallback(
    (id: string) => (id in openMap ? openMap[id] : autoOpenIds.has(id)),
    [openMap, autoOpenIds]
  );

  const toggleOpen = useCallback(
    (id: string) => setOpenMap((prev) => ({ ...prev, [id]: !isOpen(id) })),
    [isOpen]
  );

  const renderNodes = useCallback(
    (nodes: MenuNode[], depth = 0) => (
      <List disablePadding>
        {nodes.map((node) => {
          const IconComp = node.icon;
          const active = node.path
            ? isPathActive(location.pathname, node.path)
            : autoOpenIds.has(node.id);
          const hasChildren = !!node.children?.length;

          return (
            <ListItem key={node.id} disablePadding sx={{ display: "block" }}>
              <ListItemButton
                selected={Boolean(node.path) && active && !collapsed}
                disableRipple
                disableTouchRipple
                onClick={() => {
                  if (hasChildren) {
                    toggleOpen(node.id);
                  } else if (node.path) {
                    navigate(node.path);
                  }
                }}
                sx={{
                  px: collapsed ? 0 : 2,
                  pl: collapsed ? 0 : 1 + depth * 2,
                  pr: collapsed ? 0 : 2,
                  minHeight: 44,
                  justifyContent: collapsed ? "center" : "flex-start",
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                  transition: "background-color .15s ease",

                  "&.Mui-selected": { bgcolor: "#e0f2ff" },
                  "&.Mui-selected:hover": { bgcolor: "#e0f2ff" },
                  "&:hover": { bgcolor: "#cbe7ff" },
                }}
              >
                {IconComp ? (
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: collapsed ? 0 : 1.5,
                      width: collapsed ? "100%" : "auto",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      color: active ? "#0288d1" : "#757575",
                    }}
                  >
                    {collapsed ? (
                      <Tooltip title={node.label} placement="right">
                        <Box sx={{ display: "flex" }}>
                          <IconComp size={collapsed ? 22 : 18} />
                        </Box>
                      </Tooltip>
                    ) : (
                      <IconComp size={collapsed ? 22 : 18} />
                    )}
                  </ListItemIcon>
                ) : null}

                <Box
                  sx={{
                    display: collapsed ? "none" : "block",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <ListItemText
                    primary={node.label}
                    primaryTypographyProps={{
                      noWrap: true,
                      fontWeight: active ? 600 : 400,
                      color: active ? "#0288d1" : "#424242",
                      fontSize: 14,
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    display: hasChildren && !collapsed ? "flex" : "none",
                    alignItems: "center",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hasChildren) toggleOpen(node.id);
                  }}
                >
                  {isOpen(node.id) ? <MdExpandMore /> : <MdChevronRight />}
                </Box>
              </ListItemButton>

              {hasChildren && (
                <Collapse in={isOpen(node.id)} timeout="auto">
                  {renderNodes(node.children!, depth + 1)}
                </Collapse>
              )}
            </ListItem>
          );
        })}
      </List>
    ),
    [collapsed, isOpen, location.pathname, navigate, toggleOpen, autoOpenIds]
  );

  return (
    <Box
      component="nav"
      aria-label="sidebar"
      sx={{
        position: "fixed",
        width: collapsed ? 60 : 250,
        transition: "width .2s ease",
        height: "100vh",
        alignSelf: "stretch",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        bgcolor: "#f4f6f8",
        overflow: "hidden",
        borderRight: "1px solid #e0e0e0",
        zIndex: "1200",
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: collapsed ? "center" : "flex-end",
        }}
      >
        <IconButton
          onClick={toggleSidebar}
          sx={{
            p: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
          }}
        >
          {collapsed ? (
            <img
              src="/icon.png"
              style={{
                width: "30px",
                height: "auto",
                display: "block",
                margin: "0 auto",
              }}
            />
          ) : (
            <Link to="/quality" style={{ textDecoration: "none" }}>
              <img
                src="/logo.jpg"
                style={{
                  width: "100px",
                  height: "auto",
                  display: "block",
                  margin: "0 auto",
                }}
              />
            </Link>
          )}
        </IconButton>
      </Toolbar>

      {renderNodes(MENU)}
    </Box>
  );
}
