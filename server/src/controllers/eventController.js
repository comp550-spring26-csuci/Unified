const { z } = require('zod');
const Community = require('../models/Community');
const Membership = require('../models/Membership');
const Event = require('../models/Event');
const Post = require('../models/Post');
const User = require('../models/User');

const ROLE_BUSINESS_OWNER = 'business_owner';

const EVENT_POPULATE = [
  { path: 'community', select: 'name status createdBy' },
  { path: 'createdBy', select: 'name role avatarUrl businessProfile' },
  { path: 'attendees', select: 'name' },
  { path: 'volunteers', select: 'name' },
  {
    path: 'businessBids.businessOwner',
    select: 'name email role avatarUrl businessProfile',
  },
];

/** Community feed announcement for a new event (Post.text maxlength 5000). */
function buildEventAnnouncementPostText(data, agendaItemCount = 0) {
  const lines = [];
  lines.push(`New event: ${data.title}`);
  lines.push('');
  lines.push(
    `When: ${data.date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`,
  );
  if (data.endDate) {
    lines.push(
      `Ends: ${data.endDate.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`,
    );
  }
  lines.push(`Where: ${data.venue}`);
  if (data.capacity > 0) {
    lines.push(`Capacity: ${data.capacity} attendees`);
  }
  const extras = [];
  if (data.whoFor?.trim()) extras.push(`Who it's for: ${data.whoFor.trim()}`);
  if (data.whatToBring?.trim()) extras.push(`What to bring: ${data.whatToBring.trim()}`);
  if (data.volunteerRequirements?.trim()) {
    extras.push(`Volunteer needs: ${data.volunteerRequirements.trim()}`);
  }
  if (data.businessParticipationRequired) {
    if (Array.isArray(data.businessCategoriesNeeded) && data.businessCategoriesNeeded.length) {
      extras.push(`Business types needed: ${data.businessCategoriesNeeded.join(', ')}`);
    }
    if (data.businessRequirements?.trim()) {
      extras.push(`Business requirements: ${data.businessRequirements.trim()}`);
    }
    if (data.biddingDeadline) {
      extras.push(
        `Business bidding deadline: ${data.biddingDeadline.toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}`,
      );
    }
  }
  if (extras.length) {
    lines.push('');
    lines.push(extras.join('\n\n'));
  }
  if (data.description?.trim()) {
    lines.push('');
    lines.push(data.description.trim());
  }
  if (agendaItemCount > 0) {
    lines.push('');
    lines.push(`Agenda: ${agendaItemCount} item(s). Open Events for the full schedule.`);
  }
  lines.push('');
  lines.push('Open the Events tab in this community to RSVP, volunteer, or view full details.');

  let text = lines.join('\n');
  if (text.length > 5000) {
    text = `${text.slice(0, 4994).trimEnd()}\n...`;
  }
  return text;
}

function normalizeId(value) {
  if (!value) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return String(value?._id || value?.id || '');
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseBooleanish(raw) {
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'string') {
    const value = raw.trim().toLowerCase();
    if (value === 'true' || value === '1' || value === 'yes' || value === 'on') return true;
    if (value === 'false' || value === '0' || value === 'no' || value === 'off' || value === '') return false;
  }
  return raw;
}

