import { ExpandMore } from "@mui/icons-material";
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
import { Link as RouterLink } from "react-router-dom";
import { useMyEventsQuery } from "@state/api";
import CommunityEventsList from "./CommunityEventsList";
import { filterEventsUpcoming, normalizeId } from "./communityEventShared";

const sectionAccordionSx = {
  mb: 1.5,
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 2,
  overflow: "hidden",
  bgcolor: "background.alt",
  "&:before": { display: "none" },
};

export default function MyEvents() {
  const user = useSelector((s) => s.global.user);
  const userId = normalizeId(user);
  const q = useMyEventsQuery(undefined, { skip: !userId });

  const errMsg = q.error?.data?.message || q.error?.error;

  const communityIdForEvent = (ev) =>
    String(ev.community?._id || ev.community || "");

  const createdUpcoming = useMemo(
    () => filterEventsUpcoming(q.data?.created || []),
    [q.data?.created],
  );
  const attendingUpcoming = useMemo(
    () => filterEventsUpcoming(q.data?.attending || []),
    [q.data?.attending],
  );
  const volunteeringUpcoming = useMemo(
    () => filterEventsUpcoming(q.data?.volunteering || []),
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
        <Button
          component={RouterLink}
          to="/my-events/past"
          variant="outlined"
          size="small"
          sx={{ alignSelf: { xs: "flex-start", sm: "auto" } }}
        >
          Past events
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Upcoming only (soonest first). Use <strong>Past events</strong> for
        history. Same three groups: created, attending, and volunteering. Open a
        community name for full event tools.
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
                {createdUpcoming.length > 0 ? (
                  <Chip
                    size="small"
                    label={createdUpcoming.length}
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
                showEventEdit
                isCommunityOwner={false}
                userId={userId}
                events={createdUpcoming}
                emptyMessage="No upcoming events you created."
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
                  Events I&apos;m attending
                </Typography>
                {attendingUpcoming.length > 0 ? (
                  <Chip
                    size="small"
                    label={attendingUpcoming.length}
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
                events={attendingUpcoming}
                emptyMessage="No upcoming events on your RSVP list."
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
                  Events I&apos;m volunteering for
                </Typography>
                {volunteeringUpcoming.length > 0 ? (
                  <Chip
                    size="small"
                    label={volunteeringUpcoming.length}
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
                events={volunteeringUpcoming}
                emptyMessage="No upcoming volunteer sign-ups."
              />
            </AccordionDetails>
          </Accordion>
        </Stack>
      )}
    </Box>
  );
}
