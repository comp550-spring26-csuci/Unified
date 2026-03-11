import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import {
  useCreateCommunityMutation,
  useListCommunitiesQuery,
  useMyMembershipsQuery,
  useRequestJoinMutation,
} from "@state/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "../../utils/apiError";

const REGION_OPTIONS = [
  "United States",
  "Canada",
  "Mexico",
  "South America",
  "Europe",
  "United Kingdom",
  "Middle East",
  "Africa",
  "South Asia",
  "East Asia",
  "Southeast Asia",
  "Australia",
  "New Zealand",
];

function detectRegionFromBrowser() {
  try {
    const locale = navigator?.languages?.[0] || navigator?.language || "";
    const localeMatch = locale.match(/[-_]([A-Za-z]{2})$/);
    const countryCode = localeMatch?.[1]?.toUpperCase();
    if (countryCode && typeof Intl !== "undefined" && Intl.DisplayNames) {
      const regionName = new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode);
      if (regionName) return regionName;
    }

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz.startsWith("America/")) return "United States";
    if (tz.startsWith("Europe/")) return "Europe";
    if (tz.startsWith("Asia/")) return "Asia";
    if (tz.startsWith("Africa/")) return "Africa";
    if (tz.startsWith("Australia/") || tz.startsWith("Pacific/")) return "Australia";
  } catch {
    // no-op: fallback to manual selection
  }
  return "";
}

function TabPanel({ value, index, children }) {
  if (value !== index) return null;
  return <Box mt={2}>{children}</Box>;
}

