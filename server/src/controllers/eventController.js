const { z } = require('zod');
const Community = require('../models/Community');
const Membership = require('../models/Membership');
const Event = require('../models/Event');

async function requireApprovedMember(userId, communityId) {
  const community = await Community.findById(communityId);
  if (!community) return { ok: false, status: 404, message: 'Community not found' };
  if (community.status !== 'approved') return { ok: false, status: 403, message: 'Community not approved' };
  const membership = await Membership.findOne({ user: userId, community: communityId, status: 'approved' });
  if (!membership) return { ok: false, status: 403, message: 'Membership required' };
  return { ok: true };
}

async function listCommunityEvents(req, res) {
  const { communityId } = req.params;
  const auth = await requireApprovedMember(req.auth.sub, communityId);
  if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

  const events = await Event.find({ community: communityId })
    .sort({ date: 1 })
    .limit(200)
    .populate('createdBy', 'name')
    .populate('attendees', 'name')
    .populate('volunteers', 'name');
  return res.json({ events });
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

const createSchema = z.object({
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
}).superRefine((data, ctx) => {
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
});

async function createEvent(req, res) {
  const { communityId } = req.params;
  const auth = await requireApprovedMember(req.auth.sub, communityId);
  if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input', errors: parsed.error.issues });

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.imageUrl || '');

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
    attendees: [],
    volunteers: [],
  });

  return res.status(201).json({ event });
}

async function rsvp(req, res) {
  const { communityId, eventId } = req.params;
  const auth = await requireApprovedMember(req.auth.sub, communityId);
  if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

  const event = await Event.findOne({ _id: eventId, community: communityId });
  if (!event) return res.status(404).json({ message: 'Event not found' });

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

  const uid = String(req.auth.sub);
  const isVol = event.volunteers.map(String).includes(uid);
  if (isVol) event.volunteers = event.volunteers.filter((x) => String(x) !== uid);
  else event.volunteers.push(req.auth.sub);
  await event.save();

  return res.json({ volunteerCount: event.volunteers.length, volunteering: !isVol });
}

async function getEventOwnerDetails(req, res) {
  const { communityId, eventId } = req.params;

  const community = await Community.findById(communityId);
  if (!community) return res.status(404).json({ message: 'Community not found' });

  const isCommunityOwner = String(community.createdBy || '') === String(req.auth?.sub || '');
  if (!isCommunityOwner) {
    return res.status(403).json({ message: 'Only community owner can view event owner details' });
  }

  const event = await Event.findOne({ _id: eventId, community: communityId }).populate(
    'createdBy',
    'name email avatarUrl country city mailingAddress interests role'
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
    },
  });
}

module.exports = { listCommunityEvents, createEvent, rsvp, volunteer, getEventOwnerDetails };
