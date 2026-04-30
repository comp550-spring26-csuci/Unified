import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getApiBaseUrl } from "../utils/media";

export const api = createApi({
  reducerPath: "ucaApi",
  baseQuery: fetchBaseQuery({
    baseUrl: getApiBaseUrl(),
    prepareHeaders: (headers, { getState }) => {
      const token =
        getState()?.global?.token || localStorage.getItem("uca_token");
      if (token) headers.set("authorization", `Bearer ${token}`);

      // Avoid caching issues that can show stale users when switching accounts
      headers.set("cache-control", "no-store");
      headers.set("pragma", "no-cache");
      return headers;
    },
  }),
  tagTypes: [
    "Me",
    "Communities",
    "Memberships",
    "Posts",
    "Comments",
    "Events",
    "Admin",
    "DashboardActivity",
  ],
  endpoints: (build) => ({
    // Auth
    register: build.mutation({
      query: (payload) => ({
        url: "api/auth/register",
        method: "POST",
        body: {
          name: payload?.name || "",
          email: payload?.email || "",
          password: payload?.password || "",
          role: payload?.role || "user",
          businessName: payload?.businessName || "",
          businessLocation: payload?.businessLocation || "",
          businessCategory: payload?.businessCategory || "",
          businessDescription: payload?.businessDescription || "",
          businessServices: payload?.businessServices || "",
        },
      }),
    }),
    login: build.mutation({
      query: (body) => ({ url: "api/auth/login", method: "POST", body }),
    }),
    forgotPassword: build.mutation({
      query: (body) => ({
        url: "api/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),
    resetPasswordWithOtp: build.mutation({
      query: (body) => ({
        url: "api/auth/reset-password-otp",
        method: "POST",
        body,
      }),
    }),
    // IMPORTANT: accept token as arg so the cache key changes per-login.
    // We still read the real token from headers via prepareHeaders.
    me: build.query({
      query: (_token) => "api/auth/me",
      providesTags: ["Me"],
    }),
    myActivity: build.query({
      query: () => "api/me/activity",
      providesTags: ["DashboardActivity"],
    }),
    updateProfile: build.mutation({
      query: (payload) => {
        const formData = new FormData();
        formData.append("name", payload?.name || "");
        formData.append("country", payload?.country || "");
        formData.append("city", payload?.city || "");
        formData.append("mailingAddress", payload?.mailingAddress || "");
        formData.append(
          "interests",
          Array.isArray(payload?.interests)
            ? payload.interests.join(",")
            : payload?.interests || "",
        );
        formData.append(
          "upgradeToBusinessOwner",
          String(Boolean(payload?.upgradeToBusinessOwner)),
        );
        formData.append("businessName", payload?.businessName || "");
        formData.append("businessLocation", payload?.businessLocation || "");
        formData.append("businessCategory", payload?.businessCategory || "");
        formData.append(
          "businessDescription",
          payload?.businessDescription || "",
        );
        formData.append("businessServices", payload?.businessServices || "");
        if (payload?.avatarFile) formData.append("avatar", payload.avatarFile);
        return {
          url: "api/auth/me",
          method: "PUT",
          body: formData,
        };
      },
      invalidatesTags: ["Me"],
    }),

    // Communities
    listCommunities: build.query({
      query: (q) => ({
        url: "api/communities",
        method: "GET",
        params: q ? { q } : undefined,
      }),
      providesTags: ["Communities"],
    }),
    myCommunities: build.query({
      query: () => "api/communities/mine",
      providesTags: ["Communities"],
    }),
    getCommunity: build.query({
      query: (id) => `api/communities/${id}`,
      providesTags: ["Communities"],
    }),
    createCommunity: build.mutation({
      query: (body) => ({ url: "api/communities", method: "POST", body }),
      invalidatesTags: ["Communities", "Admin", "DashboardActivity"],
    }),
    updateCommunityRules: build.mutation({
      query: ({ communityId, rules }) => ({
        url: `api/communities/${communityId}/rules`,
        method: "PUT",
        body: { rules },
      }),
      invalidatesTags: ["Communities"],
    }),

    // Admin community approvals
    listPendingCommunities: build.query({
      query: () => "api/admin/communities/pending",
      providesTags: ["Admin"],
    }),
    approveCommunity: build.mutation({
      query: (id) => ({
        url: `api/admin/communities/${id}/approve`,
        method: "POST",
      }),
      invalidatesTags: ["Admin", "Communities"],
    }),
    rejectCommunity: build.mutation({
      query: (id) => ({
        url: `api/admin/communities/${id}/reject`,
        method: "POST",
      }),
      invalidatesTags: ["Admin", "Communities"],
    }),

    // Memberships
    requestJoin: build.mutation({
      query: (body) => ({
        url: "api/memberships/request",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Memberships", "DashboardActivity"],
    }),
    myMemberships: build.query({
      query: () => "api/memberships/mine",
      providesTags: ["Memberships"],
    }),
    pendingMembers: build.query({
      query: (communityId) =>
        `api/memberships/community/${communityId}/pending`,
      providesTags: ["Memberships"],
    }),
    listCommunityMembers: build.query({
      query: (communityId) =>
        `api/memberships/community/${communityId}/members`,
      providesTags: ["Memberships", "Communities"],
    }),
    approveMember: build.mutation({
      query: ({ communityId, memberId }) => ({
        url: `api/memberships/community/${communityId}/member/${memberId}/approve`,
        method: "POST",
      }),
      invalidatesTags: ["Memberships", "Communities"],
    }),
    updateCommunityMemberRole: build.mutation({
      query: ({ communityId, memberId, role }) => ({
        url: `api/memberships/community/${communityId}/member/${memberId}/role`,
        method: "PUT",
        body: { role },
      }),
      invalidatesTags: ["Memberships", "Communities"],
    }),
    rejectMember: build.mutation({
      query: ({ communityId, memberId, reason }) => ({
        url: `api/memberships/community/${communityId}/member/${memberId}/reject`,
        method: "POST",
        body: { reason: reason || "" },
      }),
      invalidatesTags: ["Memberships"],
    }),

    // Posts + Comments
    listPosts: build.query({
      query: (communityId) => `api/communities/${communityId}/posts`,
      providesTags: ["Posts"],
    }),
    createPost: build.mutation({
  query: ({ communityId, text, imageFile }) => {
    const formData = new FormData();
    formData.append("text", text || "");
    if (imageFile) {
      formData.append("image", imageFile);
    }

    return {
      url: `api/communities/${communityId}/posts`,
      method: "POST",
      body: formData,
    };
  },
  invalidatesTags: ["Posts", "DashboardActivity"],
}),
    likePost: build.mutation({
      query: ({ communityId, postId }) => ({
        url: `api/communities/${communityId}/posts/${postId}/like`,
        method: "POST",
      }),
      invalidatesTags: ["Posts"],
    }),
    listComments: build.query({
      query: ({ communityId, postId }) =>
        `api/communities/${communityId}/posts/${postId}/comments`,
      providesTags: ["Comments"],
    }),
    createComment: build.mutation({
      query: ({ communityId, postId, text }) => ({
        url: `api/communities/${communityId}/posts/${postId}/comments`,
        method: "POST",
        body: { text },
      }),
      invalidatesTags: ["Comments", "DashboardActivity"],
    }),

    // Events
    listEvents: build.query({
      query: (communityId) => `api/communities/${communityId}/events`,
      providesTags: ["Events"],
    }),
    myEvents: build.query({
      query: () => "api/me/events",
      providesTags: ["Events"],
    }),
    volunteerOpportunities: build.query({
      query: (arg = {}) => {
        const params = {};
        if (arg.q?.trim()) params.q = arg.q.trim();
        if (arg.from?.trim()) params.from = arg.from.trim();
        if (arg.to?.trim()) params.to = arg.to.trim();
        if (arg.communityId?.trim()) params.communityId = arg.communityId.trim();
        return { url: "api/me/volunteer-opportunities", params };
      },
      providesTags: ["Events"],
    }),
    businessOpportunities: build.query({
      query: (arg = {}) => {
        const params = {};
        if (arg.q?.trim()) params.q = arg.q.trim();
        if (arg.from?.trim()) params.from = arg.from.trim();
        if (arg.to?.trim()) params.to = arg.to.trim();
        if (arg.communityId?.trim()) params.communityId = arg.communityId.trim();
        return { url: "api/me/business-opportunities", params };
      },
      providesTags: ["Events"],
    }),
    getEventOwnerDetail: build.query({
      query: ({ communityId, eventId }) =>
        `api/communities/${communityId}/events/${eventId}/owner`,
    }),
    createEvent: build.mutation({
      query: ({ communityId, payload }) => {
        const formData = new FormData();
        formData.append("title", payload?.title || "");
        formData.append("description", payload?.description || "");
        formData.append("whoFor", payload?.whoFor ?? "");
        formData.append("whatToBring", payload?.whatToBring ?? "");
        formData.append(
          "volunteerRequirements",
          payload?.volunteerRequirements ?? "",
        );
        formData.append("date", payload?.date || "");
        if (payload?.endDate) {
          formData.append("endDate", payload.endDate);
        }
        formData.append("venue", payload?.venue || "");
        formData.append("capacity", String(payload?.capacity ?? 0));
        if (Number.isFinite(payload?.latitude)) {
          formData.append("latitude", String(payload.latitude));
        }
        if (Number.isFinite(payload?.longitude)) {
          formData.append("longitude", String(payload.longitude));
        }
        if (payload?.imageUrl) formData.append("imageUrl", payload.imageUrl);
        if (payload?.imageFile) formData.append("image", payload.imageFile);
        formData.append(
          "businessParticipationRequired",
          String(Boolean(payload?.businessParticipationRequired)),
        );
        if (payload?.businessCategoriesNeeded?.length) {
          formData.append(
            "businessCategoriesNeeded",
            payload.businessCategoriesNeeded.join(","),
          );
        }
        formData.append(
          "businessRequirements",
          payload?.businessRequirements || "",
        );
        if (payload?.biddingDeadline) {
          formData.append("biddingDeadline", payload.biddingDeadline);
        }
        if (payload?.agenda != null) {
          formData.append("agenda", JSON.stringify(payload.agenda));
        }

        return {
          url: `api/communities/${communityId}/events`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Events", "Posts", "DashboardActivity"],
    }),
    updateEvent: build.mutation({
      query: ({ communityId, eventId, payload }) => {
        const formData = new FormData();
        formData.append("title", payload?.title || "");
        formData.append("description", payload?.description || "");
        formData.append("whoFor", payload?.whoFor ?? "");
        formData.append("whatToBring", payload?.whatToBring ?? "");
        formData.append(
          "volunteerRequirements",
          payload?.volunteerRequirements ?? "",
        );
        formData.append("date", payload?.date || "");
        if (payload?.endDate) {
          formData.append("endDate", payload.endDate);
        }
        formData.append("venue", payload?.venue || "");
        formData.append("capacity", String(payload?.capacity ?? 0));
        if (Number.isFinite(payload?.latitude)) {
          formData.append("latitude", String(payload.latitude));
        }
        if (Number.isFinite(payload?.longitude)) {
          formData.append("longitude", String(payload.longitude));
        }
        if (payload?.imageUrl) formData.append("imageUrl", payload.imageUrl);
        if (payload?.imageFile) formData.append("image", payload.imageFile);
        formData.append(
          "businessParticipationRequired",
          String(Boolean(payload?.businessParticipationRequired)),
        );
        if (payload?.businessCategoriesNeeded?.length) {
          formData.append(
            "businessCategoriesNeeded",
            payload.businessCategoriesNeeded.join(","),
          );
        }
        formData.append(
          "businessRequirements",
          payload?.businessRequirements || "",
        );
        if (payload?.biddingDeadline) {
          formData.append("biddingDeadline", payload.biddingDeadline);
        }
        if (payload?.agenda != null) {
          formData.append("agenda", JSON.stringify(payload.agenda));
        }

        return {
          url: `api/communities/${communityId}/events/${eventId}`,
          method: "PATCH",
          body: formData,
        };
      },
      invalidatesTags: ["Events"],
    }),
    deleteEvent: build.mutation({
      query: ({ communityId, eventId }) => ({
        url: `api/communities/${communityId}/events/${eventId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Events", "Posts", "DashboardActivity"],
    }),
    rsvp: build.mutation({
      query: ({ communityId, eventId }) => ({
        url: `api/communities/${communityId}/events/${eventId}/rsvp`,
        method: "POST",
      }),
      invalidatesTags: ["Events", "Posts", "DashboardActivity"],
    }),
    volunteer: build.mutation({
      query: ({ communityId, eventId }) => ({
        url: `api/communities/${communityId}/events/${eventId}/volunteer`,
        method: "POST",
      }),
      invalidatesTags: ["Events", "Posts", "DashboardActivity"],
    }),
    submitBusinessBid: build.mutation({
      query: ({ communityId, eventId, payload }) => ({
        url: `api/communities/${communityId}/events/${eventId}/bids`,
        method: "POST",
        body: {
          proposal: payload?.proposal || "",
          pricing: payload?.pricing || "",
          additionalNotes: payload?.additionalNotes || "",
        },
      }),
      invalidatesTags: ["Events"],
    }),
    acceptBusinessBid: build.mutation({
      query: ({ communityId, eventId, bidId }) => ({
        url: `api/communities/${communityId}/events/${eventId}/bids/${bidId}/accept`,
        method: "POST",
      }),
      invalidatesTags: ["Events"],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordWithOtpMutation,
  useMeQuery,
  useMyActivityQuery,
  useUpdateProfileMutation,
  useListCommunitiesQuery,
  useMyCommunitiesQuery,
  useGetCommunityQuery,
  useCreateCommunityMutation,
  useUpdateCommunityRulesMutation,
  useListPendingCommunitiesQuery,
  useApproveCommunityMutation,
  useRejectCommunityMutation,
  useRequestJoinMutation,
  useMyMembershipsQuery,
  usePendingMembersQuery,
  useListCommunityMembersQuery,
  useApproveMemberMutation,
  useUpdateCommunityMemberRoleMutation,
  useRejectMemberMutation,
  useListPostsQuery,
  useCreatePostMutation,
  useLikePostMutation,
  useListCommentsQuery,
  useCreateCommentMutation,
  useListEventsQuery,
  useMyEventsQuery,
  useVolunteerOpportunitiesQuery,
  useBusinessOpportunitiesQuery,
  useLazyGetEventOwnerDetailQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useRsvpMutation,
  useVolunteerMutation,
  useSubmitBusinessBidMutation,
  useAcceptBusinessBidMutation,
} = api;

