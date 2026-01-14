// components/Common/menu.config.ts
import type { ReactNode } from "react";
import {
  MdDashboard,
  MdAssessment,
  MdSettings,
  MdTrendingUp,
  MdToday,
  MdBuild,
  MdFactory,
  MdViewList,
} from "react-icons/md";

export type MenuItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  to?: string;
  children?: MenuItem[];
};

export const MENU: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <MdDashboard />,
    children: [
      {
        id: "overview",
        label: "Overview",
        to: "/dashboard/overview",
        icon: <MdViewList />,
      },
      {
        id: "analytics",
        label: "Analytics",
        icon: <MdAssessment />,
        children: [
          {
            id: "realtime",
            label: "Realtime",
            to: "/dashboard/analytics/realtime",
            icon: <MdTrendingUp />,
          },
          {
            id: "daily",
            label: "Daily",
            to: "/dashboard/analytics/daily",
            icon: <MdToday />,
          },
          {
            id: "custom",
            label: "Custom",
            icon: <MdBuild />,
            children: [
              {
                id: "by-factory",
                label: "By Factory",
                to: "/dashboard/analytics/custom/factory",
                icon: <MdFactory />,
              },
              {
                id: "by-line",
                label: "By Line",
                to: "/dashboard/analytics/custom/line",
                icon: <MdViewList />,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: <MdSettings />,
    children: [
      {
        id: "profile",
        label: "Profile",
        to: "/settings/profile",
        icon: <MdViewList />,
      },
      { id: "team", label: "Team", to: "/settings/team", icon: <MdViewList /> },
    ],
  },
];
