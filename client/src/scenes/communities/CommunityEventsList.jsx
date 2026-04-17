import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { GoogleMapViewer } from "@components/GoogleMapField";
import {
  AccessTimeOutlined,
  GroupsOutlined,
  LocationOnOutlined,
  PersonOutlined,
  VolunteerActivismOutlined,
} from "@mui/icons-material";
import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  useDeleteEventMutation,
  useLazyGetEventOwnerDetailQuery,
} from "@state/api";
import EventDetailsDialog from "./EventDetailsDialog";
import EventRsvpVolunteerActions from "./EventRsvpVolunteerActions";
import { normalizeId, toAbsoluteMediaUrl } from "./communityEventShared";
import { formatCommunityTagList } from "../../constants/communityTags";
import { getApiErrorMessage } from "../../utils/apiError";

export default function CommunityEventsList({
  communityId,
  communityIdForEvent,
  events,
  eventsError,
  isCommunityOwner,
  userId,
  emptyMessage,
  showEventEdit = true,
  showCommunityLink = false,
}) {
  const [mapDialogEventId, setMapDialogEventId] = useState(null);
  const [eventDetailsDialogId, setEventDetailsDialogId] = useState(null);
  const [ownerDetailEvent, setOwnerDetailEvent] = useState(null);
  const [deleteEvent] = useDeleteEventMutation();
  const [fetchEventOwnerDetail, ownerDetailQ] = useLazyGetEventOwnerDetailQuery();
  const navigate = useNavigate();

  const findEvent = (id) => events.find((e) => e._id === id);

  const resolveCommunityId = (ev) => {
    if (typeof communityIdForEvent === "function") {
      const id = communityIdForEvent(ev);
      if (id != null && id !== "") return String(id);
    }
    if (communityId != null && communityId !== "") return String(communityId);
    return "";
  };

  return (
    <>
      {eventsError ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {eventsError}
        </Alert>
      ) : null}

      <Stack spacing={2}>
        {events.length === 0 ? (
          <Typography color="text.secondary">{emptyMessage}</Typography>
        ) : null}
        {events.map((ev) => (
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
                  alignItems="flex-start"
                  mb={1}
                >
                  <Box minWidth={0}>
                    <Typography fontWeight={700}>{ev.title}</Typography>
                    {showCommunityLink &&
                    resolveCommunityId(ev) &&
                    (typeof ev.community === "object"
                      ? ev.community?.name
                      : null) ? (
                      <Typography
                        variant="caption"
                        component={RouterLink}
                        to={`/communities/${resolveCommunityId(ev)}`}
                        color="primary"
                        sx={{ display: "block", mt: 0.25 }}
                      >
                        {typeof ev.community === "object"
                          ? ev.community?.name || "Community"
                          : "Community"}
                      </Typography>
                    ) : null}
                  </Box>
                  {ev.isDeleted ? (
                    <Chip size="small" color="error" variant="outlined" label="Deleted" />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Event
                    </Typography>
                  )}
                </Stack>
                {ev.description ? (
                  <Typography mt={1}>{ev.description}</Typography>
                ) : null}
                <Stack spacing={0.65} mt={1.2}>
                  <Stack
                    direction="row"
                    flexWrap="wrap"
                    alignItems="center"
                    useFlexGap
                    spacing={1.25}
                    sx={{ rowGap: 0.5, columnGap: 1.75 }}
                  >
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.5,
                        minWidth: 0,
                      }}
                    >
                      <PersonOutlined
                        sx={{ fontSize: 17, color: "text.secondary", flexShrink: 0 }}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ flexShrink: 0 }}
                      >
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
                              communityId: resolveCommunityId(ev),
                              eventId: ev._id,
                            });
                          }}
                        >
                          {ev.createdBy?.name ?? "Unknown"}
                        </Button>
                      ) : (
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ minWidth: 0 }}>
                          {ev.createdBy?.name ?? "Unknown"}
                        </Typography>
                      )}
                    </Box>
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.5,
                        flexWrap: "wrap",
                        minWidth: 0,
                      }}
                    >
                      <AccessTimeOutlined
                        sx={{ fontSize: 17, color: "text.secondary", flexShrink: 0 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Date &amp; time:
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {new Date(ev.date).toLocaleString()}
                      </Typography>
                    </Box>
                    {ev.endDate ? (
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.5,
                          flexWrap: "wrap",
                          minWidth: 0,
                        }}
                      >
                        <AccessTimeOutlined
                          sx={{ fontSize: 17, color: "text.secondary", flexShrink: 0 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          Ends:
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {new Date(ev.endDate).toLocaleString()}
                        </Typography>
                      </Box>
                    ) : null}
                  </Stack>
                  <Stack
                    direction="row"
                    flexWrap="wrap"
                    alignItems="center"
                    useFlexGap
                    spacing={1.25}
                    sx={{ rowGap: 0.5, columnGap: 1.75 }}
                  >
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.5,
                        minWidth: 0,
                        maxWidth: "100%",
                      }}
                    >
                      <LocationOnOutlined
                        sx={{ fontSize: 17, color: "text.secondary", flexShrink: 0 }}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                        Venue:
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ wordBreak: "break-word" }}
                      >
                        {ev.venue || "TBA"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                      <GroupsOutlined
                        sx={{ fontSize: 17, color: "text.secondary", flexShrink: 0 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Attendees:
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {`${ev.attendees?.length || 0}${ev.capacity > 0 ? ` / ${ev.capacity}` : ""}`}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                      <VolunteerActivismOutlined
                        sx={{ fontSize: 17, color: "text.secondary", flexShrink: 0 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Volunteers:
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {String(ev.volunteers?.length || 0)}
                      </Typography>
                    </Box>
                    {Number.isFinite(ev?.location?.lat) &&
                    Number.isFinite(ev?.location?.lng) ? (
                      <Typography variant="caption" color="text.secondary">
                        Map pin available
                      </Typography>
                    ) : null}
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setEventDetailsDialogId(ev._id)}
                  >
                    Details
                  </Button>
                  {showEventEdit &&
                  !ev.isDeleted &&
                  normalizeId(ev.createdBy) === userId ? (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() =>
                        navigate(
                          `/communities/${resolveCommunityId(ev)}?tab=4&editEvent=${ev._id}`,
                        )
                      }
                    >
                      Edit
                    </Button>
                  ) : null}
                  {!ev.isDeleted &&
                  (normalizeId(ev.createdBy) === userId || isCommunityOwner) ? (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={async () => {
                        const confirmed = window.confirm(
                          `Delete "${ev.title}"? This cannot be undone.`,
                        );
                        if (!confirmed) return;

                        try {
                          await deleteEvent({
                            communityId: resolveCommunityId(ev),
                            eventId: ev._id,
                          }).unwrap();
                          toast.success("Event deleted");
                        } catch (err) {
                          toast.error(
                            getApiErrorMessage(err, "Failed to delete event"),
                          );
                        }
                      }}
                    >
                      Delete
                    </Button>
                  ) : null}
                  {!ev.isDeleted ? (
                    <EventRsvpVolunteerActions
                      ev={ev}
                      communityId={resolveCommunityId(ev)}
                    />
                  ) : null}
                  {Number.isFinite(ev?.location?.lat) &&
                  Number.isFinite(ev?.location?.lng) ? (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setMapDialogEventId(ev._id)}
                    >
                      View Map
                    </Button>
                  ) : null}
                </Stack>
              </Box>
            </Stack>
          </Box>
        ))}
      </Stack>

      <EventDetailsDialog
        open={!!eventDetailsDialogId}
        onClose={() => setEventDetailsDialogId(null)}
        evDetail={findEvent(eventDetailsDialogId)}
      />

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
                  src={
                    toAbsoluteMediaUrl(ownerDetailQ.data.owner.avatarUrl || "") ||
                    undefined
                  }
                  alt={ownerDetailQ.data.owner.name || "Owner"}
                  sx={{ width: 44, height: 44 }}
                >
                  {(ownerDetailQ.data.owner.name || "O").charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography fontWeight={700}>
                    {ownerDetailQ.data.owner.name || "-"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {ownerDetailQ.data.owner.email || "-"}
                  </Typography>
                </Box>
              </Stack>
              <Typography variant="body2">
                <strong>Mailing Address:</strong>{" "}
                {ownerDetailQ.data.owner.mailingAddress || "-"}
              </Typography>
              <Typography variant="body2">
                <strong>Location:</strong>{" "}
                {[ownerDetailQ.data.owner.city, ownerDetailQ.data.owner.country]
                  .filter(Boolean)
                  .join(", ") || "-"}
              </Typography>
              <Typography variant="body2">
                <strong>Interests:</strong>{" "}
                {(ownerDetailQ.data.owner.interests || []).length
                  ? formatCommunityTagList(ownerDetailQ.data.owner.interests)
                  : "-"}
              </Typography>
            </Stack>
          ) : (
            <Typography color="text.secondary">No owner details found.</Typography>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!mapDialogEventId}
        onClose={() => setMapDialogEventId(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {(() => {
            const event = findEvent(mapDialogEventId);
            return event ? `${event.title} Location` : "Event Location";
          })()}
        </DialogTitle>
        <DialogContent>
          {(() => {
            const event = findEvent(mapDialogEventId);
            return <GoogleMapViewer value={event?.location || null} />;
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}
