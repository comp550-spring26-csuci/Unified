import { Search } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useMyCommunitiesQuery, useVolunteerOpportunitiesQuery } from "@state/api";
import CommunityEventsList from "./CommunityEventsList";
import { normalizeId } from "./communityEventShared";

export default function VolunteerOpportunities() {
  const user = useSelector((s) => s.global.user);
  const userId = normalizeId(user);

  const [draft, setDraft] = useState({
    q: "",
    from: "",
    to: "",
    communityId: "",
  });
  const [applied, setApplied] = useState({});

  const communitiesQ = useMyCommunitiesQuery(undefined, {
    skip: !userId || user?.role === "super_admin",
  });
  const oppQ = useVolunteerOpportunitiesQuery(applied, { skip: !userId });

  const communityOptions = useMemo(
    () => communitiesQ.data?.communities || [],
    [communitiesQ.data?.communities],
  );

  const errMsg = oppQ.error?.data?.message || oppQ.error?.error;

  const communityIdForEvent = (ev) =>
    String(ev.community?._id || ev.community || "");

  if (!userId) {
    return (
      <Box p={3}>
        <Typography color="text.secondary">Sign in to browse volunteer opportunities.</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Volunteer opportunities
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Upcoming events in communities you belong to. Search by keywords (title,
        description, or volunteer requirements), narrow by date, or pick one
        community.
      </Typography>

      <Box
        mb={3}
        p={2}
        borderRadius={2}
        border="1px solid"
        borderColor="divider"
        bgcolor="background.alt"
      >
        <Stack spacing={2}>
          <TextField
            fullWidth
            size="small"
            label="Search"
            value={draft.q}
            onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
            placeholder="Title, description, or volunteer requirements..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            select
            size="small"
            label="Community"
            value={draft.communityId}
            onChange={(e) =>
              setDraft((d) => ({ ...d, communityId: e.target.value }))
            }
          >
            <MenuItem value="">
              <em>All my communities</em>
            </MenuItem>
            {communityOptions.map((c) => (
              <MenuItem key={c._id} value={String(c._id)}>
                {c.name || "Community"}
              </MenuItem>
            ))}
          </TextField>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              fullWidth
              size="small"
              type="datetime-local"
              label="From (event start)"
              value={draft.from}
              onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 60 }}
            />
            <TextField
              fullWidth
              size="small"
              type="datetime-local"
              label="To (event start)"
              value={draft.to}
              onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 60 }}
            />
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant="contained"
              onClick={() =>
                setApplied({
                  ...(draft.q.trim() ? { q: draft.q.trim() } : {}),
                  ...(draft.from.trim() ? { from: draft.from.trim() } : {}),
                  ...(draft.to.trim() ? { to: draft.to.trim() } : {}),
                  ...(draft.communityId.trim()
                    ? { communityId: draft.communityId.trim() }
                    : {}),
                })
              }
            >
              Search
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setDraft({ q: "", from: "", to: "", communityId: "" });
                setApplied({});
              }}
            >
              Clear
            </Button>
          </Stack>
        </Stack>
      </Box>

      {errMsg ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {errMsg}
        </Alert>
      ) : null}

      {oppQ.isLoading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <CommunityEventsList
          communityIdForEvent={communityIdForEvent}
          showCommunityLink
          showEventEdit={false}
          isCommunityOwner={false}
          userId={userId}
          events={oppQ.data?.events || []}
          emptyMessage="No upcoming events match your search. Try different keywords or dates."
        />
      )}
    </Box>
  );
}
