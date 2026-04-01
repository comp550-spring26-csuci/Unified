import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useRsvpMutation, useVolunteerMutation } from "@state/api";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "../../utils/apiError";
import { normalizeId } from "./communityEventShared";

/**
 * RSVP + Volunteer controls and dialogs (same behavior as the Events list).
 */
export default function EventRsvpVolunteerActions({ ev, communityId }) {
  const user = useSelector((s) => s.global.user);
  const userId = normalizeId(user);
  const [rsvp] = useRsvpMutation();
  const [volunteer] = useVolunteerMutation();

  const [attendeeOpen, setAttendeeOpen] = useState(false);
  const [volunteerListOpen, setVolunteerListOpen] = useState(false);
  const [volunteerSignupOpen, setVolunteerSignupOpen] = useState(false);
  const [volunteerSignupAccepted, setVolunteerSignupAccepted] = useState(false);

  const cid = String(communityId || "").trim();

  const userIsVolunteer = () =>
    !!userId &&
    (ev.volunteers || []).some((v) => normalizeId(v) === userId);

  const closeVolunteerSignup = () => {
    setVolunteerSignupOpen(false);
    setVolunteerSignupAccepted(false);
  };

  if (!ev?._id || !cid) return null;

  const attendees = ev.attendees || [];
  const volunteers = ev.volunteers || [];
  const reqText = ev.volunteerRequirements?.trim();

  return (
    <>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {normalizeId(ev.createdBy) === userId ? (
          <Button
            size="small"
            variant="outlined"
            onClick={() => setAttendeeOpen(true)}
          >
            RSVP ({attendees.length})
          </Button>
        ) : (
          <Button
            size="small"
            variant="outlined"
            onClick={async () => {
              try {
                await rsvp({ communityId: cid, eventId: ev._id }).unwrap();
                toast.success("RSVP updated");
              } catch (err) {
                toast.error(getApiErrorMessage(err, "Failed to update RSVP"));
              }
            }}
          >
            RSVP ({attendees.length})
          </Button>
        )}
        {normalizeId(ev.createdBy) === userId ? (
          <Button
            size="small"
            variant="outlined"
            onClick={() => setVolunteerListOpen(true)}
          >
            Volunteer ({volunteers.length})
          </Button>
        ) : (
          <Button
            size="small"
            variant="outlined"
            onClick={async () => {
              if (userIsVolunteer()) {
                try {
                  await volunteer({
                    communityId: cid,
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
              setVolunteerSignupOpen(true);
            }}
          >
            Volunteer ({volunteers.length})
          </Button>
        )}
      </Stack>

      <Dialog
        open={attendeeOpen}
        onClose={() => setAttendeeOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Attendees</DialogTitle>
        <DialogContent>
          {attendees.length === 0 ? (
            <Typography color="text.secondary">
              No one has RSVP&apos;d yet.
            </Typography>
          ) : (
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
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={volunteerListOpen}
        onClose={() => setVolunteerListOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Volunteers</DialogTitle>
        <DialogContent>
          {volunteers.length === 0 ? (
            <Typography color="text.secondary">
              No one has volunteered yet.
            </Typography>
          ) : (
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
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={volunteerSignupOpen}
        onClose={closeVolunteerSignup}
        maxWidth="sm"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>Volunteer for this event</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Review the organizer&apos;s expectations before you sign up.
            </Typography>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Volunteer requirements
              </Typography>
              {reqText ? (
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {reqText}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No specific requirements were added for this event. By
                  volunteering, you agree to help as needed and follow guidance
                  from the event organizer.
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
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeVolunteerSignup}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!volunteerSignupAccepted}
            onClick={async () => {
              if (!volunteerSignupAccepted) return;
              try {
                await volunteer({
                  communityId: cid,
                  eventId: ev._id,
                }).unwrap();
                toast.success("You're signed up as a volunteer");
                closeVolunteerSignup();
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
    </>
  );
}
