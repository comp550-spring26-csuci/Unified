import { SendOutlined } from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  useGetConversationMessagesQuery,
  useListConversationsQuery,
  useSendConversationMessageMutation,
} from "@state/api";
import { getApiErrorMessage } from "../../utils/apiError";
import { toAbsoluteMediaUrl } from "../../utils/media";

function normalizeId(value) {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return String(value?._id || value?.id || "");
}

function formatConversationLabel(conversation) {
  const peer = conversation?.otherParticipant;
  const businessName = peer?.businessName?.trim();
  const name = peer?.name?.trim();
  if (businessName && name && businessName !== name) return `${businessName} (${name})`;
  return businessName || name || "Conversation";
}

export default function Messages() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.global.user);
  const userId = normalizeId(user);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef(null);

  const conversationsQ = useListConversationsQuery(undefined, {
    pollingInterval: 15000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const conversations = conversationsQ.data?.conversations || [];

  const activeConversationId = useMemo(() => {
    if (conversationId) return conversationId;
    return conversations[0]?._id || "";
  }, [conversationId, conversations]);

  useEffect(() => {
    if (!conversationId && conversations[0]?._id) {
      navigate(`/messages/${conversations[0]._id}`, { replace: true });
    }
  }, [conversationId, conversations, navigate]);

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => normalizeId(conversation._id) === activeConversationId,
      ) || null,
    [activeConversationId, conversations],
  );

  const messagesQ = useGetConversationMessagesQuery(activeConversationId, {
    skip: !activeConversationId,
    pollingInterval: 5000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const [sendMessage, { isLoading: isSending }] = useSendConversationMessageMutation();

  useEffect(() => {
    if (!messagesQ.data?.messages) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messagesQ.data?.messages]);

  const eventTitle = activeConversation?.event?.title || messagesQ.data?.conversation?.event?.title || "";
  const eventId = activeConversation?.event?.id || messagesQ.data?.conversation?.event?.id || "";
  const communityId =
    activeConversation?.community?.id || messagesQ.data?.conversation?.community?.id || "";
  const peer = activeConversation?.otherParticipant || messagesQ.data?.conversation?.otherParticipant || null;

  return (
    <Box p={{ xs: 2, md: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Messages
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        One-to-one chat opens automatically when an event owner accepts a business bid.
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          minHeight: "70vh",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "320px 1fr" },
          overflow: "hidden",
        }}
      >
        <Box sx={{ borderRight: { md: "1px solid", xs: "none" }, borderColor: "divider" }}>
          <Box px={2} py={1.5}>
            <Typography variant="subtitle1" fontWeight={700}>
              Conversations
            </Typography>
          </Box>
          <Divider />
          {conversationsQ.error ? (
            <Alert severity="error" sx={{ m: 2 }}>
              {conversationsQ.error?.data?.message || "Failed to load conversations"}
            </Alert>
          ) : null}
          <List disablePadding>
            {conversations.map((conversation) => {
              const isActive =
                normalizeId(conversation._id) === normalizeId(activeConversationId);
              return (
                <ListItemButton
                  key={conversation._id}
                  selected={isActive}
                  onClick={() => navigate(`/messages/${conversation._id}`)}
                  sx={{ alignItems: "flex-start", py: 1.5 }}
                >
                  <ListItemText
                    primary={formatConversationLabel(conversation)}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.secondary">
                          {conversation.event?.title || "Event chat"}
                        </Typography>
                        <br />
                        <Typography component="span" variant="caption" color="text.secondary">
                          {conversation.lastMessageText || "No messages yet"}
                        </Typography>
                      </>
                    }
                    primaryTypographyProps={{ fontWeight: isActive ? 700 : 600 }}
                  />
                </ListItemButton>
              );
            })}
          </List>
          {!conversationsQ.isLoading && conversations.length === 0 ? (
            <Typography color="text.secondary" px={2} py={2}>
              No conversations yet.
            </Typography>
          ) : null}
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          {activeConversationId ? (
            <>
              <Box px={2.5} py={2} borderBottom="1px solid" borderColor="divider">
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar
                    src={toAbsoluteMediaUrl(peer?.avatarUrl || "") || undefined}
                    alt={peer?.name || "User"}
                  >
                    {(peer?.name || "U").charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography fontWeight={700}>
                      {formatConversationLabel(activeConversation || messagesQ.data?.conversation)}
                    </Typography>
                    {communityId && eventId ? (
                      <Button
                        size="small"
                        sx={{ px: 0, minWidth: 0, textTransform: "none" }}
                        onClick={() =>
                          navigate(
                            `/communities/${communityId}?tab=events&viewEvent=${eventId}`,
                          )
                        }
                      >
                        {eventTitle || "Accepted bid chat"}
                      </Button>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {eventTitle || "Accepted bid chat"}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Box>

              <Box
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  px: 2.5,
                  py: 2,
                  backgroundColor: "background.default",
                }}
              >
                {messagesQ.error ? (
                  <Alert severity="error">
                    {messagesQ.error?.data?.message || "Failed to load messages"}
                  </Alert>
                ) : null}
                <Stack spacing={1.5}>
                  {(messagesQ.data?.messages || []).map((message) => {
                    const isOwn = normalizeId(message.sender?.id) === userId;
                    return (
                      <Stack
                        key={message._id}
                        alignItems={isOwn ? "flex-end" : "flex-start"}
                      >
                        <Paper
                          elevation={0}
                          sx={{
                            px: 1.5,
                            py: 1.25,
                            maxWidth: "80%",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: isOwn ? "primary.main" : "divider",
                            backgroundColor: isOwn ? "primary.main" : "background.paper",
                            color: isOwn ? "primary.contrastText" : "text.primary",
                          }}
                        >
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            {message.sender?.businessName || message.sender?.name || "User"}
                          </Typography>
                          <Typography whiteSpace="pre-wrap">{message.text}</Typography>
                          <Typography
                            variant="caption"
                            display="block"
                            sx={{ mt: 0.5, opacity: 0.75 }}
                          >
                            {new Date(message.createdAt).toLocaleString()}
                          </Typography>
                        </Paper>
                      </Stack>
                    );
                  })}
                  {!messagesQ.isLoading && (messagesQ.data?.messages || []).length === 0 ? (
                    <Typography color="text.secondary">
                      No messages yet. Start the conversation here.
                    </Typography>
                  ) : null}
                  <div ref={bottomRef} />
                </Stack>
              </Box>

              <Box px={2.5} py={2} borderTop="1px solid" borderColor="divider">
                <Stack direction="row" spacing={1.5} alignItems="flex-end">
                  <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    label="Message"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                  />
                  <Button
                    variant="contained"
                    endIcon={<SendOutlined />}
                    disabled={isSending || !draft.trim()}
                    onClick={async () => {
                      try {
                        await sendMessage({
                          conversationId: activeConversationId,
                          text: draft.trim(),
                        }).unwrap();
                        setDraft("");
                      } catch (error) {
                        toast.error(
                          getApiErrorMessage(error, "Failed to send message"),
                        );
                      }
                    }}
                  >
                    Send
                  </Button>
                </Stack>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: 3,
              }}
            >
              <Typography color="text.secondary">
                Select a conversation to view messages.
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
