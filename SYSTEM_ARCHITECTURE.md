# DocFlow — System Architecture

> A full-stack document review and approval workflow platform.
> A **Next.js 16** frontend communicates with a **Django REST Framework** backend over JWT-authenticated APIs.
> Users (Makers, Reviewers, Admins) collaborate on documents through a ticket-based lifecycle,
> progressing from creation → assigned → started → draft → approval → approved (locked).

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Tech Stack](#2-tech-stack)
3. [Project Directory Map](#3-project-directory-map)
4. [File-by-File Reference](#4-file-by-file-reference)
   - [Root](#41-root)
   - [backend/config — Django Project Core](#42-backendconfig--django-project-core)
   - [backend/users — Authentication & Role Management](#43-backendusers--authentication--role-management)
   - [backend/tickets — Ticket Lifecycle Engine](#44-backendtickets--ticket-lifecycle-engine)
   - [backend/documents — Document Version Store](#45-backenddocuments--document-version-store)
   - [backend/categories — Taxonomy / Classification](#46-backendcategories--taxonomy--classification)
   - [backend/communication — In-Ticket Messaging](#47-backendcommunication--in-ticket-messaging)
   - [backend/workflow — Audit & Status History](#48-backendworkflow--audit--status-history)
   - [frontend — Next.js Application](#49-frontend--nextjs-application)
5. [Data Model Relationships](#5-data-model-relationships)
6. [API Endpoint Map](#6-api-endpoint-map)
7. [Authentication Flow](#7-authentication-flow)
8. [Ticket Lifecycle State Machine](#8-ticket-lifecycle-state-machine)
9. [Key Design Decisions](#9-key-design-decisions)

---

## 1. High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│              Next.js Frontend  (Port 3000)               │
│                                                          │
│  ┌────────────┐  ┌──────────────────┐  ┌─────────────┐  │
│  │  /  (Home) │  │  /login          │  │  /dashboard │  │
│  └────────────┘  └──────────────────┘  └─────────────┘  │
│                                                          │
│  Components: AdminDashboard, MakerDashboard,             │
│              ReviewerDashboard, Sidebar                  │
│                                                          │
│  services/api.js  →  axios instance (baseURL: :8000)     │
└──────────────────────────────┬───────────────────────────┘
                               │  HTTP (JWT Bearer token)
┌──────────────────────────────▼───────────────────────────┐
│              Django REST Framework  (Port 8000)          │
│                                                          │
│  /api/auth/     /api/tickets/   /api/categories/         │
│  /api/documents/  /api/communication/  /admin/           │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐   │
│  │  users   │ │ tickets  │ │documents │ │categories │   │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘   │
│                                                          │
│  ┌────────────────┐   ┌────────────────┐                 │
│  │ communication  │   │    workflow     │                 │
│  └────────────────┘   └────────────────┘                 │
│                                                          │
│                   SQLite Database                        │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack

### Backend

| Layer | Technology | Purpose |
|---|---|---|
| Web Framework | Django 4.2 | ORM, admin, middleware, URL routing |
| API Layer | Django REST Framework | Serializers, APIViews, permission classes |
| Authentication | djangorestframework-simplejwt | Stateless JWT access/refresh tokens |
| CORS | django-cors-headers | Allow cross-origin requests from the frontend (`CORS_ALLOW_ALL_ORIGINS = True`) |
| Database | SQLite (`db.sqlite3`) | Development database (swap to PostgreSQL for production) |
| File Handling | Django media files | Upload versioned documents (`documents/`) and chat attachments (`chat/`) |

### Frontend

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 16.2 (App Router) | React-based fullstack frontend |
| Language | JavaScript (`.js`) + TypeScript (`layout.tsx`) | Component and page authoring |
| HTTP Client | Axios 1.14 | API calls to DRF backend with JWT headers |
| Icons | lucide-react | Icon set used in the Sidebar |
| Styling | Tailwind CSS 4 | Utility-first CSS framework |
| Fonts | Geist / Geist Mono (Google Fonts) | Typography via Next.js font system |

---

## 3. Project Directory Map

```
DocFlow/
├── DocFlow.pdf                  # Project brief / specification document
├── SYSTEM_ARCHITECTURE.md       # This document
├── requirements.txt             # Top-level Python dependency list
├── .gitignore                   # Git ignore rules
│
├── backend/                     # All backend source code
│   ├── manage.py                # Django CLI entry point
│   ├── db.sqlite3               # SQLite development database
│   ├── requirements.txt         # Backend-specific dependency list
│   ├── .env                     # Environment variables (secret key, debug flag, etc.)
│   │
│   ├── config/                  # Django project configuration package
│   │   ├── settings.py          # All project settings (DB, auth, installed apps, JWT, CORS)
│   │   ├── urls.py              # Root URL router (mounts all app URL modules)
│   │   ├── asgi.py              # ASGI entry point
│   │   └── wsgi.py              # WSGI entry point
│   │
│   ├── users/                   # App: user accounts & JWT login
│   │   ├── models.py            # Custom User model (role, reviewer_field FK, specialization FK)
│   │   ├── serializers.py       # UserSerializer & LoginSerializer
│   │   ├── views.py             # LoginView (issues JWT tokens + role)
│   │   ├── urls.py              # POST /api/auth/login/
│   │   ├── admin.py             # Registers User in Django Admin
│   │   └── migrations/          # DB migration files
│   │
│   ├── tickets/                 # App: full ticket lifecycle management
│   │   ├── models.py            # Ticket model (7-status lifecycle, category/subcategory FKs)
│   │   ├── serializers.py       # TicketSerializer (read-only: created_by, status, locked)
│   │   ├── views.py             # CreateTicketView, StartTicketView, DraftTicketView,
│   │   │                        # ApprovalTicketView, ApproveTicketView,
│   │   │                        # MakerDashboardView, ReviewerDashboardView,
│   │   │                        # AdminDashboardView, TicketDetailView
│   │   ├── urls.py              # All ticket API routes
│   │   ├── admin.py             # Registers Ticket in Django Admin
│   │   └── migrations/          # DB migration files
│   │
│   ├── documents/               # App: versioned document file storage
│   │   ├── models.py            # DocumentVersion model (auto-increments version V1, V2…)
│   │   ├── serializers.py       # DocumentVersionSerializer
│   │   ├── views.py             # UploadDocumentView (blocks upload if ticket is locked)
│   │   ├── urls.py              # POST /api/documents/upload/
│   │   ├── admin.py             # Registers DocumentVersion in Django Admin
│   │   └── migrations/          # DB migration files
│   │
│   ├── categories/              # App: document classification taxonomy
│   │   ├── models.py            # Category & SubCategory models
│   │   ├── views.py             # load_categories(), load_subcategories() (Django view, no auth)
│   │   ├── urls.py              # GET /api/categories/  &  GET /api/categories/load-subcategories/
│   │   ├── admin.py             # Registers Category & SubCategory in Django Admin
│   │   └── migrations/          # DB migration files
│   │
│   ├── communication/           # App: per-ticket messaging with attachments
│   │   ├── models.py            # Communication model (ticket, message, sender, attachment)
│   │   ├── serializers.py       # CommunicationSerializer
│   │   ├── views.py             # SendMessageView, GetMessagesView
│   │   ├── urls.py              # POST /api/communication/send/  &  GET /api/communication/<id>/
│   │   ├── admin.py             # Registers Communication in Django Admin
│   │   └── migrations/          # DB migration files
│   │
│   ├── workflow/                # App: status change audit log
│   │   ├── models.py            # StatusLog model (old→new status, changed_by, timestamp)
│   │   ├── views.py             # Placeholder (StatusLog consumed directly by tickets/views.py)
│   │   ├── admin.py             # Registers StatusLog in Django Admin
│   │   └── migrations/          # DB migration files
│   │
│   └── media/                   # Uploaded files at runtime (gitignored)
│       ├── documents/           # Uploaded document versions
│       └── chat/                # Chat attachment uploads
│
├── frontend/                    # Next.js 16 frontend application
│   ├── package.json             # Node dependencies & scripts
│   ├── next.config.ts           # Next.js configuration
│   ├── tsconfig.json            # TypeScript config
│   ├── postcss.config.mjs       # PostCSS / Tailwind config
│   ├── eslint.config.mjs        # ESLint config
│   │
│   ├── app/                     # Next.js App Router pages
│   │   ├── layout.tsx           # Root layout (fonts, metadata: "DocFlow")
│   │   ├── globals.css          # Global CSS reset / base styles
│   │   ├── page.js              # Home page "/" — landing with Get Started button
│   │   ├── login/
│   │   │   └── page.js          # Login page — calls POST /api/auth/login/, stores token+role
│   │   └── dashboard/
│   │       └── page.js          # Dashboard router — renders role-specific dashboard component
│   │
│   ├── components/              # Reusable React components
│   │   ├── AdminDashboard.js    # Admin view: stats cards, ticket table, search/filter,
│   │   │                        # pagination, ticket detail modal, approve action
│   │   ├── MakerDashboard.js    # Maker view: create ticket form (title, category, subcategory)
│   │   ├── ReviewerDashboard.js # Reviewer view: (placeholder — layout wired, content TBD)
│   │   └── Sidebar.js           # Shared sidebar with navigation tabs (uses lucide-react icons)
│   │
│   └── services/
│       └── api.js               # Axios instance — baseURL: http://127.0.0.1:8000/api/
│
├── docker/                      # Docker configuration (not yet implemented)
├── docs/                        # Extended documentation (not yet implemented)
└── scripts/                     # Utility/automation scripts (not yet implemented)
```

---

## 4. File-by-File Reference

### 4.1 Root

| File | What It Does |
|---|---|
| `requirements.txt` | Declares Python package dependencies for the project. |
| `DocFlow.pdf` | Project specification/brief document. |
| `SYSTEM_ARCHITECTURE.md` | This document — comprehensive reference for the codebase. |
| `.gitignore` | Standard Python + Node ignore rules (venv, `__pycache__`, `.next`, `.env`, `node_modules`, `db.sqlite3`, `media/`). |

---

### 4.2 `backend/config` — Django Project Core

| File | What It Does |
|---|---|
| `settings.py` | Central configuration. `INSTALLED_APPS` includes 6 local apps + DRF + CORS. `AUTH_USER_MODEL = 'users.User'`. JWT auth as default DRF authenticator. `CORS_ALLOW_ALL_ORIGINS = True`. JWT lifetimes: 8h access / 1d refresh. `MEDIA_ROOT = BASE_DIR / 'media'` (absolute path for portable file serving). |
| `urls.py` | Root URL router. Mounts: `/admin/`, `/api/auth/` → `users.urls`, `/api/tickets/` → `tickets.urls`, `/api/categories/` → `categories.urls`, `/api/documents/` → `documents.urls`, `/api/communication/` → `communication.urls`. Also serves `MEDIA_URL` for uploaded file access. |
| `wsgi.py` | WSGI entry point for synchronous deployment (Gunicorn). |
| `asgi.py` | ASGI entry point for async-capable deployment. |
| `manage.py` | Django CLI entry point (`runserver`, `migrate`, `createsuperuser`, etc.). |

---

### 4.3 `backend/users` — Authentication & Role Management

**Purpose:** Manages user identity. Extends `AbstractUser` with `role`, `reviewer_field` (FK → `Category`), and `specialization` (FK → `SubCategory`). Exposes a JWT login endpoint.

| File | What It Does |
|---|---|
| `models.py` | `User` extends `AbstractUser`. Adds: `role` (`maker` / `reviewer` / `admin`), `reviewer_field` (FK → `Category`, nullable), `specialization` (FK → `SubCategory`, nullable). The `clean()` method enforces that reviewers must have both `reviewer_field` and `specialization` set. |
| `serializers.py` | **`LoginSerializer`** — validates `username`/`password` via `django.authenticate()` and raises `ValidationError` on failure. **`UserSerializer`** — full model serializer (all fields). |
| `views.py` | **`LoginView`** (`AllowAny`) — validates credentials, generates simplejwt `RefreshToken`, returns `access`, `refresh`, `role`, and `username`. |
| `urls.py` | `POST /api/auth/login/` → `LoginView`. |

---

### 4.4 `backend/tickets` — Ticket Lifecycle Engine

**Purpose:** Core business domain. `Ticket` represents a document review request. On creation, a reviewer is auto-assigned by matching `reviewer_field` + `specialization` against the ticket's `category` + `subcategory`.

| File | What It Does |
|---|---|
| `models.py` | `Ticket` fields: `title`, `category` (FK → `Category`), `subcategory` (FK → `SubCategory`), `created_by` (FK → `User`), `assigned_reviewer` (nullable FK → `User`), `status` (7 choices — see §8), `created_at`, `locked` (bool). |
| `serializers.py` | `TicketSerializer` — all fields; `read_only_fields = ['created_by', 'assigned_reviewer', 'status', 'locked']` (all set server-side). |
| `views.py` | Eight views implementing the full lifecycle: **`CreateTicketView`** auto-assigns reviewer by `reviewer_field=ticket.category` + `specialization=ticket.subcategory`, sets status to `assigned`. **`StartTicketView`** (reviewer only) → `started` + StatusLog. **`DraftTicketView`** (reviewer only) → `draft` + StatusLog. **`ApprovalTicketView`** (reviewer only) → `approval` + StatusLog. **`ApproveTicketView`** (admin only) → `approved`, sets `locked=True` + StatusLog. **`MakerDashboardView`**, **`ReviewerDashboardView`**, **`AdminDashboardView`** — filtered ticket list views. **`TicketDetailView`** — returns ticket + all document versions + status log history. |
| `urls.py` | Full route table — see [§6 API Endpoint Map](#6-api-endpoint-map). |

---

### 4.5 `backend/documents` — Document Version Store

**Purpose:** Tracks versioned file uploads attached to a ticket. Each upload auto-increments a version label (`V1`, `V2`, …). Uploads are blocked if the ticket is `locked`.

| File | What It Does |
|---|---|
| `models.py` | `DocumentVersion`: `ticket` (FK), `file` (upload to `documents/`), `version` (auto-generated in `save()` as `V1`, `V2`, …), `uploaded_by` (FK → `User`), `uploaded_at`. |
| `serializers.py` | `DocumentVersionSerializer` — all fields; `read_only_fields = ('version', 'uploaded_by', 'uploaded_at')`. |
| `views.py` | **`UploadDocumentView`** (`IsAuthenticated`) — validates ticket exists and is not locked before accepting the upload. Saves with `uploaded_by=request.user`. |
| `urls.py` | `POST /api/documents/upload/` → `UploadDocumentView`. |

---

### 4.6 `backend/categories` — Taxonomy / Classification

**Purpose:** Two-level classification system (`Category` → `SubCategory`) used to tag tickets and match reviewers by `reviewer_field` + `specialization`.

| File | What It Does |
|---|---|
| `models.py` | `Category` (name). `SubCategory` (name + FK → `Category`). |
| `views.py` | **`load_categories()`** — returns all categories as JSON. **`load_subcategories()`** — filters by `?category=<id>`. Both are plain Django views (not DRF APIViews) — they are public / unauthenticated by design, consumed directly by the MakerDashboard form dropdowns. |
| `urls.py` | `GET /api/categories/` → `load_categories`. `GET /api/categories/load-subcategories/?category=<id>` → `load_subcategories`. |

---

### 4.7 `backend/communication` — In-Ticket Messaging

**Purpose:** Allows participants to send text messages (with optional file attachments) in the context of a ticket.

| File | What It Does |
|---|---|
| `models.py` | `Communication`: `ticket` (FK), `message` (text), `sender` (FK → `User`), `attachment` (optional file → `chat/`), `created_at`. |
| `serializers.py` | `CommunicationSerializer` — all fields. |
| `views.py` | **`SendMessageView`** (`IsAuthenticated`) — saves message with `sender=request.user`. **`GetMessagesView`** (`IsAuthenticated`) — returns all messages for a given ticket, ordered by `created_at`. |
| `urls.py` | `POST /api/communication/send/` → `SendMessageView`. `GET /api/communication/<ticket_id>/` → `GetMessagesView`. |

---

### 4.8 `backend/workflow` — Audit & Status History

**Purpose:** Immutable audit log. Every ticket status transition creates a `StatusLog` entry — recorded by all five ticket mutation views.

| File | What It Does |
|---|---|
| `models.py` | `StatusLog`: `ticket` (FK), `old_status` (str), `new_status` (str), `changed_by` (FK → `User`), `timestamp` (auto). All five status-mutating views in `tickets/views.py` create a record here. |
| `views.py` | Placeholder — `StatusLog` data is consumed directly by `TicketDetailView` (returned in the ticket detail response) and managed via Django Admin. No REST API endpoint needed. |

---

### 4.9 `frontend` — Next.js Application

**Purpose:** Role-based SPA. After login, the user's `role` (stored in `localStorage`) determines which dashboard component is rendered.

#### `app/` — Pages (Next.js App Router)

| File | What It Does |
|---|---|
| `layout.tsx` | Root layout. Loads Geist + Geist Mono fonts. Sets `<title>DocFlow</title>` and meta description. Wraps all pages. |
| `globals.css` | Global CSS base styles / resets. |
| `page.js` | Home page (`/`). Landing screen with "DocFlow" heading and a "Get Started" button that navigates to `/login`. |
| `login/page.js` | Login form. `POST`s to `/api/auth/login/`. On success: stores `token` and `role` in `localStorage`, then redirects to `/dashboard`. |
| `dashboard/page.js` | Dashboard router. On mount: reads `token` (redirects to `/login` if missing) and `role` from `localStorage`. Renders `<AdminDashboard>`, `<ReviewerDashboard>`, or `<MakerDashboard>` based on role. |

#### `components/` — Reusable Components

| File | What It Does |
|---|---|
| `Sidebar.js` | Shared navigation sidebar (slate-900 background). Renders Dashboard / Tickets / Users / Settings nav items with lucide-react icons. Calls `setActiveTab(tabName)` prop on click — must always be supplied by the parent. |
| `AdminDashboard.js` | Full admin workspace. **Dashboard tab:** 4 stat cards (Total, Pending Approval, Approved, Draft counts). **Tickets tab:** searchable/filterable ticket table with pagination (5/page), per-row "Approve" button (with `stopPropagation` to prevent modal trigger), and a ticket detail modal showing documents & status history. Auto-refreshes every 10 seconds. |
| `MakerDashboard.js` | Maker workspace. Single "Create Ticket" form with Title input, Category dropdown (loaded from `/api/categories/`), and SubCategory dropdown (loaded dynamically on category change). Submits to `POST /api/tickets/create/`. |
| `ReviewerDashboard.js` | Reviewer workspace. Layout wired (Sidebar + content area). Ticket list and action buttons are **not yet implemented** — placeholder heading only. |

#### `services/`

| File | What It Does |
|---|---|
| `api.js` | Axios instance with `baseURL: 'http://127.0.0.1:8000/api/'`. All components import this and add `Authorization: Bearer <token>` headers per-request. |

---

## 5. Data Model Relationships

```
Category ────────────────────────────┐
    │                                │
    └── SubCategory                  │
              │                      │
              └───────────────────► Ticket ◄──── User (created_by / assigned_reviewer)
                                       │
                          ┌────────────┼───────────────┐
                          │            │               │
                    DocumentVersion  Communication  StatusLog
                    (versioned files) (messages)  (audit trail)
```

| Relationship | Description |
|---|---|
| `Category` → `SubCategory` | One category has many subcategories (e.g. Finance → Invoices) |
| `Ticket` → `Category` / `SubCategory` | Each ticket is tagged with one category and one subcategory |
| `User.reviewer_field` → `Category` | A reviewer's area of expertise (used for auto-assignment) |
| `User.specialization` → `SubCategory` | A reviewer's specific specialization (used for auto-assignment) |
| `User` → `Ticket` (created_by) | A **Maker** creates the ticket |
| `User` → `Ticket` (assigned_reviewer) | A **Reviewer** is auto-assigned when `reviewer_field == category` AND `specialization == subcategory` |
| `Ticket` → `DocumentVersion` | One ticket may have many document versions (revision history) |
| `Ticket` → `Communication` | One ticket may have many messages (discussion thread) |
| `Ticket` → `StatusLog` | One ticket has many status log entries (full audit trail) |

---

## 6. API Endpoint Map

### Auth

| Method | URL | View | Auth | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/login/` | `LoginView` | ❌ Public | Returns JWT tokens + role + username |

### Tickets

| Method | URL | View | Auth | Description |
|---|---|---|---|---|
| `POST` | `/api/tickets/create/` | `CreateTicketView` | ✅ JWT | Creates ticket, auto-assigns reviewer by `reviewer_field` + `specialization` match |
| `POST` | `/api/tickets/start/<id>/` | `StartTicketView` | ✅ JWT | Reviewer starts the ticket → `started` (+ StatusLog) |
| `POST` | `/api/tickets/draft/<id>/` | `DraftTicketView` | ✅ JWT | Reviewer moves ticket back to draft → `draft` (+ StatusLog) |
| `POST` | `/api/tickets/approval/<id>/` | `ApprovalTicketView` | ✅ JWT | Reviewer submits for approval → `approval` (+ StatusLog) |
| `POST` | `/api/tickets/approve/<id>/` | `ApproveTicketView` | ✅ JWT (admin) | Admin approves → `approved`, sets `locked=True` (+ StatusLog) |
| `GET` | `/api/tickets/maker/` | `MakerDashboardView` | ✅ JWT | Returns tickets created by the current user |
| `GET` | `/api/tickets/reviewer/` | `ReviewerDashboardView` | ✅ JWT | Returns tickets assigned to the current user |
| `GET` | `/api/tickets/admin/` | `AdminDashboardView` | ✅ JWT (admin) | Returns all tickets |
| `GET` | `/api/tickets/<id>/` | `TicketDetailView` | ✅ JWT | Returns ticket + documents list + status log history |

### Categories

| Method | URL | View | Auth | Description |
|---|---|---|---|---|
| `GET` | `/api/categories/` | `load_categories` | ❌ Public | Returns all categories as `[{id, name}]` |
| `GET` | `/api/categories/load-subcategories/?category=<id>` | `load_subcategories` | ❌ Public | Returns subcategories for a category |

### Documents

| Method | URL | View | Auth | Description |
|---|---|---|---|---|
| `POST` | `/api/documents/upload/` | `UploadDocumentView` | ✅ JWT | Uploads a document version; blocked if ticket is locked |

### Communication

| Method | URL | View | Auth | Description |
|---|---|---|---|---|
| `POST` | `/api/communication/send/` | `SendMessageView` | ✅ JWT | Sends a message (with optional attachment) on a ticket |
| `GET` | `/api/communication/<ticket_id>/` | `GetMessagesView` | ✅ JWT | Returns all messages for a ticket, ordered by time |

### Admin

| Method | URL | Auth | Description |
|---|---|---|---|
| `GET/POST/…` | `/admin/` | ✅ Staff | Full Django Admin UI for all models |

---

## 7. Authentication Flow

```
Browser (Next.js)               Django Backend
      │                               │
      │── POST /api/auth/login/ ─────►│
      │   { username, password }      │── LoginSerializer.validate()
      │                               │     └── django.authenticate()
      │                               │── RefreshToken.for_user(user)
      │◄──────────────────────────────│
      │   { access, refresh,          │  access: 8 hours
      │     role, username }          │  refresh: 1 day
      │                               │
      │  localStorage.setItem("token") + localStorage.setItem("role")
      │  → router.push("/dashboard")
      │                               │
      │── GET /api/tickets/admin/ ───►│  Authorization: Bearer <access_token>
      │                               │── JWTAuthentication validates token
      │                               │── IsAuthenticated permission check
      │◄──────────────────────────────│
      │   [ { ticket data }, … ]      │
```

---

## 8. Ticket Lifecycle State Machine

```
            ┌──────────────────────────────────────────────┐
            │             Ticket Created  (POST /create/)  │
            └───────────────────────┬──────────────────────┘
                                    │ auto-assign reviewer
                                    ▼
                             ┌────────────┐
                             │  ASSIGNED  │  ← Reviewer has been assigned
                             └─────┬──────┘
                                   │ POST /start/<id>/  (reviewer only)
                                   ▼
                             ┌────────────┐
                             │  STARTED   │  ← Reviewer is actively working
                             └─────┬──────┘
                      ┌────────────┴──────────────┐
                      │ POST /draft/<id>/          │ POST /approval/<id>/
                      ▼                            ▼
                  ┌───────┐                  ┌──────────┐
                  │ DRAFT │◄─────────────────│ APPROVAL │
                  └───────┘  (needs rework)  └────┬─────┘
                                                  │ POST /approve/<id>/  (admin only)
                                                  ▼
                                           ┌──────────┐
                                           │ APPROVED │  ← locked = True
                                           └──────────┘
```

**Status descriptions:**

| Status | Set By | Meaning |
|---|---|---|
| `created` | System (default) | Ticket just submitted; transitions to `assigned` immediately if a matching reviewer is found |
| `assigned` | System (auto) | A reviewer matching `reviewer_field` + `specialization` has been assigned |
| `started` | Reviewer | Reviewer has begun working on the ticket |
| `draft` | Reviewer | Document returned to Maker for revision |
| `approval` | Reviewer | Document meets requirements; awaiting admin approval |
| `approved` | Admin | Formally approved; `locked = True` set — no further uploads allowed |
| `locked` | (reserved) | Status option reserved in `STATUS_CHOICES`; not currently set by any view |

> **Note:** Every status transition (`assigned → started`, `started → draft`, `started → approval`, `approval → approved`) creates a `StatusLog` entry in the `workflow` app for a full, auditable history.

---

## 9. Key Design Decisions

| Decision | Rationale |
|---|---|
| **Custom `User` model** (`AbstractUser`) | Extends Django's built-in user with `role`, `reviewer_field` (FK → `Category`), and `specialization` (FK → `SubCategory`). The FK-based specialization allows type-safe matching for reviewer auto-assignment without string comparison. |
| **JWT authentication (simplejwt)** | Stateless — no server-side session store. Each request authenticates via `Authorization: Bearer <token>`. 8-hour access window with 1-day refresh token. Token + role stored in `localStorage` on the frontend. |
| **Reviewer auto-assignment** | `CreateTicketView` queries `User.objects.filter(role='reviewer', reviewer_field=ticket.category, specialization=ticket.subcategory).first()`. Returns `HTTP 400` if no matching reviewer is found, preventing orphaned tickets. |
| **`read_only_fields` in `TicketSerializer`** | `created_by`, `assigned_reviewer`, `status`, and `locked` are controlled exclusively by server-side business logic; the client cannot tamper with them. |
| **StatusLog written by ticket views** | All five status-mutating views (`StartTicketView`,… `ApproveTicketView`) create `StatusLog` entries directly. This keeps audit logic co-located with the business logic rather than using Django signals. |
| **`MEDIA_ROOT = BASE_DIR / 'media'`** | Absolute path using `pathlib.Path` ensures media file serving works correctly regardless of the working directory from which `runserver` or the WSGI server is started. |
| **Document version auto-increment** | `DocumentVersion.save()` queries the latest version on the same ticket and increments (`V1`, `V2`, …). This is handled in the model layer — not the serializer or view — keeping it DRY. |
| **`locked` flag on `Ticket`** | When a ticket is approved, `locked=True` is set. `UploadDocumentView` checks this flag before accepting any file upload, preventing changes to an approved document. |
| **Role-based dashboard routing (frontend)** | `/dashboard/page.js` reads `role` from `localStorage` and renders the correct dashboard component. No separate routes per role — one URL, different components. |
| **`stopPropagation` on Approve button** | The ticket table rows have an `onClick` that opens a detail modal. The Approve button uses `e.stopPropagation()` so approving a ticket doesn't simultaneously open its modal. |
| **Categories endpoints are public** | `load_categories` and `load_subcategories` are plain Django views without DRF auth. This simplifies the MakerDashboard form dropdowns (no token needed for taxonomy lookup) while posing no security risk since category data is non-sensitive. |
| **SQLite for development** | Zero-configuration local storage. Swap to PostgreSQL for staging/production by changing the `DATABASES` setting. |
| **`CORS_ALLOW_ALL_ORIGINS = True`** | Allows the Next.js dev server (port 3000) to call the Django API (port 8000). **Must be restricted to specific origins before production deployment.** |
