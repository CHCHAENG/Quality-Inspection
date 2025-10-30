// import { useNavigate, useLocation } from "react-router-dom";

// import {
//   Box,
//   Toolbar,
//   IconButton,
//   List,
//   ListItem,
//   ListItemButton,
//   ListItemIcon,
// } from "@mui/material";
// import { FiAlignJustify } from "react-icons/fi";
// import { RiDashboardHorizontalFill } from "react-icons/ri";

// interface SidebarProps {
//   collapsed: boolean;
//   toggleSidebar: () => void;
// }

// export default function Sidebar({ collapsed, toggleSidebar }: SidebarProps) {
//   const menuItems = [
//     { label: "품질검사성적서", icon: RiDashboardHorizontalFill, path: "/" },
//   ];

//   const navigate = useNavigate();
//   const location = useLocation();

//   return (
//     <Box
//       sx={{
//         width: collapsed ? 60 : 260,
//         height: "100vh",
//         minHeight: "100vh",
//         display: "flex",
//         flexDirection: "column",
//         bgcolor: "#f4f6f8",
//         overflowY: "auto",
//         borderRight: "1px solid #e0e0e0",
//       }}
//     >
//       <Toolbar
//         sx={{
//           display: "flex",
//           justifyContent: collapsed ? "center" : "flex-end",
//         }}
//       >
//         <IconButton onClick={toggleSidebar}>
//           <FiAlignJustify />
//         </IconButton>
//       </Toolbar>

//       <List>
//         {menuItems.map((item, index) => {
//           const IconComponent = item.icon;
//           const isActive = location.pathname === item.path;

//           return (
//             <ListItem disablePadding key={index}>
//               <ListItemButton
//                 onClick={() => navigate(item.path)}
//                 sx={{
//                   px: 2,
//                   justifyContent: collapsed ? "center" : "flex-start",
//                   bgcolor: isActive ? "#e0f2ff" : "transparent",
//                   "&:hover": {
//                     bgcolor: isActive ? "#b3e5fc" : "#f5f5f5",
//                   },
//                 }}
//               >
//                 <ListItemIcon
//                   sx={{
//                     minWidth: 0,
//                     mr: collapsed ? 0 : 2,
//                     display: "flex",
//                     justifyContent: "center",
//                     color: isActive ? "#0288d1" : "#757575",
//                   }}
//                 >
//                   <IconComponent size={collapsed ? 28 : 20} />
//                 </ListItemIcon>
//                 {!collapsed && (
//                   <span
//                     style={{
//                       color: isActive ? "#0288d1" : "#424242",
//                       fontWeight: isActive ? 600 : 400,
//                     }}
//                   >
//                     {item.label}
//                   </span>
//                 )}
//               </ListItemButton>
//             </ListItem>
//           );
//         })}
//       </List>
//     </Box>
//   );
// }

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
import { FiAlignJustify } from "react-icons/fi";
import { RiDashboardHorizontalFill } from "react-icons/ri";
import { MdExpandMore, MdChevronRight } from "react-icons/md";
import type { IconType } from "react-icons";

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

// --- Menu Data (예시) ---
const MENU: MenuNode[] = [
  {
    id: "quality",
    label: "품질검사성적서",
    icon: RiDashboardHorizontalFill,
    path: "/",
    children: [
      {
        id: "mtr-insp",
        label: "원자재 수입검사 일지",
        children: [
          {
            id: "ST",
            label: "연선",
            path: "/quality/mtr-insp/st",
          },
          {
            id: "PVC",
            label: "PVC",
            path: "/quality/mtr-insp/pvc",
          },
          {
            id: "SCR",
            label: "SCR",
            path: "/quality/mtr-insp/scr",
          },
        ],
      },
      {
        id: "mtr-insp-daliy",
        label: "수입검사일지",
        path: "/quality/mtr-daliy",
      },
    ],
  },
];

// Helper: 경로가 활성인지 (하위 경로 포함)
const isPathActive = (currentPath: string, nodePath?: string) => {
  if (!nodePath) return false;
  if (nodePath === "/") return currentPath === "/";
  return currentPath === nodePath || currentPath.startsWith(nodePath + "/");
};

export default function Sidebar({ collapsed, toggleSidebar }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // 열림 상태를 노드 id 기준으로 관리
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  // 현재 경로에 해당하는 부모 체인은 자동으로 열어두기
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
    (id: string) => openMap[id] ?? autoOpenIds.has(id),
    [openMap, autoOpenIds]
  );

  const toggleOpen = useCallback(
    (id: string) => {
      setOpenMap((prev) => ({ ...prev, [id]: !isOpen(id) }));
    },
    [isOpen]
  );

  const renderNodes = useCallback(
    (nodes: MenuNode[], depth = 0) => (
      <List disablePadding>
        {nodes.map((node) => {
          const IconComp = node.icon;
          const active = isPathActive(location.pathname, node.path);
          const hasChildren = !!node.children?.length;

          const button = (
            <ListItemButton
              onClick={() => {
                if (hasChildren) {
                  toggleOpen(node.id);
                } else if (node.path) {
                  navigate(node.path);
                }
              }}
              sx={{
                pl: collapsed ? 0 : 2 + depth * 2,
                justifyContent: collapsed ? "center" : "flex-start",
                bgcolor: active ? "#e0f2ff" : "transparent",
                borderRadius: 1,
                mx: collapsed ? 1 : 1,
                my: 0.5,
                "&:hover": { bgcolor: active ? "#b3e5fc" : "#f5f5f5" },
              }}
            >
              {IconComp ? (
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: collapsed ? 0 : 1.5,
                    color: active ? "#0288d1" : "#757575",
                    justifyContent: "center",
                  }}
                >
                  <IconComp size={collapsed ? 22 : 18} />
                </ListItemIcon>
              ) : null}

              {!collapsed && (
                <ListItemText
                  primary={node.label}
                  primaryTypographyProps={{
                    noWrap: true,
                    fontWeight: active ? 600 : 400,
                    color: active ? "#0288d1" : "#424242",
                    fontSize: 14,
                  }}
                />
              )}

              {hasChildren &&
                !collapsed &&
                (isOpen(node.id) ? <MdExpandMore /> : <MdChevronRight />)}
            </ListItemButton>
          );

          return (
            <ListItem key={node.id} disablePadding sx={{ display: "block" }}>
              {collapsed ? (
                <Tooltip title={node.label} placement="right">
                  <Box>{button}</Box>
                </Tooltip>
              ) : (
                button
              )}

              {hasChildren && (
                <Collapse in={isOpen(node.id)} timeout="auto" unmountOnExit>
                  {renderNodes(node.children!, depth + 1)}
                </Collapse>
              )}
            </ListItem>
          );
        })}
      </List>
    ),
    [collapsed, isOpen, location.pathname, navigate, toggleOpen]
  );

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

      {renderNodes(MENU)}
    </Box>
  );
}