function parseStringList(raw) {
  if (raw === undefined || raw === null || raw === '') return [];
  if (Array.isArray(raw)) {
    return raw
      .flatMap((item) => String(item || '').split(','))
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function applyEventPopulate(query) {
  let populated = query;
  for (const item of EVENT_POPULATE) {
    populated = populated.populate(item);
  }
  return populated;
}

function hasBidDeadlinePassed(event, now = Date.now()) {
  if (!event?.biddingDeadline) return false;
  const deadlineMs = new Date(event.biddingDeadline).getTime();
  if (Number.isNaN(deadlineMs)) return false;
  return deadlineMs <= now;
}

function isBusinessBidSubmissionOpen(event, now = Date.now()) {
  return Boolean(
    event?.businessParticipationRequired &&
      event?.biddingDeadline &&
      !event?.acceptedBusinessBidId &&
      !hasBidDeadlinePassed(event, now),
  );
}

function serializeAcceptedBid(bid, { viewerId, isEventCreator }) {
  if (!bid) return null;
  const plain = {
    _id: bid._id,
    status: 'accepted',
    businessName: bid.businessName || '',
    businessLocation: bid.businessLocation || '',
    businessCategory: bid.businessCategory || '',
    createdAt: bid.createdAt,
    updatedAt: bid.updatedAt,
  };

  const bidOwnerId = normalizeId(bid.businessOwner);
  if (bidOwnerId) {
    plain.businessOwner = {
      id: bidOwnerId,
      name: bid.businessOwner?.name || '',
    };
  }

  if (isEventCreator || bidOwnerId === normalizeId(viewerId)) {
    plain.proposal = bid.proposal || '';
    plain.pricing = bid.pricing || '';
    plain.additionalNotes = bid.additionalNotes || '';
    if (bid.businessOwner?.email) {
      plain.businessOwner = {
        ...(plain.businessOwner || { id: bidOwnerId }),
        email: bid.businessOwner.email,
      };
    }
  }

  return plain;
}

function serializeVisibleBid(bid, { viewerId, isEventCreator, acceptedBidId }) {
  const bidId = normalizeId(bid._id);
  const bidOwnerId = normalizeId(bid.businessOwner);
  const isAccepted = bidId === acceptedBidId;
  const visible = {
    _id: bid._id,
    status: isAccepted ? 'accepted' : bid.status || 'pending',
    proposal: bid.proposal || '',
    pricing: bid.pricing || '',
    additionalNotes: bid.additionalNotes || '',
    createdAt: bid.createdAt,
    updatedAt: bid.updatedAt,
    businessName: bid.businessName || '',
    businessLocation: bid.businessLocation || '',
    businessCategory: bid.businessCategory || '',
  };

  if (bidOwnerId) {
    visible.businessOwner = {
      id: bidOwnerId,
      name: bid.businessOwner?.name || '',
    };
  }

  if (isEventCreator && bid.businessOwner?.email) {
    visible.businessOwner = {
      ...(visible.businessOwner || { id: bidOwnerId }),
      email: bid.businessOwner.email,
    };
  }

  if (!isEventCreator && bidOwnerId !== normalizeId(viewerId)) {
    delete visible.pricing;
    delete visible.additionalNotes;
    delete visible.proposal;
  }

  return visible;
}

function serializeEventForViewer(event, viewerId) {
  const plain =
    typeof event?.toObject === 'function' ? event.toObject({ virtuals: true }) : JSON.parse(JSON.stringify(event));
  const viewerKey = normalizeId(viewerId);
  const eventCreatorId = normalizeId(plain.createdBy);
  const isEventCreator = viewerKey && eventCreatorId === viewerKey;
  const allBids = Array.isArray(plain.businessBids) ? plain.businessBids : [];
  const acceptedBidId = normalizeId(plain.acceptedBusinessBidId);
  const myBid = viewerKey
    ? allBids.find((bid) => normalizeId(bid.businessOwner) === viewerKey) || null
    : null;
  const acceptedBid =
    acceptedBidId && allBids.length
      ? allBids.find((bid) => normalizeId(bid._id) === acceptedBidId) || null
      : null;

  plain.businessBidCount = allBids.length;
  plain.biddingDeadlinePassed = hasBidDeadlinePassed(plain);
  plain.biddingClosed = Boolean(acceptedBidId) || plain.biddingDeadlinePassed;
  plain.businessBidSubmissionOpen = isBusinessBidSubmissionOpen(plain);
  plain.userCanManageBusinessBids = isEventCreator;
  plain.acceptedBusinessBid = serializeAcceptedBid(acceptedBid, { viewerId, isEventCreator });
  plain.myBusinessBid = myBid
    ? serializeVisibleBid(myBid, { viewerId, isEventCreator: false, acceptedBidId })
    : null;

  if (isEventCreator) {
    plain.businessBids = allBids.map((bid) =>
      serializeVisibleBid(bid, { viewerId, isEventCreator: true, acceptedBidId }),
    );
  } else if (myBid) {
    plain.businessBids = [
      serializeVisibleBid(myBid, {
        viewerId,
        isEventCreator: false,
        acceptedBidId,
      }),
    ];
  } else {
    plain.businessBids = [];
  }

  return plain;
}

function serializeEventsForViewer(events, viewerId) {
  return (events || []).map((event) => serializeEventForViewer(event, viewerId));
}

async function requireApprovedMember(userId, communityId) {
  const community = await Community.findById(communityId);
  if (!community) return { ok: false, status: 404, message: 'Community not found' };
  if (community.status !== 'approved') return { ok: false, status: 403, message: 'Community not approved' };
  const membership = await Membership.findOne({ user: userId, community: communityId, status: 'approved' });
  if (!membership) return { ok: false, status: 403, message: 'Membership required' };
  return { ok: true, community };
}

async function getBusinessOwnerOrReject(userId) {
  const user = await User.findById(userId);
  if (!user) return { ok: false, status: 404, message: 'User not found' };
  if (user.status === 'banned') return { ok: false, status: 403, message: 'Account is banned' };
  if (user.role !== ROLE_BUSINESS_OWNER) {
    return { ok: false, status: 403, message: 'Only business owners can access this feature' };
  }
  const businessName = user.businessProfile?.businessName?.trim() || '';
  const businessLocation = user.businessProfile?.businessLocation?.trim() || '';
  const businessCategory = user.businessProfile?.businessCategory?.trim() || '';
  if (!businessName || !businessLocation || !businessCategory) {
    return {
      ok: false,
      status: 400,
      message: 'Complete your business profile before bidding on events',
    };
  }
  return { ok: true, user };
}

const agendaItemSchema = z.object({
  title: z.string().max(200).optional().default(''),
  durationMinutes: z.coerce.number().int().min(1).max(24 * 60),
  gapBeforeMinutes: z.coerce.number().int().min(0).optional().default(0),
});

const agendaSchema = z
  .object({
    startOffsetMinutes: z.coerce.number().int().min(0).optional().default(0),
    items: z.array(agendaItemSchema).max(100).optional().default([]),
  })
  .optional();

const createSchema = z
  .object({
    title: z.string().min(2).max(120),
    description: z.string().max(5000).optional().default(''),
    whoFor: z.string().max(2000).optional().default(''),
    whatToBring: z.string().max(2000).optional().default(''),
    volunteerRequirements: z.string().max(2000).optional().default(''),
    date: z.coerce.date(),
    endDate: z.preprocess((raw) => {
      if (raw === undefined || raw === null || raw === '') return undefined;
      return raw;
    }, z.coerce.date().optional()),
    venue: z.string().min(2).max(300),
    capacity: z.coerce.number().int().min(0).optional().default(0),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    agenda: z
      .preprocess((raw) => {
        if (raw === undefined || raw === null || raw === '') return undefined;
        if (typeof raw === 'string') {
          try {
            return JSON.parse(raw);
          } catch {
            return undefined;
          }
        }
        return raw;
      }, agendaSchema)
      .optional(),
    businessParticipationRequired: z.preprocess(
      parseBooleanish,
      z.boolean().optional().default(false),
    ),
    businessCategoriesNeeded: z
      .preprocess(parseStringList, z.array(z.string().min(1).max(80)).max(20).optional().default([])),
    businessRequirements: z.string().max(2000).optional().default(''),
    biddingDeadline: z.preprocess((raw) => {
      if (raw === undefined || raw === null || raw === '') return undefined;
      return raw;
    }, z.coerce.date().optional()),
  })
  .superRefine((data, ctx) => {
    const hasLatitude = data.latitude !== undefined;
    const hasLongitude = data.longitude !== undefined;
    if (hasLatitude !== hasLongitude) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Both latitude and longitude are required when selecting a map location',
        path: hasLatitude ? ['longitude'] : ['latitude'],
      });
    }
    if (data.endDate !== undefined && data.endDate.getTime() < data.date.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End time must be on or after the start date and time',
        path: ['endDate'],
      });
    }
    if (data.date.getTime() < Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Event start date and time must be in the future',
        path: ['date'],
      });
    }
    if (data.businessParticipationRequired) {
      if (!data.businessCategoriesNeeded.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'At least one business category is required',
          path: ['businessCategoriesNeeded'],
        });
      }
      if (!data.biddingDeadline) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'A bidding deadline is required when business participation is enabled',
          path: ['biddingDeadline'],
        });
      } else {
        if (data.biddingDeadline.getTime() <= Date.now()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Bidding deadline must be in the future',
            path: ['biddingDeadline'],
          });
        }
        if (data.biddingDeadline.getTime() > data.date.getTime()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Bidding deadline must be on or before the event start time',
            path: ['biddingDeadline'],
          });
        }
      }
    }
  });

