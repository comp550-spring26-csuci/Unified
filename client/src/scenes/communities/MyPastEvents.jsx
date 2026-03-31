import { ArrowBack, ExpandMore } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useMyEventsQuery } from "@state/api";
import CommunityEventsList from "./CommunityEventsList";
import { filterEventsPast, normalizeId } from "./communityEventShared";

const sectionAccordionSx = {
  mb: 1.5,
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 2,
  overflow: "hidden",
  bgcolor: "background.alt",
  "&:before": { display: "none" },
};

export default function MyPastEvents() {
  const navigate = useNavigate();
  const user = useSelector((s) => s.global.user);
  const userId = normalizeId(user);
  const q = useMyEventsQuery(undefined, { skip: !userId });

  const errMsg = q.error?.data?.message || q.error?.error;

  const communityIdForEvent = (ev) =>
    String(ev.community?._id || ev.community || "");

  const createdPast = useMemo(
    () => filterEventsPast(q.data?.created || []),
    [q.data?.created],
  );
  const attendingPast = useMemo(
    () => filterEventsPast(q.data?.attending || []),
    [q.data?.attending],
  );
  const volunteeringPast = useMemo(
    () => filterEventsPast(q.data?.volunteering || []),
    [q.data?.volunteering],
  );

  if (!userId) {
    return (
      <Box p={3}>
        <Typography color="text.secondary">Sign in to view your events.</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate("/my-events")}
        sx={{ mb: 2 }}
      >
        Back to my upcoming events
      </Button>
      <Typography variant="h4" fontWeight={700} mb={1}>
        My past events
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Events that already started, from communities you belong to.
      </Typography>

      {errMsg ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {errMsg}
        </Alert>
      ) : null}

      {q.isLoading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={0}>
          <Accordion
            defaultExpanded={false}
            disableGutters
            elevation={0}
            sx={sectionAccordionSx}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{
                px: 2,
                minHeight: 48,
                "& .MuiAccordionSummary-content": { my: 1, alignItems: "center" },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
                <Typography variant="subtitle1" fontWeight={700}>
                  Events I created
                </Typography>
                {createdPast.length > 0 ? (
                  <Chip
                    size="small"
                    label={createdPast.length}
                    color="primary"
                    variant="outlined"
                  />
                ) : null}
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
              <CommunityEventsList
                communityIdForEvent={communityIdForEvent}
                showCommunityLink
                showEventEdit={false}
                isCommunityOwner={false}
                userId={userId}
                events={createdPast}
                emptyMessage="No past events you created."
              />
            </AccordionDetails>
          </Accordion>

          <Accordion
            defaultExpanded={false}
            disableGutters
            elevation={0}
            sx={sectionAccordionSx}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{
                px: 2,
                minHeight: 48,
                "& .MuiAccordionSummary-content": { my: 1, alignItems: "center" },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
                <Typography variant="subtitle1" fontWeight={700}>
                  Events I attended
                </Typography>
                {attendingPast.length > 0 ? (
                  <Chip
                    size="small"
                    label={attendingPast.length}
                    color="primary"
                    variant="outlined"
                  />
                ) : null}
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
              <CommunityEventsList
                communityIdForEvent={communityIdForEvent}
                showCommunityLink
                showEventEdit={false}
                isCommunityOwner={false}
                userId={userId}
                events={attendingPast}
                emptyMessage="No past events on your RSVP list."
              />
            </AccordionDetails>
          </Accordion>

          <Accordion
            defaultExpanded={false}
            disableGutters
            elevation={0}
            sx={{ ...sectionAccordionSx, mb: 0 }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{
                px: 2,
                minHeight: 48,
                "& .MuiAccordionSummary-content": { my: 1, alignItems: "center" },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
                <Typography variant="subtitle1" fontWeight={700}>
                  Events I volunteered for
                </Typography>
                {volunteeringPast.length > 0 ? (
                  <Chip
                    size="small"
                    label={volunteeringPast.length}
                    color="primary"
                    variant="outlined"
                  />
                ) : null}
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
              <CommunityEventsList
                communityIdForEvent={communityIdForEvent}
                showCommunityLink
                showEventEdit={false}
                isCommunityOwner={false}
                userId={userId}
                events={volunteeringPast}
                emptyMessage="No past volunteer sign-ups."
              />
            </AccordionDetails>
          </Accordion>
        </Stack>
      )}
    </Box>
  );
}
