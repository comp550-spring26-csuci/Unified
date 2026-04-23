# Unified — User Guide

## 1. What is Unified?

**Unified** is a web application for **community management**: discover and join communities, post and comment, and work with **events** (RSVP, volunteering). Some actions require **community admins or moderators** to approve requests; a **super admin** approves new communities before they go live.

Use a modern browser and the **URL** your team provides (or local development URL). The app shows **toast** notifications for success and error feedback.

---

## 2. Account basics

| Action            | Where to go                                                        |
| ----------------- | ------------------------------------------------------------------ |
| Create an account | **Register** from the login page                                   |
| Sign in           | **Login** with email and password                                 |
| Forgot password   | **Forgot password** (if enabled on your deployment)               |
| Sign out          | **User menu** in the top bar → logout                             |

If your session is invalid, you may be returned to the login page.

---

## 3. Main navigation

- **Sidebar:** Dashboard, Communities, My communities, Events, Membership Requests, My Profile. **Super admin** also sees **Admin: Community approvals**. **Community admins or moderators** may see **Admin: Membership approvals**.
- **Top bar (wide screens):** Home, All Communities, My Communities, My Requests, Profile; **menu** toggles the sidebar; **account** menu on the right.

**Super admin note:** The app may **redirect** super admins away from member-only routes (e.g. the main Communities list) toward **Dashboard** and **Admin: Community approvals**.

---

## 4. Dashboard

The **Dashboard** is the default home. It surfaces **activity** summaries (charts and lists) so you can see recent engagement.

---

## 5. Communities (browse, create, join)

**All Communities** lets you browse the catalog, **request to join** (join reason and “about you” may be required), and **create a new community** (name, region, description, tags/keywords, etc.).

**New communities** may need **super admin approval** before they are fully public.

Some **tags** may be restricted; if unavailable, pick another or contact your administrator.

---

## 6. My communities

**My communities** lists communities you belong to and your role (member, moderator, or admin, as applicable). Open a community to view its full page.

---

## 7. Community page (detail)

Typical **tabs:**

- **Posts** — Feed, **like** posts, read and add **comments**.
- **Rules** — Community rules (admins can update when permitted).
- **Members** — Roster; admins/moderators can adjust **member roles** where the UI allows.
- **Events** — Upcoming community events: **RSVP**, see attendees/volunteers, **edit** (when allowed). Events can include **volunteer requirements**; you can sign up to **volunteer** and accept the stated terms.
- **Create Event** — New event for this community (time, location/map if used, optional agenda, volunteer text, etc.).

**Past events** for a community may be linked from the community (e.g. a past-events route for that community).

---

## 8. My events and past events

- **My events** — Upcoming events across your communities, soonest first. Use **date range**, **community**, and **filters** (e.g. volunteer opportunities, created by you, attending, volunteering). If multiple checkboxes are on, the list often matches **any** of them (see on-screen help).
- **Create events** — Choose an **approved** community, then open the **Create event** flow on that community.
- **Past events** — History at **My events → Past** (e.g. past RSVPs and volunteer sign-ups).

A dedicated **volunteer opportunities** page may exist at **`/volunteer-opportunities`**; bookmark or follow links your team provides if it is not in the main menu.

---

## 9. Membership requests

**Membership Requests** (or **My Requests** in the top bar) shows the status of your **join requests** (pending, approved, rejected), optional **rejection reasons**, and timestamps.

---

## 10. Profile

**My Profile** is where you update **name**, location/address fields (as supported), **interest tags**, and **profile picture**. Save to apply changes.

---

## 11. Administration

### 11.1 Super admin — Community approvals

**Admin: Community approvals** lists **pending** new communities. **Approve** or **reject** each.

### 11.2 Community admin or moderator — Membership approvals

**Admin: Membership approvals** (when you admin or moderate a community) lists **pending join** requests. **Approve** or **reject**; reject may prompt for a **reason** shown to the requester.

---

## 12. Tips

- Read **toast** messages for server feedback.
- **Approved membership** is required for the full post/event experience in a community.
- Read **volunteer requirements** before signing up to volunteer.
- **Roles** (member vs super admin) change which screens are available on purpose.

For architecture and roles at a high level, see the project `README.md`.
