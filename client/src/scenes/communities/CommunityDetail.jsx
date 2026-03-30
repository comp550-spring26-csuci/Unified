import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { GoogleMapPicker } from "@components/GoogleMapField";
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useParams, useSearchParams } from "react-router-dom";
import { Add, DragIndicator, RoomOutlined } from "@mui/icons-material";
import {
  useCreateCommentMutation,
  useCreateEventMutation,
  useCreatePostMutation,
  useGetCommunityQuery,
  useLikePostMutation,
  useListCommentsQuery,
  useListCommunityMembersQuery,
  useListEventsQuery,
  useMyMembershipsQuery,
  useListPostsQuery,
  useUpdateCommunityMemberRoleMutation,
  useUpdateCommunityRulesMutation,
} from "@state/api";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "../../utils/apiError";
import CommunityEventsList from "./CommunityEventsList";
import {
  computeAgendaSlots,
  formatAgendaClock,
  normalizeId,
  parseDateTimeLocalInput,
  parseTimeOnDatePart,
} from "./communityEventShared";

function TabPanel({ value, index, children }) {
  if (value !== index) return null;
  return <Box mt={2}>{children}</Box>;
}

const AGENDA_DND_MIME = "application/x-agenda-index";

function newAgendaRow() {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `agenda-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: "",
    durationMinutes: 30,
    gapBeforeMinutes: 0,
  };
}

function PostCard({ post, communityId, onLike }) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [createComment] = useCreateCommentMutation();
  const commentsQ = useListCommentsQuery(
    { communityId, postId: post._id },
    { skip: !commentsOpen },
  );

  return (
    <Box p={2} borderRadius={2} bgcolor="background.alt">
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={1}
      >
        <Typography fontWeight={700}>
          {post.author?.name || "Unknown"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {new Date(post.createdAt).toLocaleString()}
        </Typography>
      </Stack>
      <Typography whiteSpace="pre-wrap">{post.text}</Typography>

      <Stack direction="row" spacing={1} mt={1} mb={1}>
        <Button
          size="small"
          variant="outlined"
          onClick={async () => {
            try {
              await onLike({ communityId, postId: post._id }).unwrap();
              toast.success("Post like updated");
            } catch (err) {
              toast.error(getApiErrorMessage(err, "Failed to update like"));
            }
          }}
        >
          Like ({post.likes?.length || 0})
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => setCommentsOpen((v) => !v)}
        >
          {commentsOpen ? "Hide Comments" : "Show Comments"}
        </Button>
      </Stack>

      {commentsOpen ? (
        <Box mt={1}>
          {commentsQ.error ? (
            <Alert severity="warning" sx={{ mb: 1 }}>
              {commentsQ.error?.data?.message || "Failed to load comments"}
            </Alert>
          ) : null}

          <Stack spacing={1} mb={1}>
            {(commentsQ.data?.comments || []).map((comment) => (
              <Box
                key={comment._id}
                p={1.2}
                borderRadius={1.5}
                bgcolor="background.paper"
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2" fontWeight={700}>
                    {comment.author?.name || "Unknown"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(comment.createdAt).toLocaleString()}
                  </Typography>
                </Stack>
                <Typography variant="body2" mt={0.4}>
                  {comment.text}
                </Typography>
              </Box>
            ))}
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              fullWidth
              size="small"
              label="Write a comment"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <Button
              variant="contained"
              onClick={async () => {
                try {
                  await createComment({
                    communityId,
                    postId: post._id,
                    text: commentText,
                  }).unwrap();
                  setCommentText("");
                  toast.success("Comment posted");
                } catch (err) {
                  toast.error(
                    getApiErrorMessage(err, "Failed to post comment"),
                  );
                }
              }}
              disabled={!commentText.trim()}
            >
              Comment
            </Button>
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
}

export default function CommunityDetail() {
  const { id: communityId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(0);
  const user = useSelector((s) => s.global.user);
  const userId = normalizeId(user);

  const communityQ = useGetCommunityQuery(communityId, { skip: !communityId });
  const membershipsQ = useMyMembershipsQuery();
  const postsQ = useListPostsQuery(communityId);
  const eventsQ = useListEventsQuery(communityId);

  const [createPost] = useCreatePostMutation();
  const [likePost] = useLikePostMutation();

  const [createEvent] = useCreateEventMutation();
  const [updateCommunityRules, { isLoading: isSavingRules }] =
    useUpdateCommunityRulesMutation();
  const [updateCommunityMemberRole, { isLoading: isUpdatingMemberRole }] =
    useUpdateCommunityMemberRoleMutation();

  const [postText, setPostText] = useState("");

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventWhoFor, setEventWhoFor] = useState("");
  const [eventWhatToBring, setEventWhatToBring] = useState("");
  const [eventVolunteerRequirements, setEventVolunteerRequirements] =
    useState("");
  const [eventCapacity, setEventCapacity] = useState("");
  const [showCreateEventErrors, setShowCreateEventErrors] = useState(false);
  const [eventImageFile, setEventImageFile] = useState(null);
  const [eventLocation, setEventLocation] = useState(null);
  const [eventLocationDialogOpen, setEventLocationDialogOpen] = useState(false);
  const [agendaFirstOffsetMinutes, setAgendaFirstOffsetMinutes] = useState(0);
  const [agendaItems, setAgendaItems] = useState(() => [newAgendaRow()]);
  const [rulesDraft, setRulesDraft] = useState("");

  const postsError = postsQ.error?.data?.message;
  const eventsError = eventsQ.error?.data?.message;
  const communityError = communityQ.error?.data?.message;
  const communityName = communityQ.data?.community?.name || "Community";
  const communityRules = communityQ.data?.community?.rules || "";
  const communityAdmins = useMemo(
    () =>
      (communityQ.data?.community?.admins || [])
        .map(normalizeId)
        .filter(Boolean),
    [communityQ.data?.community?.admins],
  );
  const communityModerators = useMemo(
    () =>
      (communityQ.data?.community?.moderators || [])
        .map(normalizeId)
        .filter(Boolean),
    [communityQ.data?.community?.moderators],
  );
  const communityCreatedBy = normalizeId(communityQ.data?.community?.createdBy);
  const canEditRules = useMemo(() => {
    if (user?.role === "super_admin") return true;
    return (
      !!userId &&
      (communityAdmins.includes(userId) || communityCreatedBy === userId)
    );
  }, [communityAdmins, communityCreatedBy, user?.role, userId]);
  const canViewMembers = useMemo(() => {
    if (user?.role === "super_admin") return true;
    if (!userId) return false;
    return (
      communityCreatedBy === userId ||
      communityAdmins.includes(userId) ||
      communityModerators.includes(userId)
    );
  }, [
    communityAdmins,
    communityCreatedBy,
    communityModerators,
    user?.role,
    userId,
  ]);
  const canAssignMemberRoles = useMemo(() => {
    if (user?.role === "super_admin") return true;
    if (!userId) return false;
    return communityCreatedBy === userId || communityAdmins.includes(userId);
  }, [communityAdmins, communityCreatedBy, user?.role, userId]);
  const isCommunityOwner = useMemo(
    () => !!userId && communityCreatedBy === userId,
    [communityCreatedBy, userId],
  );
  const membersQ = useListCommunityMembersQuery(communityId, {
    skip: !communityId || !canViewMembers,
  });
  const isApprovedMember = useMemo(() => {
    if (!communityId) return false;
    const memberships = membershipsQ.data?.memberships || [];
    return memberships.some((m) => {
      const cid = String(m?.community?._id || m?.community || "");
      return cid === String(communityId) && m?.status === "approved";
    });
  }, [communityId, membershipsQ.data?.memberships]);
  const eventPreviewUrl = useMemo(
    () => (eventImageFile ? URL.createObjectURL(eventImageFile) : ""),
    [eventImageFile],
  );

  const createEventRequiredOk = useMemo(() => {
    const titleOk = eventTitle.trim().length >= 2;
    const venueOk = eventVenue.trim().length >= 2;
    const dateOk =
      Boolean(eventDate.trim()) &&
      !Number.isNaN(new Date(eventDate).getTime());
    return titleOk && venueOk && dateOk;
  }, [eventTitle, eventVenue, eventDate]);

  const createEventEndOk = useMemo(() => {
    if (!eventEndDate.trim()) return true;
    const endMs = new Date(eventEndDate).getTime();
    if (Number.isNaN(endMs)) return false;
    const startMs = new Date(eventDate).getTime();
    if (Number.isNaN(startMs)) return true;
    return endMs >= startMs;
  }, [eventEndDate, eventDate]);

  useEffect(() => {
    if (createEventRequiredOk && createEventEndOk && showCreateEventErrors) {
      setShowCreateEventErrors(false);
    }
  }, [createEventRequiredOk, createEventEndOk, showCreateEventErrors]);

  const upcomingEvents = useMemo(() => {
    const now = Date.now();
    return (eventsQ.data?.events || [])
      .filter((ev) => new Date(ev.date).getTime() >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [eventsQ.data?.events]);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "events" || t === "3") {
      setTab(3);
      const next = new URLSearchParams(searchParams);
      next.delete("tab");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const agendaSlots = useMemo(
    () => computeAgendaSlots(eventDate, agendaFirstOffsetMinutes, agendaItems),
    [eventDate, agendaFirstOffsetMinutes, agendaItems],
  );

  const updateAgendaStartFromPicker = (index, timeHHmm) => {
    if (!eventDate?.trim() || !timeHHmm) return;
    const eventStart = parseDateTimeLocalInput(eventDate);
    if (!eventStart) return;
    const datePart = eventDate.split("T")[0];
    const picked = parseTimeOnDatePart(datePart, timeHHmm);
    if (!picked) return;

    if (index === 0) {
      const delta = Math.round((picked.getTime() - eventStart.getTime()) / 60000);
      setAgendaFirstOffsetMinutes(delta);
      return;
    }

    const slots = computeAgendaSlots(
      eventDate,
      agendaFirstOffsetMinutes,
      agendaItems,
    );
    const prevEnd = slots[index - 1]?.end;
    if (!prevEnd || Number.isNaN(prevEnd.getTime())) return;
    const gap = Math.round((picked.getTime() - prevEnd.getTime()) / 60000);
    setAgendaItems((prev) =>
      prev.map((it, j) =>
        j === index ? { ...it, gapBeforeMinutes: Math.max(0, gap) } : it,
      ),
    );
  };

  const reorderAgendaRows = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    setAgendaItems((prev) => {
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next.map((it) => ({ ...it, gapBeforeMinutes: 0 }));
    });
    setAgendaFirstOffsetMinutes(0);
  };

  useEffect(() => {
    return () => {
      if (eventPreviewUrl) URL.revokeObjectURL(eventPreviewUrl);
    };
  }, [eventPreviewUrl]);

  useEffect(() => {
    setRulesDraft(communityRules || "");
  }, [communityRules, communityId]);

  const memberRows = useMemo(
    () =>
      (membersQ.data?.members || [])
        .map((m) => {
          const memberId = normalizeId(m?.user);
          return {
            id: memberId,
            name: m?.user?.name || "Unknown",
            email: m?.user?.email || "-",
            joinedAt: m?.joinedAt
              ? new Date(m.joinedAt).toLocaleDateString()
              : "-",
            communityRole: m?.communityRole || "member",
          };
        })
        .filter((row) => row.id),
    [membersQ.data?.members],
  );

  const memberColumns = useMemo(
    () => [
      { field: "name", headerName: "Name", flex: 0.9, minWidth: 180 },
      { field: "email", headerName: "Email", flex: 1, minWidth: 220 },
      { field: "joinedAt", headerName: "Joined", flex: 0.5, minWidth: 120 },
      {
        field: "communityRole",
        headerName: "Role",
        flex: 0.5,
        minWidth: 130,
        renderCell: (params) => {
          const value = String(params.value || "member");
          const color =
            value === "owner"
              ? "success"
              : value === "admin"
                ? "primary"
                : value === "moderator"
                  ? "warning"
                  : "default";
          return (
            <Chip
              size="small"
              label={value.charAt(0).toUpperCase() + value.slice(1)}
              color={color}
              variant={value === "member" ? "outlined" : "filled"}
            />
          );
        },
      },
      {
        field: "assignRole",
        headerName: "Assign Role",
        flex: 0.9,
        minWidth: 210,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const currentRole = String(params.row.communityRole || "member");
          if (!canAssignMemberRoles) {
            return (
              <Typography variant="caption" color="text.secondary">
                Read only
              </Typography>
            );
          }
          if (currentRole === "owner") {
            return (
              <Typography variant="caption" color="text.secondary">
                Owner role cannot be changed
              </Typography>
            );
          }
          return (
            <TextField
              select
              size="small"
              value={currentRole}
              sx={{ minWidth: 170 }}
              disabled={isUpdatingMemberRole}
              onChange={async (e) => {
                const nextRole = String(e.target.value || "member");
                if (nextRole === currentRole) return;
                try {
                  await updateCommunityMemberRole({
                    communityId,
                    memberId: params.row.id,
                    role: nextRole,
                  }).unwrap();
                  toast.success(`Role updated for ${params.row.name}`);
                } catch (err) {
                  toast.error(
                    getApiErrorMessage(err, "Failed to update member role"),
                  );
                }
              }}
            >
              <MenuItem value="member">Member</MenuItem>
              <MenuItem value="moderator">Moderator</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
          );
        },
      },
    ],
    [
      canAssignMemberRoles,
      communityId,
      isUpdatingMemberRole,
      updateCommunityMemberRole,
    ],
  );

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={700}>
        {communityName}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Community space
      </Typography>

      <Box mt={2}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          <Tab label="Posts" />
          <Tab label="Rules" />
          <Tab label="Members" />
          <Tab label="Events" />
          <Tab label="Create Event" />
        </Tabs>
        <Divider />

        <TabPanel value={tab} index={0}>
          {postsError ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {postsError}
            </Alert>
          ) : null}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mb={2}>
            <TextField
              fullWidth
              label="Write a post"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
            />
            <Button
              variant="contained"
              onClick={async () => {
                try {
                  await createPost({ communityId, text: postText }).unwrap();
                  setPostText("");
                  toast.success("Post created");
                } catch (err) {
                  toast.error(getApiErrorMessage(err, "Failed to create post"));
                }
              }}
              disabled={!postText.trim()}
            >
              Post
            </Button>
          </Stack>

          <Stack spacing={2}>
            {(postsQ.data?.posts || []).map((p) => (
              <PostCard
                key={p._id}
                post={p}
                communityId={communityId}
                onLike={likePost}
              />
            ))}
          </Stack>
        </TabPanel>

        <TabPanel value={tab} index={1}>
          {communityError ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {communityError}
            </Alert>
          ) : null}
          <Box
            p={2}
            borderRadius={2}
            bgcolor="background.alt"
            border="1px solid"
            borderColor="divider"
          >
            <Typography variant="h6" fontWeight={700} mb={1}>
              Community Rules
            </Typography>
            {canEditRules ? (
              <Stack spacing={1.5}>
                <TextField
                  fullWidth
                  multiline
                  minRows={6}
                  label="Edit rules"
                  value={rulesDraft}
                  onChange={(e) => setRulesDraft(e.target.value)}
                  helperText={`${rulesDraft.length}/5000 (min 10 chars)`}
                />
                <Stack direction="row" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    onClick={async () => {
                      try {
                        await updateCommunityRules({
                          communityId,
                          rules: rulesDraft,
                        }).unwrap();
                        toast.success("Community rules updated");
                      } catch (err) {
                        toast.error(
                          getApiErrorMessage(err, "Failed to update rules"),
                        );
                      }
                    }}
                    disabled={isSavingRules || rulesDraft.trim().length < 10}
                  >
                    {isSavingRules ? "Saving..." : "Save Rules"}
                  </Button>
                </Stack>
              </Stack>
            ) : (
              <Stack spacing={1}>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {communityRules.trim() ||
                    "No rules have been added for this community yet."}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Only this community admin (or super admin) can edit these
                  rules.
                </Typography>
              </Stack>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tab} index={2}>
          {!canViewMembers ? (
            <Alert severity="info">
              Only community owner/admin/moderator (or super admin) can view
              members.
            </Alert>
          ) : (
            <Box>
              {membersQ.error ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {membersQ.error?.data?.message || "Failed to load members"}
                </Alert>
              ) : null}
              <Typography variant="h6" fontWeight={700} mb={1}>
                Community Members
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                View approved members and manage their community roles.
              </Typography>
              <Box height={500}>
                <DataGrid
                  rows={memberRows}
                  columns={memberColumns}
                  loading={membersQ.isLoading}
                  disableRowSelectionOnClick
                  sx={{
                    "& .MuiDataGrid-row:hover": { cursor: "pointer" },
                    "& .MuiDataGrid-row:focus-within": { cursor: "pointer" },
                  }}
                />
              </Box>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tab} index={3}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ sm: "center" }}
            spacing={1.5}
            mb={2}
          >
            <Typography variant="body2" color="text.secondary">
              Upcoming and in-progress events (soonest first).
            </Typography>
            <Button
              component={RouterLink}
              to={`/communities/${communityId}/past-events`}
              variant="outlined"
              size="small"
            >
              Past Events
            </Button>
          </Stack>
          <CommunityEventsList
            communityId={communityId}
            events={upcomingEvents}
            eventsError={eventsError}
            isCommunityOwner={isCommunityOwner}
            userId={userId}
            emptyMessage="No upcoming events yet."
          />
        </TabPanel>

        <TabPanel value={tab} index={4}>
          <Box
            p={{ xs: 2, sm: 3 }}
            borderRadius={3}
            bgcolor="background.alt"
            border="1px solid"
            borderColor="divider"
            width="100%"
          >
            <Typography variant="h6" fontWeight={800} mb={0.5}>
              Create Event
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              <strong>Title</strong>, <strong>Venue</strong>, and{" "}
              <strong>Date &amp; time</strong> are required. Add optional
              details and an image if you like.
            </Typography>
            {!membershipsQ.isLoading && !isApprovedMember ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Membership required. Only approved community members can create
                events.
              </Alert>
            ) : null}

            <TextField
              fullWidth
              required
              label="Title"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="Community Cleanup Drive"
              error={
                showCreateEventErrors &&
                (!eventTitle.trim() || eventTitle.trim().length < 2)
              }
              helperText={
                showCreateEventErrors &&
                (!eventTitle.trim() || eventTitle.trim().length < 2)
                  ? !eventTitle.trim()
                    ? "Title is required."
                    : "Use at least 2 characters."
                  : undefined
              }
              sx={{ mb: 2 }}
            />

            <Box mb={2}>
              <TextField
                fullWidth
                required
                label="Venue"
                value={eventVenue}
                onChange={(e) => setEventVenue(e.target.value)}
                placeholder="Main Community Hall"
                error={
                  showCreateEventErrors && eventVenue.trim().length < 2
                }
                helperText={
                  showCreateEventErrors && eventVenue.trim().length < 2
                    ? "Venue is required (at least 2 characters)."
                    : eventLocation
                      ? `Map pin selected: ${eventLocation.lat.toFixed(6)}, ${eventLocation.lng.toFixed(6)}`
                      : "Use the pin button to add an optional Google Maps location."
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        color={eventLocation ? "primary" : "default"}
                        onClick={() => setEventLocationDialogOpen(true)}
                        aria-label="Select venue on map"
                      >
                        <RoomOutlined />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {eventLocation ? (
                <Stack
                  direction="row"
                  spacing={1}
                  justifyContent="flex-end"
                  alignItems="center"
                  mt={0.5}
                >
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => setEventLocationDialogOpen(true)}
                  >
                    Edit Pin
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    color="inherit"
                    onClick={() => setEventLocation(null)}
                  >
                    Clear Pin
                  </Button>
                </Stack>
              ) : null}
            </Box>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
              <TextField
                fullWidth
                required
                type="datetime-local"
                label="Date & Time"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 60 }}
                error={
                  showCreateEventErrors &&
                  (!eventDate.trim() ||
                    Number.isNaN(new Date(eventDate).getTime()))
                }
                helperText={
                  showCreateEventErrors &&
                  (!eventDate.trim() ||
                    Number.isNaN(new Date(eventDate).getTime()))
                    ? "A valid date and time is required."
                    : undefined
                }
              />
              <TextField
                fullWidth
                type="datetime-local"
                label="End date & time"
                value={eventEndDate}
                onChange={(e) => setEventEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 60 }}
                error={showCreateEventErrors && !createEventEndOk}
                helperText={
                  showCreateEventErrors && !createEventEndOk
                    ? eventEndDate.trim() &&
                        Number.isNaN(new Date(eventEndDate).getTime())
                      ? "Enter a valid end date and time."
                      : "End must be on or after the start."
                    : "Optional — when the event is expected to finish."
                }
              />
              <TextField
                fullWidth
                type="number"
                label="Capacity (0 = unlimited)"
                value={eventCapacity}
                onChange={(e) => setEventCapacity(e.target.value)}
              />
            </Stack>

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Description"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="General overview, links, or other notes."
              sx={{ mb: 2 }}
            />

            <Box
              mb={2}
              p={2}
              borderRadius={2}
              border="1px solid"
              borderColor="divider"
              bgcolor="background.default"
            >
              <Typography variant="subtitle1" fontWeight={700} mb={1}>
                Agenda
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                Start and end times follow this event’s <strong>Date &amp; time</strong>{" "}
                (under Venue). End is computed from start + duration. Drag rows to
                reorder; times reflow from the event start.
              </Typography>
              {!eventDate.trim() ? (
                <Alert severity="info" sx={{ mb: 1.5 }}>
                  Enter <strong>Date &amp; time</strong> (under Venue) to enable
                  agenda start times and calculate end times.
                </Alert>
              ) : null}
              <Stack spacing={1.5}>
                {agendaItems.map((row, index) => {
                  const slot = agendaSlots[index] || {
                    start: null,
                    end: null,
                  };
                  const startInputValue =
                    slot.start && !Number.isNaN(slot.start.getTime())
                      ? `${String(slot.start.getHours()).padStart(2, "0")}:${String(slot.start.getMinutes()).padStart(2, "0")}`
                      : "";

                  return (
                    <Stack
                      key={row.id}
                      direction={{ xs: "column", md: "row" }}
                      spacing={1}
                      alignItems={{ md: "center" }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const from = Number(
                          e.dataTransfer.getData(AGENDA_DND_MIME) ||
                            e.dataTransfer.getData("text/plain"),
                        );
                        if (Number.isNaN(from)) return;
                        reorderAgendaRows(from, index);
                      }}
                      sx={{
                        flexWrap: "wrap",
                        py: 0.5,
                        borderRadius: 1,
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <Box
                        component="span"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData(
                            AGENDA_DND_MIME,
                            String(index),
                          );
                          e.dataTransfer.setData("text/plain", String(index));
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        sx={{
                          cursor: "grab",
                          color: "text.secondary",
                          display: "inline-flex",
                          alignItems: "center",
                        }}
                      >
                        <IconButton
                          size="small"
                          aria-label="Drag to reorder"
                          tabIndex={-1}
                          sx={{ pointerEvents: "none", color: "inherit" }}
                        >
                          <DragIndicator fontSize="small" />
                        </IconButton>
                      </Box>
                      <TextField
                        size="small"
                        label="Topic"
                        value={row.title}
                        onChange={(e) => {
                          const v = e.target.value;
                          setAgendaItems((prev) =>
                            prev.map((it, j) =>
                              j === index ? { ...it, title: v } : it,
                            ),
                          );
                        }}
                        placeholder="Session or task"
                        sx={{ flex: { md: "1 1 140px" }, minWidth: 120 }}
                      />
                      <TextField
                        size="small"
                        type="time"
                        label="Start"
                        value={startInputValue}
                        onChange={(e) =>
                          updateAgendaStartFromPicker(index, e.target.value)
                        }
                        disabled={!eventDate.trim()}
                        InputLabelProps={{ shrink: true }}
                        inputProps={
                          index === 0 ? { step: 1 } : { step: 60 }
                        }
                        helperText={
                          !eventDate.trim() && index === 0
                            ? "Set Date & time under Venue"
                            : ""
                        }
                        FormHelperTextProps={{ sx: { mx: 0 } }}
                        sx={{ width: { xs: "100%", md: 130 } }}
                      />
                      <TextField
                        size="small"
                        type="number"
                        label="Duration (min)"
                        value={row.durationMinutes}
                        onChange={(e) => {
                          const n = Math.max(
                            1,
                            Math.min(
                              24 * 60,
                              Number(e.target.value) || 1,
                            ),
                          );
                          setAgendaItems((prev) =>
                            prev.map((it, j) =>
                              j === index ? { ...it, durationMinutes: n } : it,
                            ),
                          );
                        }}
                        inputProps={{ min: 1, max: 24 * 60 }}
                        sx={{ width: { xs: "100%", md: 120 } }}
                      />
                      <TextField
                        size="small"
                        label="End"
                        value={formatAgendaClock(slot.end)}
                        disabled
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: { xs: "100%", md: 130 } }}
                      />
                    </Stack>
                  );
                })}
              </Stack>
              <Stack direction="row" justifyContent="flex-end" alignItems="center" mt={1}>
                <IconButton
                  color="primary"
                  aria-label="Add agenda row"
                  onClick={() =>
                    setAgendaItems((prev) => [...prev, newAgendaRow()])
                  }
                >
                  <Add />
                </IconButton>
              </Stack>
            </Box>

            <Box
              mb={2}
              p={2}
              borderRadius={2}
              border="1px solid"
              borderColor="divider"
              bgcolor="background.default"
            >
              <Typography variant="subtitle1" fontWeight={700} mb={1}>
                Attendees &amp; volunteers
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                Optional. These appear on the event details view.
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Who this event is for"
                value={eventWhoFor}
                onChange={(e) => setEventWhoFor(e.target.value)}
                placeholder="e.g. All ages, members only, families with children"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="What to bring"
                value={eventWhatToBring}
                onChange={(e) => setEventWhatToBring(e.target.value)}
                placeholder="e.g. Water bottle, closed-toe shoes, signed waiver"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Volunteer requirements"
                value={eventVolunteerRequirements}
                onChange={(e) => setEventVolunteerRequirements(e.target.value)}
                placeholder="e.g. First aid certification, ability to lift 25 lb"
              />
            </Box>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems={{ sm: "center" }}
              mb={2}
            >
              <Button variant="outlined" component="label">
                {eventImageFile ? "Change Image" : "Upload Image"}
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={(e) =>
                    setEventImageFile(e.target.files?.[0] || null)
                  }
                />
              </Button>
              {eventImageFile ? (
                <Typography variant="body2" color="text.secondary">
                  {eventImageFile.name}
                </Typography>
              ) : null}
            </Stack>

            {eventPreviewUrl ? (
              <Box
                component="img"
                src={eventPreviewUrl}
                alt="Event preview"
                sx={{
                  width: "100%",
                  maxHeight: 260,
                  objectFit: "cover",
                  borderRadius: 2,
                  mb: 2,
                }}
              />
            ) : null}

            <Dialog
              open={eventLocationDialogOpen}
              onClose={() => setEventLocationDialogOpen(false)}
              maxWidth="md"
              fullWidth
            >
              <DialogTitle>Select Venue On Map</DialogTitle>
              <DialogContent>
                <Stack spacing={1.5}>
                  <Typography variant="body2" color="text.secondary">
                    Click on the map to place or move the venue pin.
                  </Typography>
                  <GoogleMapPicker
                    value={eventLocation}
                    onChange={setEventLocation}
                    onPlaceSelect={(placeLabel) => {
                      if (placeLabel?.trim()) setEventVenue(placeLabel.trim());
                    }}
                    height={380}
                  />
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    justifyContent="space-between"
                    alignItems={{ sm: "center" }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {eventLocation
                        ? `Selected pin: ${eventLocation.lat.toFixed(6)}, ${eventLocation.lng.toFixed(6)}`
                        : "No venue pin selected yet."}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      {eventLocation ? (
                        <Button
                          size="small"
                          variant="text"
                          color="inherit"
                          onClick={() => setEventLocation(null)}
                        >
                          Clear Pin
                        </Button>
                      ) : null}
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => setEventLocationDialogOpen(false)}
                      >
                        Done
                      </Button>
                    </Stack>
                  </Stack>
                </Stack>
              </DialogContent>
            </Dialog>

            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button
                variant="text"
                onClick={() => {
                  setEventTitle("");
                  setEventDescription("");
                  setEventVenue("");
                  setEventDate("");
                  setEventEndDate("");
                  setEventWhoFor("");
                  setEventWhatToBring("");
                  setEventVolunteerRequirements("");
                  setEventCapacity("");
                  setEventImageFile(null);
                  setEventLocation(null);
                  setEventLocationDialogOpen(false);
                  setAgendaFirstOffsetMinutes(0);
                  setAgendaItems([newAgendaRow()]);
                  setShowCreateEventErrors(false);
                }}
              >
                Clear
              </Button>
              <Button
                variant="contained"
                onClick={async () => {
                  if (!isApprovedMember) {
                    toast.error("Membership required");
                    return;
                  }
                  if (!createEventRequiredOk) {
                    setShowCreateEventErrors(true);
                    toast.error(
                      "Please enter Title, Venue, and a valid Date & time.",
                    );
                    return;
                  }
                  if (!createEventEndOk) {
                    setShowCreateEventErrors(true);
                    toast.error(
                      "Check the end date and time — it must be on or after the start.",
                    );
                    return;
                  }
                  try {
                    await createEvent({
                      communityId,
                      payload: {
                        title: eventTitle.trim(),
                        description: eventDescription,
                        whoFor: eventWhoFor,
                        whatToBring: eventWhatToBring,
                        volunteerRequirements: eventVolunteerRequirements,
                        venue: eventVenue.trim(),
                        date: new Date(eventDate).toISOString(),
                        endDate:
                          eventEndDate.trim() &&
                          !Number.isNaN(new Date(eventEndDate).getTime())
                            ? new Date(eventEndDate).toISOString()
                            : undefined,
                        capacity: Number(eventCapacity || 0),
                        latitude: eventLocation?.lat,
                        longitude: eventLocation?.lng,
                        imageFile: eventImageFile,
                        agenda: {
                          startOffsetMinutes: agendaFirstOffsetMinutes,
                          items: agendaItems.map((it) => ({
                            title: (it.title || "").trim(),
                            durationMinutes: Math.min(
                              24 * 60,
                              Math.max(1, Number(it.durationMinutes) || 30),
                            ),
                            gapBeforeMinutes: Math.max(
                              0,
                              Number(it.gapBeforeMinutes) || 0,
                            ),
                          })),
                        },
                      },
                    }).unwrap();
                    setEventTitle("");
                    setEventDescription("");
                    setEventVenue("");
                    setEventDate("");
                    setEventEndDate("");
                    setEventWhoFor("");
                    setEventWhatToBring("");
                    setEventVolunteerRequirements("");
                    setEventCapacity("");
                    setEventImageFile(null);
                    setEventLocation(null);
                    setEventLocationDialogOpen(false);
                    setAgendaFirstOffsetMinutes(0);
                    setAgendaItems([newAgendaRow()]);
                    setShowCreateEventErrors(false);
                    toast.success("Event created");
                    setTab(3);
                  } catch (err) {
                    toast.error(
                      getApiErrorMessage(err, "Failed to create event"),
                    );
                  }
                }}
                disabled={!isApprovedMember}
              >
                Create Event
              </Button>
            </Stack>
          </Box>
        </TabPanel>
      </Box>
    </Box>
  );
}
