# BlogNest — AI-Powered Blog CMS Backend

A REST API for a multi-author blogging platform with role-based access control,
comment moderation, and AI-assisted content generation via Google Gemini.

Built with **Node.js, Express.js, MongoDB (Mongoose)**.

## Features

- JWT authentication + bcrypt password hashing
- Role-based access control: **Admin, Editor, Author, Reader**
- Blog CRUD with a publishing workflow: `draft → pending → scheduled → published`
- Categories & tags, full-text search, filtering, sorting, pagination
- Comment creation + moderation queue (`approved / pending / spam`)
- Per-author post analytics (counts, views, likes by status)
- AI features (Gemini): blog generation from a topic, content summarization, reader FAQ assistant
- Security: Helmet, CORS, rate limiting, Mongo query sanitization, XSS sanitization, centralized error handling

## 1. Requirements

- Node.js v16+
- npm v8+
- MongoDB (local or Atlas)
- A Gemini API key from https://aistudio.google.com/app/apikey (only needed for AI routes)

## 2. Setup

```bash
cd BlogNest
npm install
cp .env.example .env
# then edit .env: set MONGO_URI, JWT_SECRET, GEMINI_API_KEY, etc.
```

Start MongoDB locally, or point `MONGO_URI` at an Atlas cluster.

Create your first admin account:

```bash
ADMIN_EMAIL=admin@blognest.com ADMIN_PASSWORD=ChangeMe123! npm run seed:admin
```

Run the server:

```bash
npm run dev     # with nodemon
# or
npm start
```

The API is now live at `http://localhost:5000/api`. Check `GET /api/health`.

## 3. Role Permissions Summary

| Action                              | Reader | Author | Editor | Admin |
|--------------------------------------|:---:|:---:|:---:|:---:|
| Read published posts / comment       | ✅ | ✅ | ✅ | ✅ |
| Create posts (goes to `pending`)     |    | ✅ | ✅ | ✅ |
| Edit/delete own posts                |    | ✅ | ✅ | ✅ |
| Publish / change any post's status   |    |    | ✅ | ✅ |
| Manage categories                    |    |    | ✅ | ✅ |
| Moderate comments                    |    |    | ✅ | ✅ |
| Manage users & roles                 |    |    |    | ✅ |
| AI blog generation                   |    | ✅ | ✅ | ✅ |
| AI summarize / FAQ                   | ✅* | ✅ | ✅ | ✅ |

\* FAQ is public; summarize requires login.

## 4. API Reference (selected)

### Auth — `/api/auth`
- `POST /register` — `{ name, email, password }` → self-registers as `reader` (or `author` if specified)
- `POST /login` — `{ email, password }` → `{ token, user }`
- `GET /me` — current user (Bearer token required)
- `PATCH /update-password` — `{ currentPassword, newPassword }`

### Posts — `/api/posts`
- `GET /` — list posts (`?q=search&category=..&status=..&page=1&limit=10&sort=-createdAt`)
- `POST /` — create post *(author/editor/admin)*
- `GET /mine` — your own posts, any status
- `GET /analytics/mine` — your post performance stats
- `GET /:id` — single post (view count increments for published posts)
- `PATCH /:id` — edit post (owner or staff)
- `PATCH /:id/status` — change publish status *(editor/admin)*
- `PATCH /:id/like` — like a post
- `DELETE /:id` — delete post (owner or staff)

### Comments — `/api/posts/:postId/comments` and `/api/comments`
- `GET /api/posts/:postId/comments` — approved comments (staff see all)
- `POST /api/posts/:postId/comments` — `{ text }`
- `GET /api/comments/queue` — pending moderation queue *(editor/admin)*
- `PATCH /api/comments/:id/moderate` — `{ moderationStatus }` *(editor/admin)*
- `DELETE /api/comments/:id` — owner or staff

### Categories — `/api/categories`
- `GET /`, `POST /` *(editor/admin)*, `GET /:id`, `PATCH /:id` *(editor/admin)*, `DELETE /:id` *(editor/admin)*

### Users — `/api/users` *(admin only)*
- `GET /`, `GET /:id`, `PATCH /:id/role`, `PATCH /:id/deactivate`, `DELETE /:id`

### AI — `/api/ai`
- `POST /generate-blog` — `{ topic, tone?, length?, save? }` *(author/editor/admin)*
- `POST /summarize` — `{ content }` or `{ postId }`, `{ maxSentences?, save? }`
- `POST /faq` — `{ question, context? }` — public

## 5. Project Structure

```
BlogNest/
├── server.js              # entry point: loads env, connects DB, starts server
├── app.js                 # Express app: middleware pipeline + route mounting
├── config/db.js           # Mongoose connection
├── models/                 # userModel, postModel, categoryModel, commentModel
├── controllers/            # business logic per resource
├── routes/                 # route definitions + validation wiring
├── middleware/              # auth, roles, rate limiting, error handling, validation
├── services/aiService.js    # Gemini integration (generate / summarize / FAQ)
└── utils/                  # AppError, catchAsync, generateToken, APIFeatures, seedAdmin
```

## 6. Testing with Postman

1. `POST /api/auth/register` to create an author account, or use the seeded admin.
2. `POST /api/auth/login` → copy the returned `token`.
3. Set header `Authorization: Bearer <token>` on subsequent requests.
4. As admin, `PATCH /api/users/:id/role` to promote a user to `editor`.
5. Create a post as author → it lands in `pending` → editor moves it to `published` via `PATCH /api/posts/:id/status`.

## Notes

- AI routes require `GEMINI_API_KEY` in `.env`; without it they respond with a clear `503` rather than crashing the server.
- All list endpoints support `?page=&limit=&sort=&fields=&q=` and field-based filters (e.g. `?status=published`).
- This backend is intentionally frontend-agnostic — pair it with any client (React, Next.js, mobile app, etc.).
