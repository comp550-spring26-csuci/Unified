import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  useAcceptBusinessBidMutation,
  useSubmitBusinessBidMutation,
} from "@state/api";
import { getApiErrorMessage } from "../../utils/apiError";
import { normalizeId } from "./communityEventShared";

function StatusChip({ event }) {
  if (event?.acceptedBusinessBid) {
    return <Chip size="small" color="success" label="Bid accepted" />;
  }
  if (event?.businessBidSubmissionOpen) {
    return <Chip size="small" color="primary" label="Bidding open" />;
  }
  if (event?.biddingDeadlinePassed) {
    return <Chip size="small" color="warning" label="Deadline passed" />;
  }
  return <Chip size="small" variant="outlined" label="Awaiting schedule" />;
}

export default function EventBusinessBiddingSection({ communityId, event }) {
  const user = useSelector((s) => s.global.user);
  const userId = normalizeId(user);
  const isBusinessOwner = user?.role === "business_owner";
  const canManage = Boolean(event?.userCanManageBusinessBids);

  const [proposal, setProposal] = useState("");
  const [pricing, setPricing] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [submitBusinessBid, { isLoading: isSubmitting }] =
    useSubmitBusinessBidMutation();
  const [acceptBusinessBid, { isLoading: isAccepting }] =
    useAcceptBusinessBidMutation();

  useEffect(() => {
    setProposal(event?.myBusinessBid?.proposal || "");
    setPricing(event?.myBusinessBid?.pricing || "");
    setAdditionalNotes(event?.myBusinessBid?.additionalNotes || "");
  }, [event?.myBusinessBid]);

  const acceptedBidId = normalizeId(event?.acceptedBusinessBid?._id);
  const canSubmitBid =
    Boolean(communityId) &&
    isBusinessOwner &&
    !canManage &&
    event?.businessBidSubmissionOpen;
  const canAcceptAnyBid =
    Boolean(communityId) &&
    canManage &&
    !acceptedBidId &&
    Array.isArray(event?.businessBids) &&
    event.businessBids.length > 0;

  const requiredCategories = useMemo(
    () => event?.businessCategoriesNeeded || [],
    [event?.businessCategoriesNeeded],
  );

  if (!event?.businessParticipationRequired) return null;

  return (
    <Stack spacing={2}>
      <Divider />
      <Box>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ sm: "center" }}
          mb={1}
        >
          <Typography variant="subtitle2" fontWeight={700}>
            Business participation
          </Typography>
          <StatusChip event={event} />
        </Stack>
        <Stack spacing={1.2}>
          <Typography variant="body2" color="text.secondary">
            Bidding deadline:{" "}
            <strong>
              {event?.biddingDeadline
                ? new Date(event.biddingDeadline).toLocaleString()
                : "Not set"}
            </strong>
          </Typography>
          {requiredCategories.length ? (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {requiredCategories.map((category) => (
                <Chip
                  key={category}
                  size="small"
                  variant="outlined"
                  label={category}
                />
              ))}
            </Stack>
          ) : null}
          {event?.businessRequirements?.trim() ? (
            <Typography variant="body2" whiteSpace="pre-wrap">
              {event.businessRequirements}
            </Typography>
          ) : null}
        </Stack>
      </Box>

      {event?.acceptedBusinessBid ? (
        <Alert severity="success">
          Accepted bid:{" "}
          <strong>
            {event.acceptedBusinessBid.businessName ||
              event.acceptedBusinessBid.businessOwner?.name ||
              "Business"}
          </strong>
          {event.acceptedBusinessBid.businessCategory
            ? ` (${event.acceptedBusinessBid.businessCategory})`
            : ""}
        </Alert>
      ) : null}

      {canManage ? (
        <Stack spacing={1.5}>
          <Typography variant="subtitle2" fontWeight={700}>
            Submitted bids
          </Typography>
          {event.businessBids?.length ? (
            event.businessBids.map((bid) => {
              const bidId = normalizeId(bid._id);
              const isAccepted = bidId === acceptedBidId;
              return (
                <Paper
                  key={bidId}
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 2 }}
                >
                  <Stack spacing={1}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      justifyContent="space-between"
                      alignItems={{ sm: "center" }}
                    >
                      <Box>
                        <Typography fontWeight={700}>
                          {bid.businessName || bid.businessOwner?.name || "Business"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {[bid.businessCategory, bid.businessLocation]
                            .filter(Boolean)
                            .join(" | ") || "No business details"}
                        </Typography>
                        {bid.businessOwner?.email ? (
                          <Typography variant="body2" color="text.secondary">
                            {bid.businessOwner.email}
                          </Typography>
                        ) : null}
                      </Box>
                      <Chip
                        size="small"
                        color={isAccepted ? "success" : "default"}
                        label={isAccepted ? "Accepted" : bid.status || "Pending"}
                      />
                    </Stack>
                    <Typography variant="body2" whiteSpace="pre-wrap">
                      {bid.proposal}
                    </Typography>
                    {bid.pricing ? (
                      <Typography variant="body2">
                        <strong>Pricing:</strong> {bid.pricing}
                      </Typography>
                    ) : null}
                    {bid.additionalNotes ? (
                      <Typography variant="body2" whiteSpace="pre-wrap">
                        <strong>Notes:</strong> {bid.additionalNotes}
                      </Typography>
                    ) : null}
                    <Typography variant="caption" color="text.secondary">
                      Submitted {new Date(bid.createdAt).toLocaleString()}
                    </Typography>
                    {canAcceptAnyBid ? (
                      <Box>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={isAccepting}
                          onClick={async () => {
                            try {
                              await acceptBusinessBid({
                                communityId,
                                eventId: event._id,
                                bidId: bid._id,
                              }).unwrap();
                              toast.success("Bid accepted");
                            } catch (err) {
                              toast.error(
                                getApiErrorMessage(err, "Failed to accept bid"),
                              );
                            }
                          }}
                        >
                          Accept Bid
                        </Button>
                      </Box>
                    ) : null}
                  </Stack>
                </Paper>
              );
            })
          ) : (
            <Typography color="text.secondary">
              No business bids have been submitted yet.
            </Typography>
          )}
        </Stack>
      ) : null}

      {isBusinessOwner && !canManage ? (
        <Stack spacing={1.5}>
          {event?.myBusinessBid ? (
            <Alert severity="info">
              You already submitted a bid for this event.
              {event.businessBidSubmissionOpen
                ? " You can update it until the deadline."
                : " Bidding is now closed."}
            </Alert>
          ) : null}

          {event?.acceptedBusinessBid &&
          normalizeId(event.acceptedBusinessBid.businessOwner?.id) === userId ? (
            <Alert severity="success">
              Your business was selected for this event.
            </Alert>
          ) : null}

          {canSubmitBid ? (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack spacing={2}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {event?.myBusinessBid ? "Update your bid" : "Submit a bid"}
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  label="Proposal / offer details"
                  value={proposal}
                  onChange={(e) => setProposal(e.target.value)}
                />
                <TextField
                  fullWidth
                  label="Pricing (optional)"
                  value={pricing}
                  onChange={(e) => setPricing(e.target.value)}
                />
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label="Additional notes"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                />
                <Box>
                  <Button
                    variant="contained"
                    disabled={isSubmitting || proposal.trim().length < 10}
                    onClick={async () => {
                      try {
                        await submitBusinessBid({
                          communityId,
                          eventId: event._id,
                          payload: {
                            proposal: proposal.trim(),
                            pricing: pricing.trim(),
                            additionalNotes: additionalNotes.trim(),
                          },
                        }).unwrap();
                        toast.success(
                          event?.myBusinessBid
                            ? "Bid updated"
                            : "Bid submitted",
                        );
                      } catch (err) {
                        toast.error(
                          getApiErrorMessage(err, "Failed to submit bid"),
                        );
                      }
                    }}
                  >
                    {isSubmitting
                      ? "Saving..."
                      : event?.myBusinessBid
                        ? "Update Bid"
                        : "Submit Bid"}
                  </Button>
                </Box>
              </Stack>
            </Paper>
          ) : (
            <Typography color="text.secondary">
              {event?.acceptedBusinessBid
                ? "Bidding closed because a bid has already been accepted."
                : event?.biddingDeadlinePassed
                  ? "Bidding closed because the deadline has passed."
                  : "Bidding is not available for your account right now."}
            </Typography>
          )}
        </Stack>
      ) : null}
    </Stack>
  );
}
