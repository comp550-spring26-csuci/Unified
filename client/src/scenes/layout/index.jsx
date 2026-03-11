import { useEffect, useState } from "react";
import { Box, useMediaQuery } from "@mui/material";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import Navbar from "@components/Navbar";
import Sidebar from "@components/Sidebar";

import { useMeQuery } from "@state/api";
import { clearAuth, setUser } from "@state";

const Layout = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const dispatch = useDispatch();
  const location = useLocation();

  const token = useSelector((state) => state.global.token);
  const storedUser = useSelector((state) => state.global.user);

  const { data: me, isLoading, isError } = useMeQuery(token, {
    skip: !token,
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (me) dispatch(setUser(me));
  }, [me, dispatch]);

  useEffect(() => {
    if (isError) dispatch(clearAuth());
  }, [isError, dispatch]);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (isLoading) {
    return (
      <Box width="100%" height="100%" display="flex" alignItems="center" justifyContent="center">
        Loading...
      </Box>
    );
  }

  if (isError) {
    return <Navigate to="/login" replace />;
  }

  const user = me ?? storedUser ?? {};

  return (
    <Box display={isNonMobile ? "flex" : "block"} width="100%" height="100%">
      <Sidebar
        user={user}
        isNonMobile={isNonMobile}
        drawerWidth="270px"
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <Box flexGrow={1}>
        <Navbar user={user} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <Outlet />
      </Box>

    </Box>
  );
};

export default Layout;