export default function Communities() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useListCommunitiesQuery();
  const { data: membershipsData } = useMyMembershipsQuery();
  const [createCommunity] = useCreateCommunityMutation();
  const [requestJoin, { isLoading: isJoinSubmitting }] = useRequestJoinMutation();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [detectedRegion, setDetectedRegion] = useState("");
  const [keywords, setKeywords] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [createError, setCreateError] = useState("");

  const [joinPromptOpen, setJoinPromptOpen] = useState(false);
  const [joinPromptTab, setJoinPromptTab] = useState(0);
  const [joinCommunity, setJoinCommunity] = useState(null);
  const [joinReason, setJoinReason] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [contribution, setContribution] = useState("");
  const [agreeRules, setAgreeRules] = useState(false);

  useEffect(() => {
    if (!open || region) return;
    const detected = detectRegionFromBrowser();
    if (!detected) return;
    setRegion(detected);
    setDetectedRegion(detected);
  }, [open, region]);

  const rows = (data?.communities || []).map((c) => ({
    id: c._id,
    name: c.name,
    status: c.status,
    region: c.region || "",
    keywords: (c.keywords || []).join(", "),
    rules: c.rules || "",
  }));

  const membershipByCommunityId = useMemo(() => {
    const map = new Map();
    for (const membership of membershipsData?.memberships || []) {
      const cid = String(membership?.community?._id || membership?.community || "");
      if (!cid) continue;
      map.set(cid, membership.status);
    }
    return map;
  }, [membershipsData?.memberships]);

  const resetJoinPrompt = () => {
    setJoinPromptOpen(false);
    setJoinPromptTab(0);
    setJoinCommunity(null);
    setJoinReason("");
    setAboutMe("");
    setContribution("");
    setAgreeRules(false);
  };

  const openJoinPrompt = (row) => {
    setJoinCommunity({
      _id: row?.id,
      name: row?.name || "",
      rules: row?.rules || "",
    });
    setJoinPromptTab(0);
    setJoinReason("");
    setAboutMe("");
    setContribution("");
    setAgreeRules(false);
    setJoinPromptOpen(true);
  };

  const canSubmitJoinRequest =
    !!joinCommunity &&
    joinReason.trim().length >= 20 &&
    joinReason.trim().length <= 300 &&
    aboutMe.trim().length >= 20 &&
    aboutMe.trim().length <= 300 &&
    contribution.trim().length <= 200 &&
    agreeRules;

  const onSubmitJoinRequest = async () => {
    if (!joinCommunity?._id) return;
    try {
      await requestJoin({
        communityId: joinCommunity._id,
        joinReason: joinReason.trim(),
        aboutMe: aboutMe.trim(),
        contribution: contribution.trim(),
      }).unwrap();
      toast.success("Join request submitted");
      resetJoinPrompt();
      refetch();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to submit join request"));
    }
  };

  const columns = useMemo(
    () => [
      { field: "name", headerName: "Community", flex: 1 },
      { field: "region", headerName: "Region", flex: 0.6 },
      {
        field: "keywords",
        headerName: "Keywords",
        flex: 1,
      },
      {
        field: "actions",
        headerName: "Actions",
        sortable: false,
        width: 240,
        renderCell: (params) => (
          <Stack direction="row" spacing={1}>
            {membershipByCommunityId.get(params.row.id) === "approved" ? (
              <Button size="small" variant="outlined" color="success" disabled>
                Joined
              </Button>
            ) : null}
            {membershipByCommunityId.get(params.row.id) === "pending" ? (
              <Button size="small" variant="outlined" color="warning" disabled>
                Pending
              </Button>
            ) : null}
            {membershipByCommunityId.get(params.row.id) === "rejected" ? (
              <Button
                size="small"
                variant="contained"
                color="warning"
                onClick={(e) => {
                  e.stopPropagation();
                  openJoinPrompt(params.row);
                }}
              >
                Request Again
              </Button>
            ) : null}
            {!membershipByCommunityId.get(params.row.id) ? (
              <Button
                size="small"
                variant="contained"
                onClick={(e) => {
                  e.stopPropagation();
                  openJoinPrompt(params.row);
                }}
              >
                Request Join
              </Button>
            ) : null}
          </Stack>
        ),
      },
    ],
    [navigate, membershipByCommunityId, openJoinPrompt]
  );

  const onCreate = async () => {
    setCreateError("");
    try {
      const payload = {
        name,
        region,
        keywords: keywords
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        description,
        rules,
      };
      await createCommunity(payload).unwrap();
      setOpen(false);
      setName("");
      setRegion("");
      setDetectedRegion("");
      setKeywords("");
      setDescription("");
      setRules("");
      toast.success("Community created and submitted for approval");
      refetch();
    } catch (e) {
      const message = getApiErrorMessage(e, "Failed to create community");
      setCreateError(message);
      toast.error(message);
    }
  };

  return (
    <Box p={3}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={2} mb={2}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Communities</Typography>
          <Typography variant="body2" color="text.secondary">Browse approved communities and request membership.</Typography>
        </Box>
        <Button variant="contained" onClick={() => setOpen(true)}>Create Community</Button>
      </Stack>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error?.data?.message || "Failed to load"}</Alert> : null}

      <Box height="65vh">
        <DataGrid
          loading={isLoading}
          rows={rows}
          columns={columns}
          disableRowSelectionOnClick
          sx={{
            "& .MuiDataGrid-row:hover": { cursor: "pointer" },
            "& .MuiDataGrid-row:focus-within": { cursor: "pointer" },
          }}
          onCellClick={(params) => {
            if (params.field === "actions") return;
            navigate(`/communities/${params.row.id}`);
          }}
        />
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create community (will be pending until Super Admin approves)</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          {createError ? <Alert severity="error">{createError}</Alert> : null}
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Autocomplete
            freeSolo
            options={REGION_OPTIONS}
            value={region}
            onChange={(_event, value) => setRegion(value || "")}
            onInputChange={(_event, value, reason) => {
              if (reason === "input" || reason === "clear") setRegion(value);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Region"
                helperText={detectedRegion ? `Auto-detected: ${detectedRegion}` : "Select or type a region"}
              />
            )}
          />
          <TextField label="Keywords (comma separated)" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={3} />
          <TextField
            label="Community Rules"
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            multiline
            minRows={4}
            required
            helperText={`${rules.length}/5000`}
          />
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {keywords
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
              .slice(0, 8)
              .map((k) => (
                <Chip key={k} label={k} size="small" />
              ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={onCreate} disabled={!name.trim() || rules.trim().length < 10}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={joinPromptOpen} onClose={resetJoinPrompt} fullWidth maxWidth="md">
        <DialogTitle>
          Request to Join {joinCommunity?.name ? `"${joinCommunity.name}"` : "Community"}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Tabs value={joinPromptTab} onChange={(_e, v) => setJoinPromptTab(v)}>
            <Tab label="About You" />
            <Tab label="Community Rules" />
          </Tabs>

          <TabPanel value={joinPromptTab} index={0}>
            <Stack spacing={2}>
              <TextField
                label="Why do you want to join this community?"
                multiline
                minRows={3}
                value={joinReason}
                onChange={(e) => setJoinReason(e.target.value)}
                helperText={`${joinReason.length}/300 chars (min 20 chars)`}
              />
              <TextField
                label="Tell us a little about yourself / your interests."
                multiline
                minRows={3}
                value={aboutMe}
                onChange={(e) => setAboutMe(e.target.value)}
                helperText={`${aboutMe.length}/300 chars (min 20 chars)`}
              />
              <TextField
                label="How would you like to contribute? (optional)"
                multiline
                minRows={2}
                value={contribution}
                onChange={(e) => setContribution(e.target.value)}
                helperText={`${contribution.length}/200`}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={agreeRules}
                    onChange={(e) => setAgreeRules(e.target.checked)}
                  />
                }
                label="I have read and agree to the community rules."
              />
            </Stack>
          </TabPanel>

          <TabPanel value={joinPromptTab} index={1}>
            <Box
              p={2}
              borderRadius={2}
              bgcolor="background.alt"
              border="1px solid"
              borderColor="divider"
            >
              <Typography variant="subtitle1" fontWeight={700} mb={1}>
                Rules
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {joinCommunity?.rules?.trim() || "No rules provided by this community."}
              </Typography>
            </Box>
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetJoinPrompt}>Cancel</Button>
          <Button
            variant="contained"
            onClick={onSubmitJoinRequest}
            disabled={!canSubmitJoinRequest || isJoinSubmitting}
          >
            {isJoinSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
