import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRightOutlined,
  EventAvailableOutlined,
  HomeOutlined,
  Groups2Outlined,
  AdminPanelSettingsOutlined,
  HowToRegOutlined,
  PendingActionsOutlined,
  PersonOutlineOutlined,
} from "@mui/icons-material";
import { useMyCommunitiesQuery } from "@state/api";

import FlexBetween from "./FlexBetween";
import UnifiedBrand from "./UnifiedBrand";

const API_BASE = import.meta.env.VITE_APP_BASE_URL || "http://localhost:5001";

function toAbsoluteMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;
}

const Sidebar = ({
  user,
  drawerWidth,
  isSidebarOpen,
  setIsSidebarOpen,
  isNonMobile,
}) => {
  const { pathname } = useLocation();
  const [active, setActive] = useState("");
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    setActive(pathname.split("/")[1] || "dashboard");
  }, [pathname]);

  const userId = String(user?.id || user?._id || "");
  const { data: myCommunitiesData } = useMyCommunitiesQuery(undefined, {
    skip: !userId || user?.role === "super_admin",
  });

  const canApproveMemberships = useMemo(() => {
    if (user?.role === "super_admin") return false;
    if (!userId) return false;

    const communities = myCommunitiesData?.communities || [];
    return communities.some((community) => {
      const admins = (community?.admins || []).map((u) => String(u?._id || u));
      const moderators = (community?.moderators || []).map((u) =>
        String(u?._id || u),
      );
      return admins.includes(userId) || moderators.includes(userId);
    });
  }, [myCommunitiesData?.communities, user?.role, userId]);

  const navItems = useMemo(() => {
    const items = [
      { text: "Dashboard", path: "/dashboard", icon: <HomeOutlined /> },
    ];

    if (user?.role !== "super_admin") {
      items.push(
        {
          text: "Communities",
          path: "/communities",
          icon: <Groups2Outlined />,
        },
        {
          text: "My communities",
          path: "/my-communities",
          icon: <HowToRegOutlined />,
        },
        {
          text: "Events",
          path: "/my-events",
          icon: <EventAvailableOutlined />,
        },
      );
    }

    if (user?.role !== "super_admin") {
      items.push({
        text: "Membership Requests",
        path: "/membership-requests",
        icon: <PendingActionsOutlined />,
      });
    }

    items.push({
      text: "My Profile",
      path: "/profile",
      icon: <PersonOutlineOutlined />,
    });

    if (user?.role === "super_admin") {
      items.push({
        text: "Admin: Community approvals",
        path: "/admin/community-approvals",
        icon: <AdminPanelSettingsOutlined />,
      });
    }

    if (canApproveMemberships) {
      items.push({
        text: "Admin: Membership approvals",
        path: "/admin/membership-approvals",
        icon: <AdminPanelSettingsOutlined />,
      });
    }

    return items;
  }, [canApproveMemberships, user?.role]);

  return (
    <Box component="nav">
      {isSidebarOpen && (
        <Drawer
          open={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          variant="persistent"
          anchor="left"
          sx={{
            width: drawerWidth,
            "& .MuiDrawer-paper": {
              color: theme.palette.text.primary,
              backgroundColor: theme.palette.background.paper,
              boxSizing: "border-box",
              borderRight: `1px solid ${theme.palette.divider}`,
              width: drawerWidth,
            },
          }}
        >
          <Box
            width="100%"
            height="100%"
            sx={{ display: "flex", flexDirection: "column" }}
          >
            <Box>
              {/* TOP BRAND AREA */}
              <Box
                sx={{
                  height: 64,
                  px: 2,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <FlexBetween>
                  <UnifiedBrand
                    variant="sidebar"
                    onClick={() => navigate("/dashboard")}
                  />

                  {!isNonMobile && (
                    <IconButton
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                      <ChevronLeft />
                    </IconButton>
                  )}
                </FlexBetween>
              </Box>

              <Divider />
            </Box>

            {/* NAV ITEMS */}
            <List sx={{ flex: 1, overflowY: "auto" }}>
              {navItems.map(({ text, icon, path }) => {
                const key = path.split("/")[1] || "dashboard";
                const isActive = active === key || pathname === path;

                return (
                  <ListItem key={text} disablePadding>
                    <ListItemButton
                      onClick={() => {
                        navigate(path);
                        setActive(key);
                      }}
                      sx={{
                        py: 1.15,
                        backgroundColor: isActive
                          ? theme.palette.primary.main + "14"
                          : "transparent",
                        color: isActive
                          ? theme.palette.primary.main
                          : theme.palette.text.primary,
                        "&:hover": {
                          backgroundColor: theme.palette.primary.main + "10",
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          ml: "1.25rem",
                          minWidth: "40px",
                          color: isActive
                            ? theme.palette.primary.main
                            : theme.palette.text.secondary,
                        }}
                      >
                        {icon}
                      </ListItemIcon>

                      <ListItemText
                        primary={text}
                        primaryTypographyProps={{
                          fontWeight: isActive ? 800 : 600,
                          fontSize: "0.95rem",
                        }}
                      />

                      {isActive && (
                        <ChevronRightOutlined
                          sx={{ ml: "auto", color: theme.palette.primary.main }}
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>

            {/* BOTTOM USER INFO */}
            <Box sx={{ mt: "auto", pb: 1.25 }}>
              <Divider />
              <Box
                px={2}
                pt={1.25}
                display="flex"
                alignItems="center"
                gap={1.25}
              >
                <Avatar
                  src={toAbsoluteMediaUrl(user?.avatarUrl || "") || undefined}
                  alt={user?.name || "User"}
                  sx={{ width: 38, height: 38, fontSize: "0.95rem" }}
                >
                  {(user?.name || "U").charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography
                    fontWeight={800}
                    sx={{ color: theme.palette.text.primary }}
                  >
                    {user?.name || ""}
                  </Typography>
                  <Typography
                    fontSize="0.85rem"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    {user?.role || ""}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Drawer>
      )}
    </Box>
  );
};

export default Sidebar;
