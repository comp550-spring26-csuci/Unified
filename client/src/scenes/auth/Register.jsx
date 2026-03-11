import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { useState } from "react";
import { api, useRegisterMutation } from "@state/api";
import { useDispatch } from "react-redux";
import { setAuth } from "@state";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "../../utils/apiError";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [register, { isLoading }] = useRegisterMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      dispatch(api.util.resetApiState());
      const res = await register({ name, email, password }).unwrap();
      dispatch(setAuth({ token: res.token, user: res.user }));
      toast.success("Account created successfully");
      navigate("/dashboard");
    } catch (err) {
      const message = getApiErrorMessage(err, "Registration failed");
      setError(message);
      toast.error(message);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
      {/* Top Bar: Logo + Unified + Sign In */}
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
          {/* BRAND (Logo + Text) */}
          <Box
            onClick={() => navigate("/login")}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.1,
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": { opacity: 0.85 },
            }}
          >
            <Box
              component="img"
              src="/logo.png"
              alt="Unified Logo"
              sx={{
                width: 34,
                height: 34,
                objectFit: "contain",
              }}
            />
            <Typography fontWeight={900} sx={{ letterSpacing: "-0.01em" }}>
              Unified
            </Typography>
          </Box>

          <Button variant="outlined" onClick={() => navigate("/login")}>
            Sign in
          </Button>
        </Box>
      </Box>

      {/* Register Card */}
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
            maxWidth: 460,
            borderRadius: 4,
          }}
        >
          <Typography variant="h4" mb={0.5} textAlign="center">
            Create account
          </Typography>

          <Typography
            variant="body2"
            mb={3}
            color="text.secondary"
            textAlign="center"
          >
            Sign up to get started.
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
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              required
              autoComplete="name"
            />

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
              autoComplete="new-password"
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Account"}
            </Button>

            <Typography variant="body2" textAlign="center">
              Already have an account?{" "}
              <Link
                to="/login"
                style={{ textDecoration: "none", fontWeight: 800 }}
              >
                Sign in
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
