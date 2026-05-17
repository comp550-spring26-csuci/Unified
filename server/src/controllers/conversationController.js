const { z } = require('zod');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

function normalizeId(value) {
  if (!value) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return String(value?._id || value?.id || '');
}

function participantPlain(user) {
  if (!user) return null;
  return {
    id: normalizeId(user),
    name: user.name || '',
    role: user.role || '',
    avatarUrl: user.avatarUrl || '',
    businessName: user.businessProfile?.businessName || '',
  };
}

function serializeConversation(conversation, viewerId) {
  const plain =
    typeof conversation?.toObject === 'function'
      ? conversation.toObject({ virtuals: true })
      : JSON.parse(JSON.stringify(conversation));
  const viewerKey = normalizeId(viewerId);
  const participants = Array.isArray(plain.participants)
    ? plain.participants.map(participantPlain).filter(Boolean)
    : [];
  const otherParticipant = participants.find((participant) => participant.id !== viewerKey) || participants[0] || null;

  return {
    _id: plain._id,
    community: plain.community
      ? {
          id: normalizeId(plain.community),
          name: plain.community.name || '',
        }
      : null,
    event: plain.event
      ? {
          id: normalizeId(plain.event),
          title: plain.event.title || '',
          date: plain.event.date || null,
          venue: plain.event.venue || '',
        }
      : null,
    acceptedBidId: normalizeId(plain.acceptedBid),
    participants,
    otherParticipant,
    createdBy: normalizeId(plain.createdBy),
    lastMessageText: plain.lastMessageText || '',
    lastMessageAt: plain.lastMessageAt || plain.updatedAt || plain.createdAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function serializeMessage(message) {
  const plain =
    typeof message?.toObject === 'function'
      ? message.toObject({ virtuals: true })
      : JSON.parse(JSON.stringify(message));
  return {
    _id: plain._id,
    text: plain.text || '',
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    sender: plain.sender
      ? {
          id: normalizeId(plain.sender),
          name: plain.sender.name || '',
          role: plain.sender.role || '',
          avatarUrl: plain.sender.avatarUrl || '',
          businessName: plain.sender.businessProfile?.businessName || '',
        }
      : null,
  };
}

async function findAuthorizedConversation(conversationId, userId) {
  const conversation = await Conversation.findById(conversationId)
    .populate('community', 'name')
    .populate('event', 'title date venue')
    .populate('participants', 'name role avatarUrl businessProfile');
  if (!conversation) return { ok: false, status: 404, message: 'Conversation not found' };
  const isParticipant = (conversation.participants || []).some(
    (participant) => normalizeId(participant) === String(userId),
  );
  if (!isParticipant) return { ok: false, status: 403, message: 'Forbidden' };
  return { ok: true, conversation };
}

async function listMyConversations(req, res) {
  const conversations = await Conversation.find({ participants: req.auth.sub })
    .populate('community', 'name')
    .populate('event', 'title date venue')
    .populate('participants', 'name role avatarUrl businessProfile')
    .sort({ lastMessageAt: -1, updatedAt: -1, createdAt: -1 })
    .limit(100);

  return res.json({
    conversations: conversations.map((conversation) => serializeConversation(conversation, req.auth.sub)),
  });
}

async function getConversationMessages(req, res) {
  const { conversationId } = req.params;
  const auth = await findAuthorizedConversation(conversationId, req.auth.sub);
  if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

  const messages = await Message.find({ conversation: conversationId })
    .populate('sender', 'name role avatarUrl businessProfile')
    .sort({ createdAt: 1 })
    .limit(500);

  return res.json({
    conversation: serializeConversation(auth.conversation, req.auth.sub),
    messages: messages.map(serializeMessage),
  });
}

const createMessageSchema = z.object({
  text: z.string().trim().min(1).max(4000),
});

async function sendConversationMessage(req, res) {
  const { conversationId } = req.params;
  const auth = await findAuthorizedConversation(conversationId, req.auth.sub);
  if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

  const parsed = createMessageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input', errors: parsed.error.issues });

  const message = await Message.create({
    conversation: conversationId,
    sender: req.auth.sub,
    text: parsed.data.text,
  });

  auth.conversation.lastMessageText = parsed.data.text;
  auth.conversation.lastMessageAt = message.createdAt;
  await auth.conversation.save();

  const populatedMessage = await Message.findById(message._id).populate(
    'sender',
    'name role avatarUrl businessProfile',
  );
  const refreshedConversation = await Conversation.findById(conversationId)
    .populate('community', 'name')
    .populate('event', 'title date venue')
    .populate('participants', 'name role avatarUrl businessProfile');

  return res.status(201).json({
    conversation: serializeConversation(refreshedConversation, req.auth.sub),
    message: serializeMessage(populatedMessage),
  });
}

module.exports = {
  listMyConversations,
  getConversationMessages,
  sendConversationMessage,
};
