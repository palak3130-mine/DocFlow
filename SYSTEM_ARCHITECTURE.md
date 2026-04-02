# DocFlow — System Architecture

> A Django REST Framework backend for a document review and approval workflow platform.
> Users (Makers, Reviewers, Admins) collaborate on documents through a ticket-based lifecycle,
> progressing from creation → review → draft → approval → approved → locked.

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
5. [Data Model Relationships](#5-data-model-relationships)
6. [API Endpoint Map](#6-api-endpoint-map)
7. [Authentication Flow](#7-authentication-flow)
8. [Ticket Lifecycle State Machine](#8-ticket-lifecycle-state-machine)
9. [Key Design Decisions](#9-key-design-decisions)

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (Browser / App)              │
└─────────────────────────┬───────────────────────────────┘
                          │  HTTPS  (JWT Bearer token)
┌─────────────────────────▼───────────────────────────────┐
│              Django REST Framework  (Port 8000)         │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐    │
│  │  /admin/ │  │ /api/auth│  │  /api/tickets/     │    │
│  │ (Django  │  │  /login/ │  │  /create/          │    │
│  │  Admin)  │  └──────────┘  └────────────────────┘    │
│  └──────────┘                                           │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ ┌─────────┐  │
│  │  users   │  │ tickets  │  │documents │ │categori │  │
│  │   app    │  │   app    │  │   app    │ │  es app │  │
│  └──────────┘  └──────────┘  └──────────┘ └─────────┘  │
│                                                         │
│  ┌────────────────┐   ┌────────────────┐               │
│  │ communication  │   │    workflow     │               │
│  │      app       │   │      app        │               │
│  └────────────────┘   └────────────────┘               │
│                                                         │
│                   SQLite Database                       │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Web Framework | Django 4.2 | ORM, admin, middleware, URL routing |
| API Layer | Django REST Framework | Serializers, APIViews, permission classes |
| Authentication | djangorestframework-simplejwt | Stateless JWT access/refresh tokens |
| CORS | django-cors-headers | Allow cross-origin requests from the frontend |
| Database | SQLite (`db.sqlite3`) | Development database (swap to PostgreSQL via `psycopg2-binary` for production) |
| API Docs | drf-yasg | Auto-generated Swagger/OpenAPI UI |
| File Handling | Pillow, python-magic, django-cleanup | Image processing, MIME-type detection, auto-delete orphaned files |
| Production Server | Gunicorn | WSGI production app server |
| Environment | python-dotenv | `.env` variable loading |

---

## 3. Project Directory Map

```
DocFlow/
├── DocFlow.pdf                  # Project brief / specification document
├── requirements.txt             # Top-level Python dependency list
│
├── backend/                     # All backend source code lives here
│   ├── manage.py                # Django CLI entry point
│   ├── db.sqlite3               # SQLite development database
│   ├── requirements.txt         # Backend-specific dependency list (mirrors root)
│   │
│   ├── config/                  # Django project configuration package
│   │   ├── __init__.py
│   │   ├── settings.py          # All project settings (DB, auth, installed apps, JWT)
│   │   ├── urls.py              # Root URL router
│   │   ├── asgi.py              # ASGI entry point (async deployment)
│   │   └── wsgi.py              # WSGI entry point (Gunicorn / traditional deployment)
│   │
│   ├── users/                   # App: user accounts & JWT login
│   │   ├── models.py            # Custom User model with role + specialization
│   │   ├── serializers.py       # UserSerializer & LoginSerializer
│   │   ├── views.py             # LoginView (issues JWT tokens)
│   │   ├── urls.py              # /api/auth/login/
│   │   ├── admin.py             # Registers User in Django Admin
│   │   ├── apps.py              # App config (name: 'users')
│   │   ├── tests.py             # Placeholder test file
│   │   └── migrations/          # Auto-generated DB migrations
│   │
│   ├── tickets/                 # App: ticket creation & assignment
│   │   ├── models.py            # Ticket model (status, category, reviewer FK)
│   │   ├── serializers.py       # TicketSerializer
│   │   ├── views.py             # CreateTicketView (auto-assigns reviewer)
│   │   ├── urls.py              # /api/tickets/create/
│   │   ├── admin.py             # Registers Ticket in Django Admin
│   │   ├── apps.py              # App config (name: 'tickets')
│   │   ├── tests.py             # Placeholder test file
│   │   └── migrations/          # Auto-generated DB migrations
│   │
│   ├── documents/               # App: versioned document file storage
│   │   ├── models.py            # DocumentVersion model (file, version, uploader)
│   │   ├── views.py             # Placeholder (no endpoints yet)
│   │   ├── admin.py             # Registers DocumentVersion in Django Admin
│   │   ├── apps.py              # App config (name: 'documents')
│   │   ├── tests.py             # Placeholder test file
│   │   └── migrations/          # Auto-generated DB migrations
│   │
│   ├── categories/              # App: document classification taxonomy
│   │   ├── models.py            # Category & SubCategory models
│   │   ├── views.py             # Placeholder (no endpoints yet)
│   │   ├── admin.py             # Registers Category & SubCategory in Django Admin
│   │   ├── apps.py              # App config (name: 'categories')
│   │   ├── tests.py             # Placeholder test file
│   │   └── migrations/          # Auto-generated DB migrations
│   │
│   ├── communication/           # App: per-ticket messaging with attachments
│   │   ├── models.py            # Communication model (message, sender, attachment)
│   │   ├── views.py             # Placeholder (no endpoints yet)
│   │   ├── admin.py             # Registers Communication in Django Admin
│   │   ├── apps.py              # App config (name: 'communication')
│   │   ├── tests.py             # Placeholder test file
│   │   └── migrations/          # Auto-generated DB migrations
│   │
│   └── workflow/                # App: status change audit log
│       ├── models.py            # StatusLog model (old_status → new_status, who, when)
│       ├── views.py             # Placeholder (no endpoints yet)
│       ├── admin.py             # Registers StatusLog in Django Admin
│       ├── apps.py              # App config (name: 'workflow')
│       ├── tests.py             # Placeholder test file
│       └── migrations/          # Auto-generated DB migrations
│
├── frontend/                    # Frontend placeholder (currently empty)
├── docker/                      # Docker configuration (currently empty)
├── docs/                        # Extended documentation (currently empty)
└── scripts/                     # Utility/automation scripts (currently empty)
```

---

## 4. File-by-File Reference

### 4.1 Root

| File | What It Does |
|---|---|
| `requirements.txt` | Declares all Python package dependencies for the entire project. Install with `pip install -r requirements.txt`. |
| `DocFlow.pdf` | Project specification/brief document describing the system requirements. |

---

### 4.2 `backend/config` — Django Project Core

| File | What It Does |
|---|---|
| `settings.py` | Central configuration hub. Declares `INSTALLED_APPS` (6 local apps + DRF + CORS), sets `AUTH_USER_MODEL = 'users.User'` to use the custom user model, configures JWT authentication as the default DRF authenticator, sets `CORS_ALLOW_ALL_ORIGINS = True` for development, and defines JWT token lifetimes (8h access / 1d refresh). |
| `urls.py` | **Root URL router.** Mounts the Django admin at `/admin/`, delegates all auth endpoints to `users.urls` under `/api/auth/`, and all ticket endpoints to `tickets.urls` under `/api/tickets/`. |
| `wsgi.py` | WSGI application entry point. Used by Gunicorn and traditional WSGI servers for synchronous deployment. |
| `asgi.py` | ASGI application entry point. Used for async-capable deployment servers (e.g., Uvicorn, Daphne). |
| `__init__.py` | Marks `config/` as a Python package. Empty. |
| `manage.py` | Django's command-line utility. The single entry point for all management tasks: `runserver`, `migrate`, `createsuperuser`, `makemigrations`, etc. Points to `config.settings`. |
| `db.sqlite3` | The SQLite development database file. Contains all persisted data for local development. **Should not be committed to version control in production.** |

---

### 4.3 `backend/users` — Authentication & Role Management

**Purpose:** Manages user identity. Extends Django's built-in `AbstractUser` with a `role` field and `specialization` field. Exposes a JWT login endpoint.

| File | What It Does |
|---|---|
| `models.py` | Defines the custom `User` model extending `AbstractUser`. Adds a `role` field (choices: `maker`, `reviewer`, `admin`) and a `specialization` field (free text, nullable). This model is the **`AUTH_USER_MODEL`** for the entire project. |
| `serializers.py` | Contains two serializers: **`UserSerializer`** (full model serializer for all User fields) and **`LoginSerializer`** (validates `username`/`password` credentials using Django's `authenticate()` and raises `ValidationError` on failure). |
| `views.py` | **`LoginView`** — A public (`AllowAny`) `APIView`. Accepts `POST` with credentials, validates through `LoginSerializer`, generates a `RefreshToken` via simplejwt, and returns `access` token, `refresh` token, `role`, and `username` in the response. |
| `urls.py` | Maps `POST /api/auth/login/` → `LoginView`. |
| `admin.py` | Registers the `User` model so it is manageable from the Django Admin panel. |
| `apps.py` | Django `AppConfig` for the `users` app. Sets `default_auto_field = BigAutoField`. |
| `tests.py` | Placeholder. No tests implemented yet. |
| `migrations/` | Auto-generated migration files that track schema changes to the `User` model. |

---

### 4.4 `backend/tickets` — Ticket Lifecycle Engine

**Purpose:** The core business domain. A `Ticket` represents a document review request. On creation, a reviewer is automatically assigned based on their `specialization` matching the ticket's `Category`.

| File | What It Does |
|---|---|
| `models.py` | Defines the `Ticket` model with: `title`, `category` (FK → `Category`), `subcategory` (FK → `SubCategory`), `created_by` (FK → `User`), `assigned_reviewer` (nullable FK → `User`), `status` (choices: `created`, `reviewing`, `draft`, `approval`, `approved`, `locked`), `created_at`, and a `locked` boolean flag. |
| `serializers.py` | **`TicketSerializer`** — A `ModelSerializer` for all fields. Marks `created_by`, `assigned_reviewer`, `status`, and `locked` as **read-only** (these are set server-side, not by the client). |
| `views.py` | **`CreateTicketView`** — An authenticated `APIView`. On `POST`: validates and saves the ticket with `created_by=request.user`, then immediately queries for a `reviewer` whose `specialization` matches `ticket.category.name`, assigns them as `assigned_reviewer`, sets `status='reviewing'`, and saves again. This implements auto-reviewer assignment. |
| `urls.py` | Maps `POST /api/tickets/create/` → `CreateTicketView`. |
| `admin.py` | Registers `Ticket` in the Django Admin panel. |
| `apps.py` | Django `AppConfig` for the `tickets` app. |
| `tests.py` | Placeholder. No tests implemented yet. |
| `migrations/` | Auto-generated migration files for the `Ticket` model. |

---

### 4.5 `backend/documents` — Document Version Store

**Purpose:** Tracks versioned file uploads attached to a ticket. Each upload is a distinct `DocumentVersion` record, enabling a full history of document revisions.

| File | What It Does |
|---|---|
| `models.py` | Defines `DocumentVersion` with: `ticket` (FK → `Ticket`), `file` (uploaded to `documents/` media folder), `version` (a version label string), `uploaded_by` (FK → `User`), and `uploaded_at` timestamp. |
| `views.py` | Placeholder. No API endpoints implemented yet. |
| `admin.py` | Registers `DocumentVersion` in the Django Admin panel (allows manual file management via admin). |
| `apps.py` | Django `AppConfig` for the `documents` app. |
| `tests.py` | Placeholder. No tests implemented yet. |
| `migrations/` | Auto-generated migration files for the `DocumentVersion` model. |

---

### 4.6 `backend/categories` — Taxonomy / Classification

**Purpose:** Provides a two-level classification system (Category → SubCategory) used to tag tickets and match reviewers by specialization.

| File | What It Does |
|---|---|
| `models.py` | Defines two models: **`Category`** (name string, e.g. "Finance") and **`SubCategory`** (FK → `Category` + name, e.g. "Invoices"). The reviewer auto-assignment in `tickets/views.py` matches `User.specialization` against `Category.name`. |
| `views.py` | Placeholder. No API endpoints implemented yet. |
| `admin.py` | Registers both `Category` and `SubCategory` in Django Admin, allowing admins to manage the taxonomy. |
| `apps.py` | Django `AppConfig` for the `categories` app. |
| `tests.py` | Placeholder. No tests implemented yet. |
| `migrations/` | Auto-generated migration files for `Category` and `SubCategory` models. |

---

### 4.7 `backend/communication` — In-Ticket Messaging

**Purpose:** Allows participants (makers and reviewers) to send messages within the context of a specific ticket. Supports file attachments.

| File | What It Does |
|---|---|
| `models.py` | Defines the `Communication` model with: `ticket` (FK → `Ticket`), `message` (text body), `sender` (FK → `User`), `attachment` (optional file, uploaded to `chat/` media folder), and `created_at` timestamp. |
| `views.py` | Placeholder. No API endpoints implemented yet. |
| `admin.py` | Registers `Communication` in Django Admin. |
| `apps.py` | Django `AppConfig` for the `communication` app. |
| `tests.py` | Placeholder. No tests implemented yet. |
| `migrations/` | Auto-generated migration files for the `Communication` model. |

---

### 4.8 `backend/workflow` — Audit & Status History

**Purpose:** Immutable audit log. Every time a ticket's status changes, a `StatusLog` entry should be created, recording the old state, new state, who made the change, and when.

| File | What It Does |
|---|---|
| `models.py` | Defines `StatusLog` with: `ticket` (FK → `Ticket`), `old_status` (string), `new_status` (string), `changed_by` (FK → `User`), `timestamp` (auto-set on creation). Together these entries form a complete, ordered history of a ticket's lifecycle. |
| `views.py` | Placeholder. No API endpoints implemented yet. |
| `admin.py` | Registers `StatusLog` in Django Admin for manual inspection of audit trails. |
| `apps.py` | Django `AppConfig` for the `workflow` app. |
| `tests.py` | Placeholder. No tests implemented yet. |
| `migrations/` | Auto-generated migration files for the `StatusLog` model. |

---

## 5. Data Model Relationships

```
Category ──────────────────────────┐
    │                              │
    └── SubCategory                │
              │                    │
              └──────────────────► Ticket ◄────── User (created_by / assigned_reviewer)
                                      │
                         ┌────────────┼────────────────┐
                         │            │                │
                   DocumentVersion  Communication   StatusLog
                   (versioned files) (messages)   (audit trail)
```

| Relationship | Description |
|---|---|
| `Category` → `SubCategory` | One category has many subcategories (e.g. Finance → Invoices, Finance → Payroll) |
| `Ticket` → `Category` / `SubCategory` | Each ticket is tagged with one category and one subcategory |
| `User` → `Ticket` (created_by) | A **Maker** creates the ticket |
| `User` → `Ticket` (assigned_reviewer) | A **Reviewer** is auto-assigned by specialization match |
| `Ticket` → `DocumentVersion` | One ticket may have many document versions (revision history) |
| `Ticket` → `Communication` | One ticket may have many messages (discussion thread) |
| `Ticket` → `StatusLog` | One ticket has many status log entries (full audit trail) |

---

## 6. API Endpoint Map

| Method | URL | App | View | Auth Required | Description |
|---|---|---|---|---|---|
| `POST` | `/api/auth/login/` | `users` | `LoginView` | ❌ Public | Authenticates user and returns JWT tokens + role |
| `POST` | `/api/tickets/create/` | `tickets` | `CreateTicketView` | ✅ JWT | Creates a new ticket and auto-assigns a reviewer |
| `GET/POST/etc.` | `/admin/` | Django | Admin Panel | ✅ Staff | Full Django admin interface for all models |

> **Note:** The `documents`, `categories`, `communication`, and `workflow` apps have their models scaffolded but **no API endpoints are implemented yet**. These apps are currently manageable only through the Django Admin panel.

---

## 7. Authentication Flow

```
Client                          Server
  │                               │
  │── POST /api/auth/login/ ─────►│
  │   { username, password }      │
  │                               │── LoginSerializer.validate()
  │                               │     └── django.authenticate()
  │                               │── RefreshToken.for_user(user)
  │◄────────────────────────────── │
  │   {                           │
  │     access:  "<JWT>",         │  access token lifetime: 8 hours
  │     refresh: "<JWT>",         │  refresh token lifetime: 1 day
  │     role:    "maker",         │
  │     username: "john"          │
  │   }                           │
  │                               │
  │── GET /api/tickets/create/ ──►│  Authorization: Bearer <access_token>
  │                               │── JWTAuthentication validates token
  │                               │── IsAuthenticated permission check
  │                               │── view logic executes
  │◄─────────────────────────────── │
  │   { ticket data }             │
```

---

## 8. Ticket Lifecycle State Machine

```
              ┌──────────────────────────────────────────────────────┐
              │                  Ticket Created                      │
              │               POST /api/tickets/create/              │
              └─────────────────────────┬────────────────────────────┘
                                        │
                                   [auto-assign reviewer]
                                        │
                                        ▼
                                  ┌──────────┐
                                  │REVIEWING │  ← Reviewer inspects document
                                  └────┬─────┘
                                       │
                          ┌────────────┴─────────────┐
                          ▼                           ▼
                      ┌───────┐               ┌──────────┐
                      │ DRAFT │               │ APPROVAL │
                      └───────┘               └────┬─────┘
                          │     (needs revision)   │
                          └────────────────────────┤
                                                   ▼
                                            ┌──────────┐
                                            │ APPROVED │
                                            └────┬─────┘
                                                 │
                                                 ▼
                                           ┌──────────┐
                                           │  LOCKED  │  ← Immutable, archived
                                           └──────────┘
```

**Status descriptions:**

| Status | Who Sets It | Meaning |
|---|---|---|
| `created` | System (default) | Ticket just created; immediately transitions to `reviewing` |
| `reviewing` | System (auto) | Reviewer has been assigned and is now looking at the document |
| `draft` | Reviewer | Document sent back to Maker for revisions |
| `approval` | Reviewer | Document meets requirements; awaiting formal approval |
| `approved` | Admin/Reviewer | Document is formally approved |
| `locked` | Admin | Ticket is archived and no further changes are allowed |

---

## 9. Key Design Decisions

| Decision | Rationale |
|---|---|
| **Custom `User` model** (`AbstractUser`) | Extends Django's built-in user with `role` and `specialization` without losing built-in auth features. The `specialization` field enables the reviewer auto-assignment logic. |
| **JWT authentication (simplejwt)** | Stateless — the server doesn't need to store sessions. Each request authenticates via the `Authorization: Bearer <token>` header. Configured with an 8-hour access window. |
| **Auto-reviewer assignment** | `CreateTicketView` immediately queries for a reviewer whose `specialization == ticket.category.name`. This removes manual assignment overhead for the Maker. |
| **`read_only_fields` in TicketSerializer** | `created_by`, `assigned_reviewer`, `status`, and `locked` cannot be set by the client. These are controlled exclusively by server-side business logic. |
| **SQLite for development** | Zero-configuration local storage. `psycopg2-binary` is included in `requirements.txt` to support a straightforward swap to PostgreSQL for staging/production. |
| **CORS (`CORS_ALLOW_ALL_ORIGINS = True`)** | Allows the future frontend (currently empty) to call the API from any origin. **Must be restricted to specific origins before production deployment.** |
| **`django-cleanup`** | Automatically deletes orphaned media files (documents, chat attachments) when their database record is deleted, preventing file system bloat. |
| **`drf-yasg`** | Provides Swagger/OpenAPI documentation generation from the existing API views — useful as more endpoints are added. |
| **Placeholder apps (documents, categories, communication, workflow)** | Models are fully defined but API views/URLs are not yet wired up. These can be managed through `/admin/` in the interim. |
