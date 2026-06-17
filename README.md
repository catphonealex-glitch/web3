# DubStage

A community platform for amateur dubbing — where aspiring voice actors practice, audition for beginner-friendly projects, and build a portfolio to launch a career in dubbing.

Built on **TanStack Start** (React 19 + Vite 7) with **Supabase** providing the database, authentication, file storage, and edge runtime.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Routes / Pages](#routes--pages)
5. [Backend Architecture](#backend-architecture)
   - [Database Schema](#database-schema)
   - [Roles & Permissions](#roles--permissions)
   - [Storage Buckets](#storage-buckets)
   - [Database Functions](#database-functions)
6. [Authentication](#authentication)
7. [File Uploads](#file-uploads)
8. [Design System](#design-system)
9. [Local Development](#local-development)
10. [Becoming an Admin](#becoming-an-admin)

---

## Overview

DubStage is an amateur dubbing community where:

- **Creators** post a project — a video clip + a script — and mark it `open` (accepting auditions) or `closed` (showcase only).
- **Voice actors** browse open projects and submit auditions by uploading an audio demo plus an optional note.
- **Everyone** can comment on projects and discover work via tags and search.
- **Staff** (admins and moderators) can moderate users, projects, comments, and reports from a dedicated admin panel.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start v1 (React 19, SSR) |
| Build tool | Vite 7 |
| Routing | TanStack Router (file-based, type-safe) |
| Styling | Tailwind CSS v4 (via `src/styles.css` + design tokens) |
| UI primitives | shadcn/ui |
| Backend | Supabase: Postgres + Auth + Storage + Edge Functions) |
| Auth | Email / password (with optional Google OAuth ready to enable) |
| Server runtime | Cloudflare Workers (edge) |

---

## Project Structure

```
src/
├── components/
│   ├── Header.tsx              # Top nav with auth state, links to admin/profile
│   └── ProjectCard.tsx         # Card used on home + tag pages
├── integrations/supabase/
│   ├── client.ts               # Browser Supabase client (auto-generated)
│   ├── client.server.ts        # Server-side client for SSR / loaders
│   ├── auth-middleware.ts      # Auth guard for server functions
│   └── types.ts                # Auto-generated DB types — DO NOT EDIT
├── lib/
│   ├── auth.tsx                # AuthProvider, useAuth(), session + role helpers
│   └── storage.ts              # uploadFile() helper for buckets
├── routes/
│   ├── __root.tsx              # Root layout, providers, 404 boundary
│   ├── index.tsx               # Home: search, tag filter, project feed
│   ├── auth.tsx                # Sign in / sign up
│   ├── projects.new.tsx        # Create new project (title, desc, status, tags, uploads)
│   ├── projects.$id.tsx        # Project detail: video, script, comments, auditions
│   ├── profile.$id.tsx         # Public profile: bio, history
│   ├── tags.tsx                # Browse all tags
│   └── admin.tsx               # Mod panel: ban users, delete content, manage reports
├── styles.css                  # Design tokens + Tailwind v4 theme
└── router.tsx                  # Router config + QueryClient
supabase/
├── config.toml                 # Project config (do not change project_id)
└── migrations/                 # SQL migrations for schema, RLS, triggers
```

---

## Routes / Pages

| Path | File | Purpose | Access |
|------|------|---------|--------|
| `/` | `routes/index.tsx` | Homepage — search bar, tag chips, latest projects | Public |
| `/auth` | `routes/auth.tsx` | Sign in & sign up forms | Public |
| `/tags` | `routes/tags.tsx` | Browse all tags | Public |
| `/projects/new` | `routes/projects.new.tsx` | Create a project (title, description, status toggle, existing/new tags, video upload, script upload) | Authenticated |
| `/projects/$id` | `routes/projects.$id.tsx` | View project, post comments, submit audition (audio demo + note) | Public read; auth to comment/audition |
| `/profile/$id` | `routes/profile.$id.tsx` | Public profile + project history | Public |
| `/admin` | `routes/admin.tsx` | Moderation: ban users, delete projects/comments, resolve reports | Staff only |

---

## Backend Architecture

### Database Schema

All tables live in the `public` schema and have **Row-Level Security enabled**.

#### `profiles`
Public user profile, created automatically on signup via `handle_new_user()` trigger.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK, matches `auth.users.id` |
| `display_name` | text | Defaults to email prefix |
| `bio` | text | Optional |
| `avatar_url` | text | Optional, points to `avatars` bucket |
| `is_banned` | boolean | Set by staff |
| `created_at` / `updated_at` | timestamptz | |

#### `user_roles`
Roles are stored separately to prevent privilege-escalation attacks. **Never** store roles on `profiles`.

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | uuid | References `auth.users.id` |
| `role` | `app_role` enum | `admin` \| `moderator` \| `user` |

#### `projects`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `author_id` | uuid | Owner |
| `title`, `description` | text | |
| `status` | text | `open` (accepting auditions) or `closed` (showcase) |
| `media_url` | text | Public URL into `media` bucket |
| `text_url` | text | Public URL into `texts` bucket |

#### `tags` & `project_tags`
Many-to-many tagging. Any authenticated user can create new tags; staff can delete them.

#### `comments`
Public-readable threaded discussion under a project. Author can edit, author or staff can delete.

#### `applications` (auditions)
| Column | Type | Notes |
|--------|------|-------|
| `project_id` | uuid | Target project |
| `applicant_id` | uuid | Voice actor |
| `demo_url` | text | Public URL into `demos` bucket |
| `note` | text | Optional pitch text |

Visible to: the applicant, the project owner, and staff.

#### `reports`
User-submitted abuse reports. Only staff can view, update, or delete.

### Roles & Permissions

Three roles via the `app_role` Postgres enum:

- **`user`** — default. Can create projects, comment, apply, report.
- **`moderator`** — can delete any project/comment/application, view reports, ban users.
- **`admin`** — everything moderators can do, plus manage role assignments.

RLS enforces every rule — the client cannot bypass it even if the UI is tampered with.

### Storage Buckets

All buckets are **public-read** but writes are gated by RLS + auth:

| Bucket | Used for |
|--------|----------|
| `media` | Project video clips |
| `texts` | Scripts / dialogue files |
| `demos` | Audition audio recordings |
| `avatars` | Profile pictures |

### Database Functions

- **`has_role(user_id, role)`** — `SECURITY DEFINER` function used inside RLS policies to check role membership without recursion.
- **`is_staff(user_id)`** — convenience wrapper that returns true for `admin` or `moderator`.
- **`handle_new_user()`** — trigger on `auth.users` insert that creates the matching `profiles` row and assigns the default `user` role.

---

## Authentication

Implemented in `src/lib/auth.tsx`:

- `<AuthProvider>` wraps the app and exposes:
  - `user` — current Supabase user, or `null`
  - `profile` — joined `profiles` row
  - `roles` — array of `app_role`
  - `isStaff` — boolean shortcut
  - `signIn`, `signUp`, `signOut`
- Sign-up requires email verification by default (no auto-confirm).
- Sessions are persisted in browser storage and refreshed automatically.

To enable Google sign-in, configure the Google provider in **Cloud → Users → Auth settings → Sign in methods**.

---

## File Uploads

`src/lib/storage.ts` exposes `uploadFile(bucket, file, pathPrefix)`:

```ts
const url = await uploadFile("media", file, `projects/${userId}`);
```

It uploads to the requested bucket, generates a unique path, and returns the public URL ready to write into the database.

---

## Design System

Theme lives in `src/styles.css`. The aesthetic is a **dark theatrical** palette with gradient accents — think rehearsal-room reds and stage-light golds on deep midnight.

All colors are defined as semantic `oklch` tokens:
- `--background`, `--foreground`
- `--primary`, `--primary-foreground`, `--primary-glow`
- `--secondary`, `--muted`, `--accent`, `--destructive`
- Gradient & shadow tokens for hero sections

**Rule:** never write raw color classes (`bg-black`, `text-white`) in components — always use semantic tokens so light/dark modes and rebrands stay consistent.

---

## Local Development

```bash
# Install
bun install

# Dev server (TanStack Start + Vite)
bun dev

# Type-check
bunx tsc --noEmit

# Production build
bun run build
```

The `.env` file contains:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`


---

## Becoming an Admin

After signing up, promote yourself by inserting into `user_roles`:

1. Open **SQL Editor**.
2. Find your `user_id` (Cloud → Users).
3. Run:

```sql
insert into public.user_roles (user_id, role)
values ('<your-user-id>', 'admin');
```

Reload the app — the **Admin** link appears in the header.

---


## License

Private project. All rights reserved unless otherwise specified.
