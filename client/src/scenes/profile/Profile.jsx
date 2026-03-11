import {
  Alert,
  Avatar,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMeQuery, useUpdateProfileMutation } from "@state/api";
import { setUser } from "@state";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "../../utils/apiError";

const API_BASE = import.meta.env.VITE_APP_BASE_URL || "http://localhost:5001";

function toAbsoluteMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;
}

export default function Profile() {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.global.token);
  const {
    data: me,
    isLoading,
    error,
  } = useMeQuery(token, { skip: !token, refetchOnMountOrArgChange: true });
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [mailingAddress, setMailingAddress] = useState("");
  const [interestsInput, setInterestsInput] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    if (!me) return;
    setName(me.name || "");
    setCountry(me.country || "");
    setCity(me.city || "");
    setMailingAddress(me.mailingAddress || "");
    setInterestsInput((me.interests || []).join(", "));
    setAvatarFile(null);
  }, [me]);

  const avatarPreviewUrl = useMemo(() => {
    if (avatarFile) return URL.createObjectURL(avatarFile);
    return toAbsoluteMediaUrl(me?.avatarUrl || "");
  }, [avatarFile, me?.avatarUrl]);

  useEffect(() => {
    return () => {
      if (avatarFile && avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarFile, avatarPreviewUrl]);

  const onSave = async () => {
    try {
      const res = await updateProfile({
        name,
        country,
        city,
        mailingAddress,
        interests: interestsInput,
        avatarFile,
      }).unwrap();
      dispatch(setUser(res.user));
      setAvatarFile(null);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update profile"));
    }
  };

  if (isLoading) {
    return (
      <Box p={3}>
        <Typography>Loading profile...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        My Profile
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        View and update your profile details, including profile picture.
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error?.data?.message || "Failed to load profile"}
        </Alert>
      ) : null}

      <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          <Stack
            spacing={1.5}
            alignItems={{ xs: "flex-start", md: "center" }}
            minWidth={{ md: 220 }}
          >
            <Avatar
              src={avatarPreviewUrl || undefined}
              alt={name || "User"}
              sx={{ width: 110, height: 110 }}
            />
            <Button variant="outlined" component="label">
              {avatarFile ? "Change Picture" : "Upload Picture"}
              <input
                hidden
                accept="image/*"
                type="file"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              />
            </Button>
          </Stack>

          <Stack spacing={2} flex={1}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <TextField
                fullWidth
                label="Email"
                value={me?.email || ""}
                disabled
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
              <TextField
                fullWidth
                label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </Stack>
            <TextField
              fullWidth
              label="Mailing Address"
              value={mailingAddress}
              onChange={(e) => setMailingAddress(e.target.value)}
            />
            <TextField
              fullWidth
              label="Interests (comma separated)"
              value={interestsInput}
              onChange={(e) => setInterestsInput(e.target.value)}
            />

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ sm: "center" }}
            >
              <Typography variant="body2" color="text.secondary">
                Role: {me?.role || "-"} | Status: {me?.status || "-"}
              </Typography>
              <Button
                variant="contained"
                onClick={onSave}
                disabled={isSaving || !name.trim()}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