const bidSchema = z.object({
  proposal: z.string().min(10).max(4000),
  pricing: z.string().max(200).optional().default(''),
  additionalNotes: z.string().max(2000).optional().default(''),
});

async function listMyEvents(req, res) {
  const userId = req.auth.sub;
  const memberships = await Membership.find({ user: userId, community: { $exists: true }, status: 'approved' })
    .select('community')
    .lean();
  const communityIds = [...new Set(memberships.map((m) => m.community).filter(Boolean).map(String))];
  if (communityIds.length === 0) {
    return res.json({ created: [], attending: [], volunteering: [] });
  }

  const inCommunities = { community: { $in: communityIds } };

  const [created, attending, volunteering] = await Promise.all([
    applyEventPopulate(
      Event.find({ ...inCommunities, createdBy: userId }).sort({ date: 1 }).limit(200),
    ),
    applyEventPopulate(
      Event.find({ ...inCommunities, attendees: userId }).sort({ date: 1 }).limit(200),
    ),
    applyEventPopulate(
      Event.find({ ...inCommunities, volunteers: userId }).sort({ date: 1 }).limit(200),
    ),
  ]);

  return res.json({
    created: serializeEventsForViewer(created, userId),
    attending: serializeEventsForViewer(attending, userId),
    volunteering: serializeEventsForViewer(volunteering, userId),
  });
}

