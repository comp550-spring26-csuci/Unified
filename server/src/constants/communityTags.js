const COMMUNITY_TAG_OPTIONS = [
  { value: '18_plus', label: '18+ Only', restricted: true },
  { value: 'students', label: 'Students', restricted: true },
  { value: 'professionals', label: 'Professionals', restricted: true },
  { value: 'women_only', label: 'Women Only', restricted: true },
  { value: 'men_only', label: 'Men Only', restricted: true },
  { value: 'parents', label: 'Parents', restricted: true },
  { value: 'seniors', label: 'Seniors', restricted: true },
  { value: 'family_friendly', label: 'Family Friendly', restricted: false },
  { value: 'beginners_welcome', label: 'Beginners Welcome', restricted: false },
  { value: 'advanced_topics', label: 'Advanced Topics', restricted: false },
  { value: 'networking', label: 'Networking', restricted: false },
  { value: 'career_growth', label: 'Career Growth', restricted: false },
  { value: 'technology', label: 'Technology', restricted: false },
  { value: 'coding', label: 'Coding', restricted: false },
  { value: 'design', label: 'Design', restricted: false },
  { value: 'entrepreneurship', label: 'Entrepreneurship', restricted: false },
  { value: 'startups', label: 'Startups', restricted: false },
  { value: 'finance', label: 'Finance', restricted: false },
  { value: 'science', label: 'Science', restricted: false },
  { value: 'education', label: 'Education', restricted: false },
  { value: 'health_wellness', label: 'Health & Wellness', restricted: false },
  { value: 'sports_fitness', label: 'Sports & Fitness', restricted: false },
  { value: 'outdoor_adventures', label: 'Outdoor Adventures', restricted: false },
  { value: 'travel', label: 'Travel', restricted: false },
  { value: 'food_culture', label: 'Food & Culture', restricted: false },
  { value: 'music', label: 'Music', restricted: false },
  { value: 'arts_culture', label: 'Arts & Culture', restricted: false },
  { value: 'photography', label: 'Photography', restricted: false },
  { value: 'gaming', label: 'Gaming', restricted: false },
  { value: 'books_writing', label: 'Books & Writing', restricted: false },
  { value: 'language_exchange', label: 'Language Exchange', restricted: false },
  { value: 'faith_spirituality', label: 'Faith & Spirituality', restricted: false },
  { value: 'volunteering', label: 'Volunteering', restricted: false },
  { value: 'social_impact', label: 'Social Impact', restricted: false },
  { value: 'sustainability', label: 'Sustainability', restricted: false },
  { value: 'community_service', label: 'Community Service', restricted: false },
  { value: 'pets_animals', label: 'Pets & Animals', restricted: false },
  { value: 'mental_health', label: 'Mental Health', restricted: false },
  { value: 'local_events', label: 'Local Events', restricted: false },
  { value: 'remote_friendly', label: 'Remote Friendly', restricted: false },
];

const COMMUNITY_TAG_VALUE_SET = new Set(COMMUNITY_TAG_OPTIONS.map((option) => option.value));
const RESTRICTED_COMMUNITY_TAG_SET = new Set(
  COMMUNITY_TAG_OPTIONS.filter((option) => option.restricted).map((option) => option.value)
);

function normalizeCommunityTag(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function findInvalidCommunityTags(values) {
  if (!Array.isArray(values)) return [];

  const invalid = [];
  for (const value of values) {
    const normalized = normalizeCommunityTag(value);
    if (!normalized || COMMUNITY_TAG_VALUE_SET.has(normalized) || invalid.includes(normalized)) continue;
    invalid.push(normalized);
  }
  return invalid;
}

function normalizeCommunityTagList(values, { max = 20 } = {}) {
  if (!Array.isArray(values)) return [];

  const result = [];
  const seen = new Set();

  for (const value of values) {
    const normalized = normalizeCommunityTag(value);
    if (!normalized || !COMMUNITY_TAG_VALUE_SET.has(normalized) || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
    if (result.length >= max) break;
  }

  return result;
}

function getRestrictedCommunityTags(values) {
  return normalizeCommunityTagList(values, { max: COMMUNITY_TAG_OPTIONS.length }).filter((value) =>
    RESTRICTED_COMMUNITY_TAG_SET.has(value)
  );
}

module.exports = {
  COMMUNITY_TAG_OPTIONS,
  COMMUNITY_TAG_VALUE_SET,
  findInvalidCommunityTags,
  normalizeCommunityTag,
  normalizeCommunityTagList,
  getRestrictedCommunityTags,
};
