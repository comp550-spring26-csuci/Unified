import { ArrowDropDown } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  useMyCommunitiesQuery,
  useVolunteerOpportunitiesQuery,
} from "@state/api";
import CommunityEventsList from "./CommunityEventsList";
import { filterEventsUpcoming, normalizeId } from "./communityEventShared";

function applyParticipationFilters(events, userId, flags) {
  const { volunteerOnly, created, attending, volunteering } = flags;
  const any =
    volunteerOnly || created || attending || volunteering;
  if (!any) return events;

  return events.filter((ev) => {
    if (
      volunteerOnly &&
      String(ev.volunteerRequirements || "").trim().length > 0
    ) {
      return true;
    }
    if (created && normalizeId(ev.createdBy) === userId) return true;
    if (
      attending &&
      (ev.attendees || []).some((a) => normalizeId(a) === userId)
    ) {
      return true;
    }
    if (
      volunteering &&
      (ev.volunteers || []).some((v) => normalizeId(v) === userId)
    ) {
      return true;
    }
    return false;
  });
}

export default function MyEvents() {
  const navigate = useNavigate();
  const user = useSelector((s) => s.global.user);
  const userId = normalizeId(user);
  const myCommunitiesQ = useMyCommunitiesQuery(undefined, { skip: !userId });
  const [createMenuAnchor, setCreateMenuAnchor] = useState(null);

  const [draft, setDraft] = useState({
    from: "",
    to: "",
    communityId: "",
  });
  const [applied, setApplied] = useState({});
  const [filterVolunteerOnly, setFilterVolunteerOnly] = useState(false);
  const [filterCreated, setFilterCreated] = useState(false);
  const [filterAttending, setFilterAttending] = useState(false);
  const [filterVolunteering, setFilterVolunteering] = useState(false);

  const oppQ = useVolunteerOpportunitiesQuery(applied, { skip: !userId });

  const communitiesForCreate = useMemo(() => {
    const list = myCommunitiesQ.data?.communities || [];
    return list.filter(
      (c) => c && String(c._id || "") && String(c.status || "") === "approved",
    );
  }, [myCommunitiesQ.data?.communities]);

  const communityOptions = useMemo(
    () => myCommunitiesQ.data?.communities || [],
    [myCommunitiesQ.data?.communities],
  );

  const errMsg = oppQ.error?.data?.message || oppQ.error?.error;

  const communityIdForEvent = (ev) =>
    String(ev.community?._id || ev.community || "");

  const filteredEvents = useMemo(() => {
    const raw = oppQ.data?.events || [];
    const upcoming = filterEventsUpcoming(raw);
    return applyParticipationFilters(upcoming, userId, {
      volunteerOnly: filterVolunteerOnly,
      created: filterCreated,
      attending: filterAttending,
      volunteering: filterVolunteering,
    });
  }, [
    oppQ.data?.events,
    userId,
    filterVolunteerOnly,
    filterCreated,
    filterAttending,
    filterVolunteering,
  ]);

  const clearFilters = () => {
    setDraft({ from: "", to: "", communityId: "" });
    setApplied({});
    setFilterVolunteerOnly(false);
    setFilterCreated(false);
    setFilterAttending(false);
    setFilterVolunteering(false);
  };

  if (!userId) {
    return (
      <Box p={3}>
        <Typography color="text.secondary">Sign in to view your events.</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        gap={1.5}
        mb={1}
      >
        <Typography variant="h4" fontWeight={700}>
          My events
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "stretch", sm: "center" }}
          sx={{ alignSelf: { xs: "stretch", sm: "auto" } }}
        >
          <Button
            variant="contained"
            size="small"
            endIcon={<ArrowDropDown />}
            disabled={myCommunitiesQ.isLoading}
            onClick={(e) => setCreateMenuAnchor(e.currentTarget)}
          >
            Create Events
          </Button>
          <Menu
            anchorEl={createMenuAnchor}
            open={Boolean(createMenuAnchor)}
            onClose={() => setCreateMenuAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            {communitiesForCreate.length === 0 ? (
              <MenuItem disabled dense>
                No approved communities yet
              </MenuItem>
            ) : null}
            {communitiesForCreate.map((c) => {
              const id = String(c._id || "");
              return (
                <MenuItem
                  key={id || c.name}
                  onClick={() => {
                    setCreateMenuAnchor(null);
                    navigate(`/communities/${id}?tab=create-event`);
                  }}
                >
                  {c.name || "Community"}
                </MenuItem>
              );
            })}
            {communitiesForCreate.length === 0 ? (
              <MenuItem
                component={RouterLink}
                to="/communities"
                onClick={() => setCreateMenuAnchor(null)}
              >
                Browse communities
              </MenuItem>
            ) : null}
          </Menu>
          <Button
            component={RouterLink}
            to="/my-events/past"
            variant="outlined"
            size="small"
          >
            Past events
          </Button>
        </Stack>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={2}>
        All upcoming events in communities you belong to (soonest first). Use
        the filters below to narrow by date, community, or how you relate to an
        event.
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
              onChange={(e) =>
                setDraft((d) => ({ ...d, from: e.target.value }))
              }
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
          <FormGroup
            sx={{
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 0.5,
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={filterVolunteerOnly}
                  onChange={(e) => setFilterVolunteerOnly(e.target.checked)}
                />
              }
              label="Has volunteer opportunities"
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={filterCreated}
                  onChange={(e) => setFilterCreated(e.target.checked)}
                />
              }
              label="Events I created"
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={filterAttending}
                  onChange={(e) => setFilterAttending(e.target.checked)}
                />
              }
              label={"Events I'm attending"}
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={filterVolunteering}
                  onChange={(e) => setFilterVolunteering(e.target.checked)}
                />
              }
              label={"Events I'm volunteering for"}
            />
          </FormGroup>
          <Typography variant="caption" color="text.secondary" display="block">
            When any of the boxes above are checked, the list shows events that
            match <strong>any</strong> of them. Leave them all unchecked to see
            every upcoming event.
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant="contained"
              size="small"
              onClick={() =>
                setApplied({
                  ...(draft.from.trim() ? { from: draft.from.trim() } : {}),
                  ...(draft.to.trim() ? { to: draft.to.trim() } : {}),
                  ...(draft.communityId.trim()
                    ? { communityId: draft.communityId.trim() }
                    : {}),
                })
              }
            >
              Apply date &amp; community
            </Button>
            <Button variant="outlined" size="small" onClick={clearFilters}>
              Clear all filters
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
        <>
          <Typography variant="body2" color="text.secondary" mb={1.5}>
            Showing {filteredEvents.length} upcoming event
            {filteredEvents.length === 1 ? "" : "s"}
          </Typography>
          <CommunityEventsList
            communityIdForEvent={communityIdForEvent}
            showCommunityLink
            showEventEdit
            isCommunityOwner={false}
            userId={userId}
            events={filteredEvents}
            emptyMessage="No upcoming events match your filters. Try clearing filters or widening the date range."
          />
        </>
      )}
    </Box>
  );
}