/** Upcoming events in member communities for discovering volunteer sign-ups. */
async function listVolunteerOpportunities(req, res) {
  const userId = req.auth.sub;
  const memberships = await Membership.find({ user: userId, status: 'approved' })
    .select('community')
    .lean();
  let communityIds = [...new Set(memberships.map((m) => m.community).filter(Boolean).map(String))];
  if (communityIds.length === 0) {
    return res.json({ events: [] });
  }

  const { q, from, to, communityId } = req.query;
  if (communityId && String(communityId).trim()) {
    const cid = String(communityId).trim();
    if (!communityIds.includes(cid)) {
      return res.status(403).json({ message: 'Not a member of that community' });
    }
    communityIds = [cid];
  }

  const now = new Date();
  const filter = {
    community: { $in: communityIds },
    isDeleted: { $ne: true },
    date: { $gte: now },
  };

  if (from) {
    const fromDate = new Date(from);
    if (!Number.isNaN(fromDate.getTime())) {
      filter.date = { ...filter.date, $gte: new Date(Math.max(now.getTime(), fromDate.getTime())) };
    }
  }
  if (to) {
    const toDate = new Date(to);
    if (!Number.isNaN(toDate.getTime())) {
      filter.date = { ...filter.date, $lte: toDate };
    }
  }

  const searchText = typeof q === 'string' ? q.trim() : '';
  if (searchText) {
    const rx = new RegExp(escapeRegex(searchText), 'i');
    filter.$or = [{ title: rx }, { description: rx }, { volunteerRequirements: rx }];
  }

  const events = await applyEventPopulate(Event.find(filter).sort({ date: 1 }).limit(300));

  return res.json({ events: serializeEventsForViewer(events, userId) });
}

