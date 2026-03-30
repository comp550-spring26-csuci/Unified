import { useState } from "react";
import { Menu as MenuIcon, ArrowDropDownOutlined } from "@mui/icons-material";

import FlexBetween from "@components/FlexBetween";
import { useDispatch } from "react-redux";
import { clearAuth } from "@state";
import { api } from "@state/api";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_APP_BASE_URL || "http://localhost:5001";

function toAbsoluteMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;
}

const Navbar = ({ user, isSidebarOpen, setIsSidebarOpen }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isNonMobile = useMediaQuery("(min-width:900px)");
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const isOpen = Boolean(anchorEl);
  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const logout = () => {
    dispatch(api.util.resetApiState());
    dispatch(clearAuth());
    handleClose();
    navigate("/login");
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: "background.paper",
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", gap: 2 }}>
        {/* LEFT */}
        <FlexBetween gap={1.5}>
          <IconButton
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <MenuIcon />
          </IconButton>

        </FlexBetween>

        {/* CENTER LINKS */}
        {isNonMobile ? (
          <FlexBetween gap={1}>
            <Button color="inherit" onClick={() => navigate("/dashboard")}>
              Home
            </Button>
            <Button color="inherit" onClick={() => navigate("/communities")}>
              All Communities
            </Button>
            <Button color="inherit" onClick={() => navigate("/my-communities")}>
              My Communities
            </Button>
            <Button
              color="inherit"
              onClick={() => navigate("/membership-requests")}
            >
              My Requests
            </Button>
            <Button color="inherit" onClick={() => navigate("/profile")}>
              Profile
            </Button>
          </FlexBetween>
        ) : (
          <Box />
        )}

        {/* RIGHT USER MENU */}
        <FlexBetween gap={1}>
          <Button
            onClick={handleClick}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              textTransform: "none",
              gap: 1,
              borderRadius: 999,
              px: 1.25,
              py: 0.75,
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Avatar
              src={toAbsoluteMediaUrl(user?.avatarUrl || "") || undefined}
              alt={user?.name || "User"}
              sx={{ width: 34, height: 34, fontSize: "0.9rem" }}
            >
              {(user?.name || "U").charAt(0).toUpperCase()}
            </Avatar>
            <Box textAlign="left" sx={{ lineHeight: 1.1 }}>
              <Typography
                fontWeight={800}
                fontSize="0.9rem"
                sx={{ color: "text.primary" }}
              >
                {user?.name || ""}
              </Typography>
              <Typography fontSize="0.75rem" sx={{ color: "text.secondary" }}>
                {user?.role || ""}
              </Typography>
            </Box>
            <ArrowDropDownOutlined
              sx={{ color: "text.secondary", fontSize: 22 }}
            />
          </Button>

          <Menu
            anchorEl={anchorEl}
            open={isOpen}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem
              onClick={() => {
                handleClose();
                navigate("/dashboard");
              }}
            >
              Dashboard
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleClose();
                navigate("/profile");
              }}
            >
              Profile
            </MenuItem>
            <MenuItem onClick={logout}>Log out</MenuItem>
          </Menu>
        </FlexBetween>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
