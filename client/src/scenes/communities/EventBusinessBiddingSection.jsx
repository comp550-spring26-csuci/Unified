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
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  useAcceptBusinessBidMutation,
  useSubmitBusinessBidMutation,
} from "@state/api";
import { getApiErrorMessage } from "../../utils/apiError";
import {
  formatCurrencyAmount,
  normalizeId,
} from "./communityEventShared";

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

function getRankLabel(rank) {
  const numericRank = Number(rank);
  if (!Number.isFinite(numericRank) || numericRank <= 0) return "Unranked";
  const mod100 = numericRank % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${numericRank}th place`;
  const mod10 = numericRank % 10;
  if (mod10 === 1) return `${numericRank}st place`;
  if (mod10 === 2) return `${numericRank}nd place`;
  if (mod10 === 3) return `${numericRank}rd place`;
  return `${numericRank}th place`;
}

export default function EventBusinessBiddingSection({ communityId, event }) {
  const user = useSelector((s) => s.global.user);
  const navigate = useNavigate();
  const userId = normalizeId(user);
  const isBusinessOwner = user?.role === "business_owner";
  const canManage = Boolean(event?.userCanManageBusinessBids);
  const canViewBidHistory = Boolean(event?.userCanViewBusinessBidHistory);

  const [proposal, setProposal] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [submitBusinessBid, { isLoading: isSubmitting }] =
    useSubmitBusinessBidMutation();
  const [acceptBusinessBid, { isLoading: isAccepting }] =
    useAcceptBusinessBidMutation();

  useEffect(() => {
    setProposal(event?.myBusinessBid?.proposal || "");
    setBidAmount(
      Number.isFinite(event?.myBusinessBid?.bidAmount)
        ? String(event.myBusinessBid.bidAmount)
        : "",
    );
    setAdditionalNotes(event?.myBusinessBid?.additionalNotes || "");
  }, [event?.myBusinessBid]);

  const acceptedBidId = normalizeId(event?.acceptedBusinessBid?._id);
  const maximumBidAmount = Number.isFinite(event?.startingBidAmount)
    ? Number(event.startingBidAmount)
    : null;
  const parsedBidAmount = Number(bidAmount);
  const hasValidBidAmount =
    Number.isFinite(parsedBidAmount) &&
    parsedBidAmount >= 0 &&
    (maximumBidAmount == null || parsedBidAmount <= maximumBidAmount);

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
  const acceptedConversationId = normalizeId(
    event?.acceptedBusinessConversationId,
  );
  const canOpenAcceptedChat =
    Boolean(acceptedConversationId) &&
    Boolean(event?.userCanChatWithAcceptedBusiness);

  const requiredCategories = useMemo(
    () => event?.businessCategoriesNeeded || [],
    [event?.businessCategoriesNeeded],
  );
  const visibleBids = useMemo(
    () => (Array.isArray(event?.businessBids) ? event.businessBids : []),
    [event?.businessBids],
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
            Maximum bid:{" "}
            <strong>{formatCurrencyAmount(event?.startingBidAmount)}</strong>
          </Typography>
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
        <Alert
          severity="success"
          action={
            canOpenAcceptedChat ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => navigate(`/messages/${acceptedConversationId}`)}
              >
                Open Chat
              </Button>
            ) : null
          }
        >
          Accepted bid:{" "}
          <strong>
            {event.acceptedBusinessBid.businessName ||
              event.acceptedBusinessBid.businessOwner?.name ||
              "Business"}
          </strong>{" "}
          at {formatCurrencyAmount(event.acceptedBusinessBid.bidAmount)}
        </Alert>
      ) : null}

      {canViewBidHistory ? (
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>
              Bid history
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Lowest bid currently ranks first.
            </Typography>
          </Box>
          {visibleBids.length ? (
            visibleBids.map((bid) => {
              const bidId = normalizeId(bid._id);
              const bidOwnerId = normalizeId(bid.businessOwner?.id);
              const isAccepted = bidId === acceptedBidId;
              const isOwnBid = bidOwnerId === userId;
              return (
                <Paper
                  key={bidId}
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 2 }}
                >
                  <Stack spacing={1.25}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      justifyContent="space-between"
                      alignItems={{ sm: "center" }}
                    >
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        alignItems={{ sm: "center" }}
                      >
                        <Chip
                          size="small"
                          color={bid.isLeadingBid ? "primary" : "default"}
                          label={getRankLabel(bid.bidRank)}
                        />
                        {isAccepted ? (
                          <Chip size="small" color="success" label="Accepted" />
                        ) : null}
                        {isOwnBid ? (
                          <Chip size="small" variant="outlined" label="Your bid" />
                        ) : null}
                      </Stack>
                      <Typography variant="h6" fontWeight={700}>
                        {formatCurrencyAmount(bid.bidAmount)}
                      </Typography>
                    </Stack>

                    <Box>
                      <Typography fontWeight={700}>
                        {bid.businessName || bid.businessOwner?.name || "Business"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {[bid.businessCategory, bid.businessLocation]
                          .filter(Boolean)
                          .join(" | ") || "No business details"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Submitted {new Date(bid.createdAt).toLocaleString()}
                      </Typography>
                      {bid.businessOwner?.email ? (
                        <Typography variant="body2" color="text.secondary">
                          {bid.businessOwner.email}
                        </Typography>
                      ) : null}
                    </Box>

                    {bid.proposal ? (
                      <Typography variant="body2" whiteSpace="pre-wrap">
                        <strong>Proposal:</strong> {bid.proposal}
                      </Typography>
                    ) : null}
                    {bid.additionalNotes ? (
                      <Typography variant="body2" whiteSpace="pre-wrap">
                        <strong>Notes:</strong> {bid.additionalNotes}
                      </Typography>
                    ) : null}

                    {canAcceptAnyBid && bid.isLeadingBid ? (
                      <Box>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={isAccepting}
                          onClick={async () => {
                            try {
                              const result = await acceptBusinessBid({
                                communityId,
                                eventId: event._id,
                                bidId: bid._id,
                              }).unwrap();
                              toast.success("Bid accepted");
                              const conversationId = normalizeId(
                                result?.event?.acceptedBusinessConversationId,
                              );
                              if (conversationId) {
                                navigate(`/messages/${conversationId}`);
                              }
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
                  type="number"
                  label="Bid amount"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  inputProps={{
                    min: 0,
                    max: maximumBidAmount ?? undefined,
                    step: 0.01,
                  }}
                  error={bidAmount !== "" && !hasValidBidAmount}
                  helperText={
                    maximumBidAmount == null
                      ? "Enter a bid amount of 0 or more."
                      : `Must be between ${formatCurrencyAmount(0)} and ${formatCurrencyAmount(maximumBidAmount)}.`
                  }
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
                    disabled={
                      isSubmitting ||
                      proposal.trim().length < 10 ||
                      !hasValidBidAmount
                    }
                    onClick={async () => {
                      try {
                        await submitBusinessBid({
                          communityId,
                          eventId: event._id,
                          payload: {
                            proposal: proposal.trim(),
                            bidAmount: parsedBidAmount,
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
