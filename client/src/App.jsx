import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { themeSettings } from "./theme";
import { useSelector } from "react-redux";
import { useMemo } from "react";
import { ToastContainer } from "react-toastify";

import Layout from "@scenes/layout";
import Dashboard from "@scenes/dashboard";
import Login from "@scenes/auth/Login";
import Register from "@scenes/auth/Register";
import ForgotPassword from "@scenes/auth/ForgotPassword";
import Communities from "@scenes/communities/Communities";
import CommunityDetail from "@scenes/communities/CommunityDetail";
import CommunityPastEvents from "@scenes/communities/CommunityPastEvents";
import MyCommunities from "@scenes/communities/MyCommunities";
import MembershipRequests from "@scenes/communities/MembershipRequests";
import MyEvents from "@scenes/communities/MyEvents";
import MyPastEvents from "@scenes/communities/MyPastEvents";
import VolunteerOpportunities from "@scenes/communities/VolunteerOpportunities";
import Profile from "@scenes/profile/Profile";
import CommunityApprovals from "@scenes/admin/CommunityApprovals";
import MembershipApprovals from "@scenes/admin/MembershipApprovals";

import "./App.css";

function App() {
  const mode = useSelector((state) => state.global.mode);
  const user = useSelector((state) => state.global.user);
  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  const isSuperAdmin = user?.role === "super_admin";

  return (
    <div className="app">
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route
                path="/communities"
                element={isSuperAdmin ? <Navigate to="/dashboard" replace /> : <Communities />}
              />
              <Route path="/communities/:id" element={<CommunityDetail />} />
              <Route
                path="/communities/:id/past-events"
                element={
                  isSuperAdmin ? <Navigate to="/dashboard" replace /> : <CommunityPastEvents />
                }
              />
              <Route
                path="/my-communities"
                element={isSuperAdmin ? <Navigate to="/dashboard" replace /> : <MyCommunities />}
              />
              <Route
                path="/my-events"
                element={isSuperAdmin ? <Navigate to="/dashboard" replace /> : <MyEvents />}
              />
              <Route
                path="/my-events/past"
                element={isSuperAdmin ? <Navigate to="/dashboard" replace /> : <MyPastEvents />}
              />
              <Route
                path="/volunteer-opportunities"
                element={
                  isSuperAdmin ? <Navigate to="/dashboard" replace /> : <VolunteerOpportunities />
                }
              />
              <Route
                path="/membership-requests"
                element={isSuperAdmin ? <Navigate to="/dashboard" replace /> : <MembershipRequests />}
              />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin/community-approvals" element={<CommunityApprovals />} />
              <Route
                path="/admin/membership-approvals"
                element={isSuperAdmin ? <Navigate to="/dashboard" replace /> : <MembershipApprovals />}
              />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <ToastContainer position="top-right" autoClose={2500} newestOnTop />
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
