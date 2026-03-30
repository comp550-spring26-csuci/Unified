import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Alert,
  Link as MuiLink,
} from "@mui/material";
import { useState } from "react";
import {
  useForgotPasswordMutation,
  useResetPasswordWithOtpMutation,
} from "@state/api";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "../../utils/apiError";
import UnifiedBrand from "../../components/UnifiedBrand";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const [forgotPassword, { isLoading: sending }] = useForgotPasswordMutation();
  const [resetPassword, { isLoading: resetting }] =
    useResetPasswordWithOtpMutation();

  const sendCode = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await forgotPassword({ email }).unwrap();
      toast.success("Check your email for the code.");
      setStep(2);
    } catch (err) {
      const message = getApiErrorMessage(err, "Could not send code");
      setError(message);
      toast.error(message);
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    const digits = otp.replace(/\D/g, "").slice(0, 6);
    if (digits.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    try {
      await resetPassword({
        email,
        otp: digits,
        password,
      }).unwrap();
      toast.success("Password updated. Sign in with your new password.");
      navigate("/login");
    } catch (err) {
      const message = getApiErrorMessage(err, "Reset failed");
      setError(message);
      toast.error(message);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
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

          <Button variant="outlined" onClick={() => navigate("/login")}>
            Sign in
          </Button>
        </Box>
      </Box>

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
            {step === 1 ? "Reset password" : "Enter code"}
          </Typography>
          <Typography
            variant="body2"
            mb={3}
            color="text.secondary"
            textAlign="center"
          >
            {step === 1
              ? "We will email you a 6-digit code to verify your account."
              : `We sent a code to ${email}. Enter it below and choose a new password.`}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {step === 1 ? (
            <Box
              component="form"
              onSubmit={sendCode}
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
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={sending}
              >
                {sending ? "Sending…" : "Send code"}
              </Button>
            </Box>
          ) : (
            <Box
              component="form"
              onSubmit={submitReset}
              display="flex"
              flexDirection="column"
              gap={2}
            >
              <TextField
                label="6-digit code"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                inputProps={{ inputMode: "numeric", maxLength: 6 }}
                fullWidth
                required
                autoComplete="one-time-code"
              />
              <TextField
                label="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                fullWidth
                required
                autoComplete="new-password"
              />
              <TextField
                label="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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
                disabled={resetting}
              >
                {resetting ? "Updating…" : "Set new password"}
              </Button>
              <MuiLink
                component="button"
                type="button"
                variant="body2"
                onClick={() => {
                  setStep(1);
                  setOtp("");
                  setPassword("");
                  setConfirm("");
                  setError("");
                }}
                sx={{ textAlign: "center", cursor: "pointer", border: 0, background: "none" }}
              >
                Use a different email
              </MuiLink>
            </Box>
          )}

          <Typography variant="body2" textAlign="center" mt={2}>
            <Link
              to="/login"
              style={{ textDecoration: "none", fontWeight: 800 }}
            >
              Back to sign in
            </Link>
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