async function listBusinessOpportunities(req, res) {
  const businessAuth = await getBusinessOwnerOrReject(req.auth.sub);
  if (!businessAuth.ok) return res.status(businessAuth.status).json({ message: businessAuth.message });

  const { q, from, to, communityId } = req.query;
  const businessCategory = String(businessAuth.user.businessProfile?.businessCategory || '').trim();
  const communityFilter = { status: 'approved' };
  if (communityId && String(communityId).trim()) {
    communityFilter._id = String(communityId).trim();
  }

  const approvedCommunities = await Community.find(communityFilter).select('_id').lean();
  const approvedCommunityIds = approvedCommunities.map((item) => String(item._id));
  if (!approvedCommunityIds.length) {
    return res.json({ events: [] });
  }

  const now = new Date();
  const filter = {
    community: { $in: approvedCommunityIds },
    isDeleted: { $ne: true },
    businessParticipationRequired: true,
    date: { $gte: now },
    businessCategoriesNeeded: new RegExp(`^${escapeRegex(businessCategory)}$`, 'i'),
  };

  if (from) {
    const fromDate = new Date(from);
    if (!Number.isNaN(fromDate.getTime())) {
      filter.date = { ...filter.date, $gte: new Date(Math.max(now.getTime(), fromDate.getTime())) };
    }
  }
  if (to) {
    const toDate = new Date(to);
    if (!Number.isNaN(toDate.getTime())) {
      filter.date = { ...filter.date, $lte: toDate };
    }
  }

  const searchText = typeof q === 'string' ? q.trim() : '';
  if (searchText) {
    const rx = new RegExp(escapeRegex(searchText), 'i');
    filter.$or = [
      { title: rx },
      { description: rx },
      { venue: rx },
      { businessRequirements: rx },
      { businessCategoriesNeeded: rx },
    ];
  }

  const events = await applyEventPopulate(Event.find(filter).sort({ date: 1 }).limit(300));
  return res.json({ events: serializeEventsForViewer(events, req.auth.sub) });
}

async function listCommunityEvents(req, res) {
  const { communityId } = req.params;
  const auth = await requireApprovedMember(req.auth.sub, communityId);
  if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

  const events = await applyEventPopulate(
    Event.find({ community: communityId, isDeleted: { $ne: true } }).sort({ date: 1 }).limit(200),
  );
  return res.json({ events: serializeEventsForViewer(events, req.auth.sub) });
}

async function createEvent(req, res) {
  const { communityId } = req.params;
  const auth = await requireApprovedMember(req.auth.sub, communityId);
  if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input', errors: parsed.error.issues });

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl || '';

  const agenda =
    parsed.data.agenda && parsed.data.agenda.items?.length
      ? {
          startOffsetMinutes: parsed.data.agenda.startOffsetMinutes ?? 0,
          items: parsed.data.agenda.items.map((it) => ({
            title: it.title ?? '',
            durationMinutes: it.durationMinutes,
            gapBeforeMinutes: it.gapBeforeMinutes ?? 0,
          })),
        }
      : undefined;

  const businessData = parsed.data.businessParticipationRequired
    ? {
        businessParticipationRequired: true,
        businessCategoriesNeeded: parsed.data.businessCategoriesNeeded,
        businessRequirements: parsed.data.businessRequirements || '',
        biddingDeadline: parsed.data.biddingDeadline,
      }
    : {
        businessParticipationRequired: false,
        businessCategoriesNeeded: [],
        businessRequirements: '',
      };

  const event = await Event.create({
    community: communityId,
    createdBy: req.auth.sub,
    title: parsed.data.title,
    description: parsed.data.description,
    whoFor: parsed.data.whoFor ?? '',
    whatToBring: parsed.data.whatToBring ?? '',
    volunteerRequirements: parsed.data.volunteerRequirements ?? '',
    date: parsed.data.date,
    ...(parsed.data.endDate !== undefined ? { endDate: parsed.data.endDate } : {}),
    venue: parsed.data.venue,
    capacity: parsed.data.capacity,
    location:
      parsed.data.latitude !== undefined && parsed.data.longitude !== undefined
        ? { lat: parsed.data.latitude, lng: parsed.data.longitude }
        : undefined,
    imageUrl,
    ...(agenda ? { agenda } : {}),
    ...businessData,
    businessBids: [],
    attendees: [],
    volunteers: [],
  });

  const agendaItemCount = agenda?.items?.length ?? 0;
  const postText = buildEventAnnouncementPostText(parsed.data, agendaItemCount);
  try {
    await Post.create({
      community: communityId,
      author: req.auth.sub,
      text: postText,
      event: event._id,
      images: imageUrl ? [imageUrl] : [],
      likes: [],
    });
  } catch (err) {
    await Event.findByIdAndDelete(event._id);
    console.error('Failed to create community post for new event', err);
    return res.status(500).json({ message: 'Could not publish the event to the community feed' });
  }

  const populated = await applyEventPopulate(Event.findById(event._id));
  return res.status(201).json({ event: serializeEventForViewer(populated, req.auth.sub) });
}

