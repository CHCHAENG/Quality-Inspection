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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
} from "@mui/material";
import { FiAlignJustify } from "react-icons/fi";
import {
  RiDashboardHorizontalFill,
  RiBarChartHorizontalFill,
} from "react-icons/ri";
import { MdExpandMore } from "react-icons/md";
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

// 샘플 메뉴 (depth 3)
const MENU: MenuNode[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: RiDashboardHorizontalFill,
    path: "/",
  },
  {
    id: "statistics",
    label: "Statistics",
    icon: RiBarChartHorizontalFill,
    children: [
      { id: "stats-overview", label: "Overview", path: "/statistics" },
      {
        id: "stats-sales",
        label: "Sales",
        children: [
          {
            id: "sales-daily",
            label: "Daily",
            path: "/statistics/sales/daily",
          },
          {
            id: "sales-monthly",
            label: "Monthly",
            children: [
              {
                id: "sales-monthly-summary",
                label: "Summary",
                path: "/statistics/sales/monthly/summary",
              },
              {
                id: "sales-monthly-detail",
                label: "Detail",
                path: "/statistics/sales/monthly/detail",
              },
            ],
          },
        ],
      },
    ],
  },
];

const useActiveHelpers = (pathname: string) => {
  const isExactActive = useCallback(
    (node: MenuNode) => !!node.path && pathname === node.path,
    [pathname]
  );
  const isTreeActive = useCallback(
    (node: MenuNode): boolean =>
      (node.path && pathname.startsWith(node.path)) ||
      (node.children ?? []).some(
        (c) =>
          (c.path && pathname.startsWith(c.path)) ||
          (c.children?.some ? isTreeActive(c) : false)
      ),
    [pathname]
  );
  return { isExactActive, isTreeActive };
};

type ExpandedMap = Record<string, boolean>;

function SidebarItemTree({
  node,
  depth,
  collapsed,
  expandedMap,
  setExpandedMap,
  isExactActive,
  isTreeActive,
  navigate,
}: {
  node: MenuNode;
  depth: number;
  collapsed: boolean;
  expandedMap: ExpandedMap;
  setExpandedMap: React.Dispatch<React.SetStateAction<ExpandedMap>>;
  isExactActive: (n: MenuNode) => boolean;
  isTreeActive: (n: MenuNode) => boolean;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const hasChildren = !!node.children?.length;
  const Icon = node.icon;
  const active = isExactActive(node);
  const subtreeActive = isTreeActive(node);

  const basePadding = collapsed ? 0 : 2;
  const leftIndent = collapsed ? 0 : depth * 2;

  const renderIcon = (
    <ListItemIcon
      sx={{
        minWidth: 0,
        mr: collapsed ? 0 : 2,
        justifyContent: "center",
        color: active || subtreeActive ? "#0288d1" : "#757575",
      }}
    >
      {Icon ? <Icon size={collapsed ? 24 : 18} /> : null}
    </ListItemIcon>
  );

  if (!hasChildren) {
    const button = (
      <ListItem disablePadding>
        <ListItemButton
          onClick={() => node.path && navigate(node.path)}
          sx={{
            px: basePadding,
            pl: collapsed ? 0 : leftIndent + 2,
            bgcolor: active ? "#e0f2ff" : "transparent",
            color: active ? "#0288d1" : "#424242",
            fontWeight: active ? 700 : 400,
            transition: "all 0.2s ease",
            "&:hover": {
              bgcolor: active ? "#b3e5fc" : "#f0f0f0",
              color: "#0288d1", // hover 시 텍스트 파란색
            },
          }}
        >
          {renderIcon}
          {!collapsed && (
            <ListItemText
              primary={node.label}
              primaryTypographyProps={{ noWrap: true }}
            />
          )}
        </ListItemButton>
      </ListItem>
    );
    return collapsed ? (
      <Tooltip title={node.label} placement="right">
        <Box>{button}</Box>
      </Tooltip>
    ) : (
      button
    );
  }

  // ✅ 완전 제어형: expanded는 오직 expandedMap으로만 결정
  const expanded = !!expandedMap[node.id];

  return (
    <Accordion
      disableGutters
      square
      elevation={0}
      expanded={expanded}
      // ✅ onChange로만 토글 제어
      onChange={(_, isExp) =>
        setExpandedMap((prev) => ({ ...prev, [node.id]: isExp }))
      }
      sx={{
        bgcolor: subtreeActive ? "#f7fbff" : "transparent",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={!collapsed && <MdExpandMore />}
        sx={{
          minHeight: 40,
          "& .MuiAccordionSummary-content": { my: 0.5, alignItems: "center" },
          px: basePadding,
          pl: collapsed ? 0 : leftIndent + 2,
          bgcolor: subtreeActive ? "#f7fbff" : "transparent",
          color: subtreeActive ? "#0288d1" : "#424242",
          fontWeight: subtreeActive ? 600 : 400,
          transition: "all 0.2s ease",
          "&:hover": {
            bgcolor: "#f0f0f0",
            color: "#0288d1", // hover 시 텍스트 파란색
          },
        }}
      >
        {renderIcon}
        {!collapsed && (
          <ListItemText
            primary={node.label}
            primaryTypographyProps={{ noWrap: true }}
          />
        )}
      </AccordionSummary>

      {/* 접힘 모드(collapsed)에서도 펼침을 허용하려면 아래를 유지,
          접힘 시 항상 닫힌 상태를 원하면 expanded 계산을 collapsed와 조합하세요 */}
      <AccordionDetails sx={{ p: 0 }}>
        <List disablePadding>
          {node.children!.map((child) => (
            <SidebarItemTree
              key={child.id}
              node={child}
              depth={Math.min(depth + 1, 3)}
              collapsed={collapsed}
              expandedMap={expandedMap}
              setExpandedMap={setExpandedMap}
              isExactActive={isExactActive}
              isTreeActive={isTreeActive}
              navigate={navigate}
            />
          ))}
        </List>
      </AccordionDetails>
    </Accordion>
  );
}

export default function Sidebar({ collapsed, toggleSidebar }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isExactActive, isTreeActive } = useActiveHelpers(location.pathname);

  // ✅ 최초 한 번만 현재 경로 포함 브랜치 펼침
  const initialExpanded = useMemo<ExpandedMap>(() => {
    const map: ExpandedMap = {};
    const walk = (n: MenuNode) => {
      if (n.children?.length) {
        map[n.id] = isTreeActive(n); // 최초만 true 설정
        n.children.forEach(walk);
      }
    };
    MENU.forEach(walk);
    return map;
  }, [isTreeActive]);

  const [expandedMap, setExpandedMap] = useState<ExpandedMap>(initialExpanded);

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

      <List disablePadding sx={{ py: 1 }}>
        {MENU.map((node) => (
          <SidebarItemTree
            key={node.id}
            node={node}
            depth={0}
            collapsed={collapsed}
            expandedMap={expandedMap}
            setExpandedMap={setExpandedMap}
            isExactActive={isExactActive}
            isTreeActive={isTreeActive}
            navigate={navigate}
          />
        ))}
      </List>
    </Box>
  );
}
