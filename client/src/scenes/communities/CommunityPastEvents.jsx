import { ArrowBack } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetCommunityQuery, useListEventsQuery } from "@state/api";
import CommunityEventsList from "./CommunityEventsList";
import { filterEventsPast, normalizeId } from "./communityEventShared";

export default function CommunityPastEvents() {
  const { id: communityId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((s) => s.global.user);
  const userId = normalizeId(user);

  const communityQ = useGetCommunityQuery(communityId, { skip: !communityId });
  const eventsQ = useListEventsQuery(communityId, { skip: !communityId });

  const communityCreatedBy = normalizeId(communityQ.data?.community?.createdBy);
  const isCommunityOwner = useMemo(
    () => !!userId && communityCreatedBy === userId,
    [communityCreatedBy, userId],
  );

  const pastEvents = useMemo(
    () => filterEventsPast(eventsQ.data?.events || []),
    [eventsQ.data?.events],
  );

  const communityName = communityQ.data?.community?.name || "Community";
  const eventsError = eventsQ.error?.data?.message;

  return (
    <Box p={3}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(`/communities/${communityId}?tab=events`)}
        sx={{ mb: 2 }}
      >
        Back to community
      </Button>
      <Typography variant="h4" fontWeight={700}>
        {communityName}
      </Typography>
      <Typography variant="h6" mt={1} mb={0.5}>
        Past events
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Sorted by date and time, most recent first.
      </Typography>
      <CommunityEventsList
        communityId={communityId}
        events={pastEvents}
        eventsError={eventsError}
        isCommunityOwner={isCommunityOwner}
        userId={userId}
        emptyMessage="No past events yet."
        showEventEdit={false}
      />
    </Box>
  );
}