function businessConfigHasChanged(existingEvent, parsedData) {
  const existingRequired = Boolean(existingEvent.businessParticipationRequired);
  const nextRequired = Boolean(parsedData.businessParticipationRequired);
  const existingCategories = parseStringList(existingEvent.businessCategoriesNeeded || []);
  const nextCategories = parsedData.businessCategoriesNeeded || [];
  const existingRequirements = String(existingEvent.businessRequirements || '').trim();
  const nextRequirements = String(parsedData.businessRequirements || '').trim();
  const existingDeadline = existingEvent.biddingDeadline
    ? new Date(existingEvent.biddingDeadline).toISOString()
    : '';
  const nextDeadline = parsedData.biddingDeadline ? parsedData.biddingDeadline.toISOString() : '';

  return (
    existingRequired !== nextRequired ||
    existingCategories.join('|') !== nextCategories.join('|') ||
    existingRequirements !== nextRequirements ||
    existingDeadline !== nextDeadline
  );
}

async function updateEvent(req, res) {
  const { communityId, eventId } = req.params;
  const auth = await requireApprovedMember(req.auth.sub, communityId);
  if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

  const event = await Event.findOne({ _id: eventId, community: communityId });
  if (!event) return res.status(404).json({ message: 'Event not found' });

  if (String(event.createdBy) !== String(req.auth.sub)) {
    return res.status(403).json({ message: 'Only the event owner can edit this event' });
  }

  if (new Date(event.date).getTime() < Date.now()) {
    return res.status(403).json({ message: 'Past events cannot be edited' });
  }

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input', errors: parsed.error.issues });

  const biddingConfigLocked =
    Boolean(event.acceptedBusinessBidId) ||
    (Array.isArray(event.businessBids) && event.businessBids.length > 0) ||
    hasBidDeadlinePassed(event);

  if (biddingConfigLocked && businessConfigHasChanged(event, parsed.data)) {
    return res.status(409).json({
      message:
        'Business bidding settings cannot be changed after bidding has started, closed, or been accepted',
    });
  }

  const agenda =
    parsed.data.agenda && parsed.data.agenda.items?.length
      ? {
          startOffsetMinutes: parsed.data.agenda.startOffsetMinutes ?? 0,
          items: parsed.data.agenda.items.map((it) => ({
            title: it.title ?? '',
            durationMinutes: it.durationMinutes,
            gapBeforeMinutes: it.gapBeforeMinutes ?? 0,
          })),
        }
      : undefined;

  let imageUrl = event.imageUrl || '';
  if (req.file) {
    imageUrl = `/uploads/${req.file.filename}`;
  } else if (req.body.imageUrl !== undefined && req.body.imageUrl !== '') {
    imageUrl = String(req.body.imageUrl);
  }

  const $set = {
    title: parsed.data.title,
    description: parsed.data.description,
    whoFor: parsed.data.whoFor ?? '',
    whatToBring: parsed.data.whatToBring ?? '',
    volunteerRequirements: parsed.data.volunteerRequirements ?? '',
    date: parsed.data.date,
    venue: parsed.data.venue,
    capacity: parsed.data.capacity,
    imageUrl,
  };

  const $unset = {};

  if (parsed.data.endDate !== undefined) {
    $set.endDate = parsed.data.endDate;
  } else {
    $unset.endDate = '';
  }

  if (parsed.data.latitude !== undefined && parsed.data.longitude !== undefined) {
    $set.location = { lat: parsed.data.latitude, lng: parsed.data.longitude };
  } else {
    $unset.location = '';
  }

  if (agenda) {
    $set.agenda = agenda;
  } else {
    $unset.agenda = '';
  }

  if (parsed.data.businessParticipationRequired) {
    $set.businessParticipationRequired = true;
    $set.businessCategoriesNeeded = parsed.data.businessCategoriesNeeded;
    $set.businessRequirements = parsed.data.businessRequirements || '';
    $set.biddingDeadline = parsed.data.biddingDeadline;
  } else {
    $set.businessParticipationRequired = false;
    $set.businessCategoriesNeeded = [];
    $set.businessRequirements = '';
    $unset.biddingDeadline = '';
  }

  const update = Object.keys($unset).length ? { $set, $unset } : { $set };

  const populated = await applyEventPopulate(
    Event.findOneAndUpdate({ _id: eventId, community: communityId }, update, {
      new: true,
      runValidators: true,
    }),
  );

  if (!populated) return res.status(404).json({ message: 'Event not found' });

  return res.json({ event: serializeEventForViewer(populated, req.auth.sub) });
}

