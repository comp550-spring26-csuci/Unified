import { GoogleMapViewer } from "@components/GoogleMapField";
import {
  AccessTimeOutlined,
  GroupsOutlined,
  LocationOnOutlined,
  PersonOutlined,
  VolunteerActivismOutlined,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  MetaRow,
  computeAgendaSlots,
  formatAgendaClock,
  toAbsoluteMediaUrl,
  toDateTimeLocalFromDate,
} from "./communityEventShared";
import EventBusinessBiddingSection from "./EventBusinessBiddingSection";

export default function EventDetailsDialog({
  open,
  onClose,
  evDetail,
  communityId,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>{evDetail?.title ?? "Event details"}</DialogTitle>
      <DialogContent dividers>
        {(() => {
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

              {evDetail.businessParticipationRequired ? (
                <EventBusinessBiddingSection
                  communityId={communityId}
                  event={evDetail}
                />
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
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
