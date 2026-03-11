import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AccessTimeOutlined,
  GroupsOutlined,
  LocationOnOutlined,
  PersonOutlined,
  VolunteerActivismOutlined,
} from "@mui/icons-material";
import {
  useCreateCommentMutation,
  useCreateEventMutation,
  useCreatePostMutation,
  useGetCommunityQuery,
  useLikePostMutation,
  useListCommentsQuery,
  useListCommunityMembersQuery,
  useListEventsQuery,
  useLazyGetEventOwnerDetailQuery,
  useMyMembershipsQuery,
  useListPostsQuery,
  useRsvpMutation,
  useUpdateCommunityMemberRoleMutation,
  useUpdateCommunityRulesMutation,
  useVolunteerMutation,
} from "@state/api";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "../../utils/apiError";

function TabPanel({ value, index, children }) {
  if (value !== index) return null;
  return <Box mt={2}>{children}</Box>;
}

const API_BASE = import.meta.env.VITE_APP_BASE_URL || "http://localhost:5001";

function normalizeId(value) {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  return String(value?._id || value?.id || "");
}

function toAbsoluteMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;
}

function MetaRow({ icon, label, value }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {icon}
      <Typography variant="body2" color="text.secondary">
        {label}:
      </Typography>
      <Typography variant="body2" fontWeight={600}>
        {value}
      </Typography>
    </Stack>
  );
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
  const [rsvp] = useRsvpMutation();
  const [volunteer] = useVolunteerMutation();

  const [postText, setPostText] = useState("");

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventCapacity, setEventCapacity] = useState("");
  const [eventImageFile, setEventImageFile] = useState(null);
  const [rulesDraft, setRulesDraft] = useState("");
  const [attendeeDialogEventId, setAttendeeDialogEventId] = useState(null);
  const [volunteerDialogEventId, setVolunteerDialogEventId] = useState(null);
  const [ownerDetailEvent, setOwnerDetailEvent] = useState(null);
  const [fetchEventOwnerDetail, ownerDetailQ] = useLazyGetEventOwnerDetailQuery();

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
          {eventsError ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {eventsError}
            </Alert>
          ) : null}

          <Stack spacing={2}>
            {(eventsQ.data?.events || []).map((ev) => (
              <Box key={ev._id} p={2} borderRadius={2} bgcolor="background.alt">
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  {ev.imageUrl ? (
                    <Box
                      component="img"
                      src={toAbsoluteMediaUrl(ev.imageUrl)}
                      alt={ev.title}
                      sx={{
                        width: { xs: "100%", md: 280 },
                        minWidth: { md: 280 },
                        aspectRatio: "16 / 10",
                        objectFit: "cover",
                        borderRadius: 1.5,
                        border: "1px solid",
                        borderColor: "divider",
                        backgroundColor: "background.paper",
                      }}
                    />
                  ) : null}

                  <Box flex={1} minWidth={0}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={1}
                    >
                      <Typography fontWeight={700}>{ev.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Event
                      </Typography>
                    </Stack>
                    {ev.description ? (
                      <Typography mt={1}>{ev.description}</Typography>
                    ) : null}
                    <Stack spacing={0.8} mt={1.2}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PersonOutlined sx={{ fontSize: 18, color: "text.secondary" }} />
                        <Typography variant="body2" color="text.secondary">
                          Owner:
                        </Typography>
                        {isCommunityOwner ? (
                          <Button
                            size="small"
                            variant="text"
                            sx={{ textTransform: "none", p: 0, minWidth: 0 }}
                            onClick={() => {
                              setOwnerDetailEvent(ev);
                              fetchEventOwnerDetail({
                                communityId,
                                eventId: ev._id,
                              });
                            }}
                          >
                            {ev.createdBy?.name ?? "Unknown"}
                          </Button>
                        ) : (
                          <Typography variant="body2" fontWeight={600}>
                            {ev.createdBy?.name ?? "Unknown"}
                          </Typography>
                        )}
                      </Stack>
                      <MetaRow
                        icon={
                          <AccessTimeOutlined
                            sx={{ fontSize: 18, color: "text.secondary" }}
                          />
                        }
                        label="Date & Time"
                        value={new Date(ev.date).toLocaleString()}
                      />
                      <MetaRow
                        icon={
                          <LocationOnOutlined
                            sx={{ fontSize: 18, color: "text.secondary" }}
                          />
                        }
                        label="Venue"
                        value={ev.venue || "TBA"}
                      />
                      <MetaRow
                        icon={
                          <GroupsOutlined
                            sx={{ fontSize: 18, color: "text.secondary" }}
                          />
                        }
                        label="Attendees"
                        value={`${ev.attendees?.length || 0}${ev.capacity > 0 ? ` / ${ev.capacity}` : ""}`}
                      />
                      <MetaRow
                        icon={
                          <VolunteerActivismOutlined
                            sx={{ fontSize: 18, color: "text.secondary" }}
                          />
                        }
                        label="Volunteers"
                        value={String(ev.volunteers?.length || 0)}
                      />
                    </Stack>
                    <Stack direction="row" spacing={1} mt={1}>
                      {normalizeId(ev.createdBy) === userId ? (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setAttendeeDialogEventId(ev._id)}
                        >
                          RSVP ({ev.attendees?.length || 0})
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={async () => {
                            try {
                              await rsvp({
                                communityId,
                                eventId: ev._id,
                              }).unwrap();
                              toast.success("RSVP updated");
                            } catch (err) {
                              toast.error(
                                getApiErrorMessage(err, "Failed to update RSVP"),
                              );
                            }
                          }}
                        >
                          RSVP ({ev.attendees?.length || 0})
                        </Button>
                      )}
                      {normalizeId(ev.createdBy) === userId ? (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setVolunteerDialogEventId(ev._id)}
                        >
                          Volunteer ({ev.volunteers?.length || 0})
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={async () => {
                            try {
                              await volunteer({
                                communityId,
                                eventId: ev._id,
                              }).unwrap();
                              toast.success("Volunteer status updated");
                            } catch (err) {
                              toast.error(
                                getApiErrorMessage(
                                  err,
                                  "Failed to update volunteer status",
                                ),
                              );
                            }
                          }}
                        >
                          Volunteer ({ev.volunteers?.length || 0})
                        </Button>
                      )}
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            ))}
          </Stack>

          <Dialog
            open={!!attendeeDialogEventId}
            onClose={() => setAttendeeDialogEventId(null)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Attendees</DialogTitle>
            <DialogContent>
              {(() => {
                const event = (eventsQ.data?.events || []).find(
                  (e) => e._id === attendeeDialogEventId,
                );
                const attendees = event?.attendees || [];
                if (attendees.length === 0) {
                  return (
                    <Typography color="text.secondary">
                      No one has RSVP'd yet.
                    </Typography>
                  );
                }
                return (
                  <List dense disablePadding>
                    {attendees.map((a) => (
                      <ListItem key={a._id || a} disablePadding sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={typeof a === "object" ? a?.name ?? "Unknown" : "Unknown"}
                        />
                      </ListItem>
                    ))}
                  </List>
                );
              })()}
            </DialogContent>
          </Dialog>

          <Dialog
            open={!!volunteerDialogEventId}
            onClose={() => setVolunteerDialogEventId(null)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Volunteers</DialogTitle>
            <DialogContent>
              {(() => {
                const event = (eventsQ.data?.events || []).find(
                  (e) => e._id === volunteerDialogEventId,
                );
                const volunteers = event?.volunteers || [];
                if (volunteers.length === 0) {
                  return (
                    <Typography color="text.secondary">
                      No one has volunteered yet.
                    </Typography>
                  );
                }
                return (
                  <List dense disablePadding>
                    {volunteers.map((v) => (
                      <ListItem key={v._id || v} disablePadding sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={typeof v === "object" ? v?.name ?? "Unknown" : "Unknown"}
                        />
                      </ListItem>
                    ))}
                  </List>
                );
              })()}
            </DialogContent>
          </Dialog>

          <Dialog
            open={!!ownerDetailEvent}
            onClose={() => setOwnerDetailEvent(null)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Event Owner Details</DialogTitle>
            <DialogContent>
              {ownerDetailQ.isFetching ? (
                <Typography color="text.secondary">Loading owner details...</Typography>
              ) : ownerDetailQ.error ? (
                <Alert severity="warning">
                  {ownerDetailQ.error?.data?.message || "Failed to load owner details"}
                </Alert>
              ) : ownerDetailQ.data?.owner ? (
                <Stack spacing={1.2}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                      src={toAbsoluteMediaUrl(ownerDetailQ.data.owner.avatarUrl || "") || undefined}
                      alt={ownerDetailQ.data.owner.name || "Owner"}
                      sx={{ width: 44, height: 44 }}
                    >
                      {(ownerDetailQ.data.owner.name || "O").charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={700}>{ownerDetailQ.data.owner.name || "-"}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {ownerDetailQ.data.owner.email || "-"}
                      </Typography>
                    </Box>
                  </Stack>
                  <Typography variant="body2">
                    <strong>Mailing Address:</strong> {ownerDetailQ.data.owner.mailingAddress || "-"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Location:</strong>{" "}
                    {[ownerDetailQ.data.owner.city, ownerDetailQ.data.owner.country].filter(Boolean).join(", ") || "-"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Interests:</strong>{" "}
                    {(ownerDetailQ.data.owner.interests || []).length
                      ? ownerDetailQ.data.owner.interests.join(", ")
                      : "-"}
                  </Typography>
                </Stack>
              ) : (
                <Typography color="text.secondary">No owner details found.</Typography>
              )}
            </DialogContent>
          </Dialog>
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
              Add details, schedule date/time, and optionally attach an event
              image.
            </Typography>
            {!membershipsQ.isLoading && !isApprovedMember ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Membership required. Only approved community members can create
                events.
              </Alert>
            ) : null}

            <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
              <TextField
                fullWidth
                label="Title"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Community Cleanup Drive"
              />
              <TextField
                fullWidth
                label="Venue"
                value={eventVenue}
                onChange={(e) => setEventVenue(e.target.value)}
                placeholder="Main Community Hall"
              />
            </Stack>

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Description"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Share agenda, items to bring, and any notes."
              sx={{ mb: 2 }}
            />

            <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Date & Time"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 60 }}
              />
              <TextField
                fullWidth
                type="number"
                label="Capacity (0 = unlimited)"
                value={eventCapacity}
                onChange={(e) => setEventCapacity(e.target.value)}
              />
            </Stack>

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

            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button
                variant="text"
                onClick={() => {
                  setEventTitle("");
                  setEventDescription("");
                  setEventVenue("");
                  setEventDate("");
                  setEventCapacity("");
                  setEventImageFile(null);
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
                  try {
                    await createEvent({
                      communityId,
                      payload: {
                        title: eventTitle,
                        description: eventDescription,
                        venue: eventVenue,
                        date: new Date(eventDate).toISOString(),
                        capacity: Number(eventCapacity || 0),
                        imageFile: eventImageFile,
                      },
                    }).unwrap();
                    setEventTitle("");
                    setEventDescription("");
                    setEventVenue("");
                    setEventDate("");
                    setEventCapacity("");
                    setEventImageFile(null);
                    toast.success("Event created");
                    setTab(3);
                  } catch (err) {
                    toast.error(
                      getApiErrorMessage(err, "Failed to create event"),
                    );
                  }
                }}
                disabled={
                  !isApprovedMember ||
                  !eventTitle.trim() ||
                  !eventVenue.trim() ||
                  !eventDate.trim()
                }
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
