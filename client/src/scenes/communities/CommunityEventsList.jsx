import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
import {
  useLazyGetEventOwnerDetailQuery,
  useRsvpMutation,
  useVolunteerMutation,
} from "@state/api";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "../../utils/apiError";
import {
  computeAgendaSlots,
  formatAgendaClock,
  MetaRow,
  normalizeId,
  toAbsoluteMediaUrl,
  toDateTimeLocalFromDate,
} from "./communityEventShared";

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
  const [attendeeDialogEventId, setAttendeeDialogEventId] = useState(null);
  const [volunteerDialogEventId, setVolunteerDialogEventId] = useState(null);
  const [volunteerSignupEventId, setVolunteerSignupEventId] = useState(null);
  const [volunteerSignupAccepted, setVolunteerSignupAccepted] = useState(false);
  const [mapDialogEventId, setMapDialogEventId] = useState(null);
  const [eventDetailsDialogId, setEventDetailsDialogId] = useState(null);
  const [ownerDetailEvent, setOwnerDetailEvent] = useState(null);
  const [fetchEventOwnerDetail, ownerDetailQ] = useLazyGetEventOwnerDetailQuery();
  const navigate = useNavigate();

  const [rsvp] = useRsvpMutation();
  const [volunteer] = useVolunteerMutation();

  const findEvent = (id) => events.find((e) => e._id === id);

  const resolveCommunityId = (ev) => {
    if (typeof communityIdForEvent === "function") {
      const id = communityIdForEvent(ev);
      if (id != null && id !== "") return String(id);
    }
    if (communityId != null && communityId !== "") return String(communityId);
    return "";
  };

  const userIsVolunteer = (ev) =>
    !!userId &&
    (ev.volunteers || []).some((v) => normalizeId(v) === userId);

  const closeVolunteerSignupDialog = () => {
    setVolunteerSignupEventId(null);
    setVolunteerSignupAccepted(false);
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
                  <Typography variant="caption" color="text.secondary">
                    Event
                  </Typography>
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
                  {showEventEdit && normalizeId(ev.createdBy) === userId ? (
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
                            communityId: resolveCommunityId(ev),
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
                        if (userIsVolunteer(ev)) {
                          try {
                            await volunteer({
                              communityId: resolveCommunityId(ev),
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
                          return;
                        }
                        setVolunteerSignupAccepted(false);
                        setVolunteerSignupEventId(ev._id);
                      }}
                    >
                      Volunteer ({ev.volunteers?.length || 0})
                    </Button>
                  )}
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

      <Dialog
        open={!!attendeeDialogEventId}
        onClose={() => setAttendeeDialogEventId(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Attendees</DialogTitle>
        <DialogContent>
          {(() => {
            const event = findEvent(attendeeDialogEventId);
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
                      primary={
                        typeof a === "object" ? a?.name ?? "Unknown" : "Unknown"
                      }
                    />
                  </ListItem>
                ))}
              </List>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!eventDetailsDialogId}
        onClose={() => setEventDetailsDialogId(null)}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          {findEvent(eventDetailsDialogId)?.title ?? "Event details"}
        </DialogTitle>
        <DialogContent dividers>
          {(() => {
            const evDetail = findEvent(eventDetailsDialogId);
            if (!evDetail) {
              return (
                <Typography color="text.secondary">Event not found.</Typography>
              );
            }
            const dtLocal = toDateTimeLocalFromDate(evDetail.date);
            const agendaItems = evDetail.agenda?.items || [];
            const agendaSlots =
              agendaItems.length > 0 && dtLocal
                ? computeAgendaSlots(
                    dtLocal,
                    evDetail.agenda?.startOffsetMinutes ?? 0,
                    agendaItems,
                  )
                : [];

            return (
              <Stack spacing={2}>
                {evDetail.imageUrl ? (
                  <Box
                    component="img"
                    src={toAbsoluteMediaUrl(evDetail.imageUrl)}
                    alt={evDetail.title}
                    sx={{
                      width: "100%",
                      maxHeight: 280,
                      objectFit: "cover",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  />
                ) : null}

                {evDetail.description ? (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Description
                    </Typography>
                    <Typography whiteSpace="pre-wrap" sx={{ mt: 0.5 }}>
                      {evDetail.description}
                    </Typography>
                  </Box>
                ) : null}

                <Divider />

                <Box>
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>
                    Event information
                  </Typography>
                  <Stack spacing={1.25}>
                    <MetaRow
                      icon={
                        <PersonOutlined
                          sx={{ fontSize: 18, color: "text.secondary" }}
                        />
                      }
                      label="Owner"
                      value={evDetail.createdBy?.name ?? "Unknown"}
                    />
                    <MetaRow
                      icon={
                        <AccessTimeOutlined
                          sx={{ fontSize: 18, color: "text.secondary" }}
                        />
                      }
                      label="Date & time"
                      value={new Date(evDetail.date).toLocaleString()}
                    />
                    {evDetail.endDate ? (
                      <MetaRow
                        icon={
                          <AccessTimeOutlined
                            sx={{ fontSize: 18, color: "text.secondary" }}
                          />
                        }
                        label="End date & time"
                        value={new Date(evDetail.endDate).toLocaleString()}
                      />
                    ) : null}
                    <MetaRow
                      icon={
                        <LocationOnOutlined
                          sx={{ fontSize: 18, color: "text.secondary" }}
                        />
                      }
                      label="Venue"
                      value={evDetail.venue || "—"}
                    />
                    <MetaRow
                      icon={
                        <GroupsOutlined
                          sx={{ fontSize: 18, color: "text.secondary" }}
                        />
                      }
                      label="Capacity"
                      value={
                        evDetail.capacity > 0
                          ? String(evDetail.capacity)
                          : "Unlimited"
                      }
                    />
                    <MetaRow
                      icon={
                        <GroupsOutlined
                          sx={{ fontSize: 18, color: "text.secondary" }}
                        />
                      }
                      label="Attendees"
                      value={`${evDetail.attendees?.length || 0}${evDetail.capacity > 0 ? ` / ${evDetail.capacity}` : ""}`}
                    />
                    <MetaRow
                      icon={
                        <VolunteerActivismOutlined
                          sx={{ fontSize: 18, color: "text.secondary" }}
                        />
                      }
                      label="Volunteers"
                      value={String(evDetail.volunteers?.length || 0)}
                    />
                  </Stack>
                </Box>

                {evDetail.whoFor?.trim() ? (
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} mb={0.75}>
                      Who this event is for
                    </Typography>
                    <Typography variant="body2" whiteSpace="pre-wrap">
                      {evDetail.whoFor}
                    </Typography>
                  </Box>
                ) : null}

                {evDetail.whatToBring?.trim() ||
                evDetail.volunteerRequirements?.trim() ? (
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} mb={1}>
                      Attendees and volunteers
                    </Typography>
                    <Stack spacing={1.5}>
                      {evDetail.whatToBring?.trim() ? (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            What to bring
                          </Typography>
                          <Typography whiteSpace="pre-wrap" sx={{ mt: 0.5 }}>
                            {evDetail.whatToBring}
                          </Typography>
                        </Box>
                      ) : null}
                      {evDetail.volunteerRequirements?.trim() ? (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Volunteer requirements
                          </Typography>
                          <Typography whiteSpace="pre-wrap" sx={{ mt: 0.5 }}>
                            {evDetail.volunteerRequirements}
                          </Typography>
                        </Box>
                      ) : null}
                    </Stack>
                  </Box>
                ) : null}

                {agendaItems.length > 0 ? (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} mb={1}>
                        Agenda
                      </Typography>
                      <TableContainer
                        component={Box}
                        sx={{
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: "divider",
                          bgcolor: "action.hover",
                        }}
                      >
                        <Table size="small" aria-label="Event agenda">
                          <TableHead>
                            <TableRow>
                              <TableCell
                                sx={{
                                  fontWeight: 700,
                                  color: "text.secondary",
                                  borderBottomColor: "divider",
                                }}
                              >
                                Topic
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{
                                  fontWeight: 700,
                                  color: "text.secondary",
                                  width: 96,
                                  whiteSpace: "nowrap",
                                  borderBottomColor: "divider",
                                }}
                              >
                                Start time
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{
                                  fontWeight: 700,
                                  color: "text.secondary",
                                  width: 104,
                                  whiteSpace: "nowrap",
                                  borderBottomColor: "divider",
                                }}
                              >
                                Duration
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{
                                  fontWeight: 700,
                                  color: "text.secondary",
                                  width: 96,
                                  whiteSpace: "nowrap",
                                  borderBottomColor: "divider",
                                }}
                              >
                                End time
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {agendaItems.map((item, idx) => {
                              const slot = agendaSlots[idx];
                              return (
                                <TableRow
                                  key={`${idx}-${item.title || "row"}`}
                                  sx={{
                                    "&:last-child td": { borderBottom: 0 },
                                  }}
                                >
                                  <TableCell sx={{ verticalAlign: "top" }}>
                                    {item.title?.trim()
                                      ? item.title
                                      : `Item ${idx + 1}`}
                                  </TableCell>
                                  <TableCell align="right">
                                    {formatAgendaClock(slot?.start)}
                                  </TableCell>
                                  <TableCell align="right">
                                    {item.durationMinutes} min
                                  </TableCell>
                                  <TableCell align="right">
                                    {formatAgendaClock(slot?.end)}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </>
                ) : null}

                {Number.isFinite(evDetail?.location?.lat) &&
                Number.isFinite(evDetail?.location?.lng) ? (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} mb={1}>
                        Location
                      </Typography>
                      <GoogleMapViewer
                        value={{
                          lat: evDetail.location.lat,
                          lng: evDetail.location.lng,
                        }}
                      />
                    </Box>
                  </>
                ) : null}
              </Stack>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEventDetailsDialogId(null)}>Close</Button>
        </DialogActions>
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
            const event = findEvent(volunteerDialogEventId);
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
                      primary={
                        typeof v === "object" ? v?.name ?? "Unknown" : "Unknown"
                      }
                    />
                  </ListItem>
                ))}
              </List>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!volunteerSignupEventId}
        onClose={closeVolunteerSignupDialog}
        maxWidth="sm"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>Volunteer for this event</DialogTitle>
        <DialogContent dividers>
          {(() => {
            const evSignup = findEvent(volunteerSignupEventId);
            if (!evSignup) {
              return (
                <Typography color="text.secondary">Event not found.</Typography>
              );
            }
            const reqText = evSignup.volunteerRequirements?.trim();
            return (
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Review the organizer's expectations before you sign up.
                </Typography>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Volunteer requirements
                  </Typography>
                  {reqText ? (
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: "pre-wrap" }}
                    >
                      {reqText}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No specific requirements were added for this event. By
                      volunteering, you agree to help as needed and follow
                      guidance from the event organizer.
                    </Typography>
                  )}
                </Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={volunteerSignupAccepted}
                      onChange={(e) =>
                        setVolunteerSignupAccepted(e.target.checked)
                      }
                      color="primary"
                    />
                  }
                  label={
                    reqText
                      ? "I have read and accept these volunteer requirements."
                      : "I have read the information above and agree to volunteer."
                  }
                />
              </Stack>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeVolunteerSignupDialog}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!volunteerSignupAccepted}
            onClick={async () => {
              if (!volunteerSignupEventId || !volunteerSignupAccepted) return;
              const evSignup = findEvent(volunteerSignupEventId);
              const cid = evSignup ? resolveCommunityId(evSignup) : "";
              if (!cid) {
                toast.error("Could not determine community for this event.");
                return;
              }
              try {
                await volunteer({
                  communityId: cid,
                  eventId: volunteerSignupEventId,
                }).unwrap();
                toast.success("You're signed up as a volunteer");
                closeVolunteerSignupDialog();
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
            Confirm
          </Button>
        </DialogActions>
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
                  ? ownerDetailQ.data.owner.interests.join(", ")
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