async function deleteEvent(req, res) {
  const { communityId, eventId } = req.params;
  const auth = await requireApprovedMember(req.auth.sub, communityId);
  if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

  const event = await Event.findOne({ _id: eventId, community: communityId });
  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (event.isDeleted) return res.status(404).json({ message: 'Event not found' });

  const isEventOwner = String(event.createdBy) === String(req.auth.sub);
  const isCommunityOwner = String(auth.community?.createdBy || '') === String(req.auth.sub);
  if (!isEventOwner && !isCommunityOwner) {
    return res.status(403).json({ message: 'Only the event creator or community owner can delete this event' });
  }

  event.isDeleted = true;
  event.deletedAt = new Date();
  event.deletedBy = req.auth.sub;
  await event.save();

  await Post.deleteMany({ community: communityId, event: event._id });

  return res.json({ success: true, event });
}

async function rsvp(req, res) {
  const { communityId, eventId } = req.params;
  const auth = await requireApprovedMember(req.auth.sub, communityId);
  if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

  const event = await Event.findOne({ _id: eventId, community: communityId });
  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (event.isDeleted) return res.status(404).json({ message: 'Event not found' });

  const uid = String(req.auth.sub);
  const isAttending = event.attendees.map(String).includes(uid);

  if (isAttending) {
    event.attendees = event.attendees.filter((x) => String(x) !== uid);
  } else {
    if (event.capacity > 0 && event.attendees.length >= event.capacity) {
      return res.status(409).json({ message: 'Event capacity reached' });
    }
    event.attendees.push(req.auth.sub);
  }

  await event.save();
  return res.json({ attendeeCount: event.attendees.length, attending: !isAttending });
}

async function volunteer(req, res) {
  const { communityId, eventId } = req.params;
  const auth = await requireApprovedMember(req.auth.sub, communityId);
  if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

  const event = await Event.findOne({ _id: eventId, community: communityId });
  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (event.isDeleted) return res.status(404).json({ message: 'Event not found' });

  const uid = String(req.auth.sub);
  const isVol = event.volunteers.map(String).includes(uid);
  if (isVol) event.volunteers = event.volunteers.filter((x) => String(x) !== uid);
  else event.volunteers.push(req.auth.sub);
  await event.save();

  return res.json({ volunteerCount: event.volunteers.length, volunteering: !isVol });
}

async function submitBusinessBid(req, res) {
  const { communityId, eventId } = req.params;
  const businessAuth = await getBusinessOwnerOrReject(req.auth.sub);
  if (!businessAuth.ok) return res.status(businessAuth.status).json({ message: businessAuth.message });

  const community = await Community.findById(communityId).select('status');
  if (!community) return res.status(404).json({ message: 'Community not found' });
  if (community.status !== 'approved') {
    return res.status(403).json({ message: 'Community not approved' });
  }

  const event = await Event.findOne({ _id: eventId, community: communityId, isDeleted: { $ne: true } });
  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (!event.businessParticipationRequired) {
    return res.status(409).json({ message: 'This event is not accepting business bids' });
  }
  if (new Date(event.date).getTime() <= Date.now()) {
    return res.status(409).json({ message: 'This event has already started' });
  }
  if (event.acceptedBusinessBidId) {
    return res.status(409).json({ message: 'A bid has already been accepted for this event' });
  }
  if (!isBusinessBidSubmissionOpen(event)) {
    return res.status(409).json({ message: 'Bidding is closed for this event' });
  }

  const parsed = bidSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input', errors: parsed.error.issues });

  const bidOwnerId = String(req.auth.sub);
  const existingBid = event.businessBids.find((bid) => normalizeId(bid.businessOwner) === bidOwnerId);
  const businessProfile = businessAuth.user.businessProfile || {};

  if (existingBid) {
    existingBid.businessName = businessProfile.businessName;
    existingBid.businessLocation = businessProfile.businessLocation;
    existingBid.businessCategory = businessProfile.businessCategory;
    existingBid.proposal = parsed.data.proposal;
    existingBid.pricing = parsed.data.pricing || '';
    existingBid.additionalNotes = parsed.data.additionalNotes || '';
    existingBid.status = 'pending';
  } else {
    event.businessBids.push({
      businessOwner: req.auth.sub,
      businessName: businessProfile.businessName,
      businessLocation: businessProfile.businessLocation,
      businessCategory: businessProfile.businessCategory,
      proposal: parsed.data.proposal,
      pricing: parsed.data.pricing || '',
      additionalNotes: parsed.data.additionalNotes || '',
      status: 'pending',
    });
  }

  await event.save();
  const populated = await applyEventPopulate(Event.findById(event._id));
  return res.json({ event: serializeEventForViewer(populated, req.auth.sub) });
}

