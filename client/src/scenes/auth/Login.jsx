import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { useState } from "react";
import { api, useLoginMutation } from "@state/api";
import { useDispatch } from "react-redux";
import { setAuth } from "@state";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "../../utils/apiError";
import UnifiedBrand from "../../components/UnifiedBrand";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      dispatch(api.util.resetApiState());
      const res = await login({ email, password }).unwrap();
      dispatch(setAuth({ token: res.token, user: res.user }));
      toast.success("Signed in successfully");
      navigate("/dashboard");
    } catch (err) {
      const message = getApiErrorMessage(err, "Login failed");
      setError(message);
      toast.error(message);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
      {/* Top Bar: Logo + Unified + Create account */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          backgroundColor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            height: 64,
            px: { xs: 2, md: 4 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <UnifiedBrand onClick={() => navigate("/login")} />

          <Button variant="contained" onClick={() => navigate("/register")}>
            Create account
          </Button>
        </Box>
      </Box>

      {/* Centered Login Card */}
      <Box
        sx={{
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            width: "100%",
            maxWidth: 440,
            borderRadius: 4,
          }}
        >
          <Typography variant="h4" mb={0.5} textAlign="center">
            Welcome back
          </Typography>

          <Typography
            variant="body2"
            mb={3}
            color="text.secondary"
            textAlign="center"
          >
            Sign in to book and manage community activities.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={onSubmit}
            display="flex"
            flexDirection="column"
            gap={2}
          >
            <TextField
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              fullWidth
              required
              autoComplete="email"
            />

            <TextField
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              fullWidth
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <Typography variant="body2" textAlign="center">
              <Link
                to="/forgot-password"
                style={{ textDecoration: "none", fontWeight: 700 }}
              >
                Forgot password?
              </Link>
            </Typography>

            <Typography variant="body2" textAlign="center">
              New here?{" "}
              <Link
                to="/register"
                style={{ textDecoration: "none", fontWeight: 800 }}
              >
                Create an account
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
