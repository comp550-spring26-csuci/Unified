import {
  Alert,
  Avatar,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMeQuery, useUpdateProfileMutation } from "@state/api";
import { setAuth, setUser } from "@state";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "../../utils/apiError";
import { toAbsoluteMediaUrl } from "../../utils/media";
import {
  COMMUNITY_TAG_OPTIONS,
  getCommunityTagLabel,
} from "../../constants/communityTags";

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
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [businessName, setBusinessName] = useState("");
  const [businessLocation, setBusinessLocation] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [businessServices, setBusinessServices] = useState("");
  const isBusinessOwner = me?.role === "business_owner";
  const [upgradeToBusinessOwner, setUpgradeToBusinessOwner] = useState(false);

  useEffect(() => {
    if (!me) return;
    setName(me.name || "");
    setCountry(me.country || "");
    setCity(me.city || "");
    setMailingAddress(me.mailingAddress || "");
    setSelectedInterests(Array.isArray(me.interests) ? me.interests : []);
    setBusinessName(me.businessProfile?.businessName || "");
    setBusinessLocation(me.businessProfile?.businessLocation || "");
    setBusinessCategory(me.businessProfile?.businessCategory || "");
    setBusinessDescription(me.businessProfile?.description || "");
    setBusinessServices(me.businessProfile?.services || "");
    setUpgradeToBusinessOwner(me?.role === "business_owner");
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

  const selectedInterestOptions = useMemo(
    () => COMMUNITY_TAG_OPTIONS.filter((option) => selectedInterests.includes(option.value)),
    [selectedInterests]
  );

  const onSave = async () => {
    try {
      const res = await updateProfile({
        name,
        country,
        city,
        mailingAddress,
        interests: selectedInterests,
        avatarFile,
        upgradeToBusinessOwner,
        businessName,
        businessLocation,
        businessCategory,
        businessDescription,
        businessServices,
      }).unwrap();
      if (res.token) {
        dispatch(setAuth({ token: res.token, user: res.user }));
      } else {
        dispatch(setUser(res.user));
      }
      setAvatarFile(null);
      toast.success(
        res.token ? "Account upgraded to Business Owner" : "Profile updated",
      );
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
            {isBusinessOwner ? null : (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={upgradeToBusinessOwner}
                    onChange={(e) =>
                      setUpgradeToBusinessOwner(e.target.checked)
                    }
                  />
                }
                label="Upgrade this account to Business Owner"
              />
            )}
            {isBusinessOwner || upgradeToBusinessOwner ? (
              <Paper
                variant="outlined"
                sx={{ p: 2, borderRadius: 2, bgcolor: "background.default" }}
              >
                <Stack spacing={2}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {isBusinessOwner
                      ? "Business profile"
                      : "Business owner upgrade"}
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      fullWidth
                      label="Business Name"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                    <TextField
                      fullWidth
                      label="Business Location"
                      value={businessLocation}
                      onChange={(e) => setBusinessLocation(e.target.value)}
                    />
                  </Stack>
                  <TextField
                    fullWidth
                    label="Business Type / Category"
                    value={businessCategory}
                    onChange={(e) => setBusinessCategory(e.target.value)}
                  />
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="Business Description"
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                  />
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label="Services"
                    value={businessServices}
                    onChange={(e) => setBusinessServices(e.target.value)}
                  />
                </Stack>
              </Paper>
            ) : null}
            <Autocomplete
              multiple
              options={COMMUNITY_TAG_OPTIONS}
              value={selectedInterestOptions}
              onChange={(_event, values) =>
                setSelectedInterests(values.map((option) => option.value))
              }
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => option.value === value.value}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.value}
                    label={option.label}
                    size="small"
                  />
                ))
              }
              renderOption={(props, option) => (
                <Box component="li" {...props} display="flex" justifyContent="space-between" gap={1}>
                  <Typography variant="body2">{option.label}</Typography>
                  {option.restricted ? <Chip label="Eligibility" size="small" /> : null}
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Interests"
                  helperText="Select your interests and any eligibility tags that describe you."
                />
              )}
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
                disabled={
                  isSaving ||
                  !name.trim() ||
                  ((isBusinessOwner || upgradeToBusinessOwner) &&
                    (!businessName.trim() ||
                      !businessLocation.trim() ||
                      !businessCategory.trim()))
                }
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Selected interests: {selectedInterests.length ? selectedInterests.map(getCommunityTagLabel).join(", ") : "None"}
            </Typography>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