async function acceptBusinessBid(req, res) {
  const { communityId, eventId, bidId } = req.params;
  const auth = await requireApprovedMember(req.auth.sub, communityId);
  if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

  const event = await Event.findOne({ _id: eventId, community: communityId, isDeleted: { $ne: true } });
  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (String(event.createdBy) !== String(req.auth.sub)) {
    return res.status(403).json({ message: 'Only the event creator can accept a business bid' });
  }
  if (!event.businessParticipationRequired) {
    return res.status(409).json({ message: 'This event is not configured for business bidding' });
  }
  if (new Date(event.date).getTime() <= Date.now()) {
    return res.status(409).json({ message: 'This event has already started' });
  }
  if (event.acceptedBusinessBidId) {
    return res.status(409).json({ message: 'A bid has already been accepted for this event' });
  }

  const bid = event.businessBids.id(bidId);
  if (!bid) return res.status(404).json({ message: 'Bid not found' });

  event.acceptedBusinessBidId = bid._id;
  event.businessBiddingClosedAt = new Date();
  event.businessBids.forEach((entry) => {
    entry.status = normalizeId(entry._id) === normalizeId(bidId) ? 'accepted' : 'declined';
  });

  await event.save();
  const populated = await applyEventPopulate(Event.findById(event._id));
  return res.json({ event: serializeEventForViewer(populated, req.auth.sub) });
}

async function getEventOwnerDetails(req, res) {
  const { communityId, eventId } = req.params;

  const community = await Community.findById(communityId);
  if (!community) return res.status(404).json({ message: 'Community not found' });

  const isCommunityOwner = String(community.createdBy || '') === String(req.auth?.sub || '');
  if (!isCommunityOwner) {
    return res.status(403).json({ message: 'Only community owner can view event owner details' });
  }

  const event = await Event.findOne({ _id: eventId, community: communityId, isDeleted: { $ne: true } }).populate(
    'createdBy',
    'name email avatarUrl country city mailingAddress interests role businessProfile',
  );
  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (!event.createdBy) return res.status(404).json({ message: 'Event owner not found' });

  const owner = event.createdBy;
  return res.json({
    owner: {
      id: owner._id,
      name: owner.name || '',
      email: owner.email || '',
      avatarUrl: owner.avatarUrl || '',
      country: owner.country || '',
      city: owner.city || '',
      mailingAddress: owner.mailingAddress || '',
      interests: Array.isArray(owner.interests) ? owner.interests : [],
      role: owner.role || '',
      businessProfile: {
        businessName: owner.businessProfile?.businessName || '',
        businessLocation: owner.businessProfile?.businessLocation || '',
        businessCategory: owner.businessProfile?.businessCategory || '',
        description: owner.businessProfile?.description || '',
        services: owner.businessProfile?.services || '',
      },
    },
  });
}

module.exports = {
  listMyEvents,
  listVolunteerOpportunities,
  listBusinessOpportunities,
  listCommunityEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  rsvp,
  volunteer,
  submitBusinessBid,
  acceptBusinessBid,
  getEventOwnerDetails,
};
