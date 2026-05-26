# Productic — Frontend Client

A modern, full-featured web application built with **Next.js 16**, **React 19**, and **TypeScript**. Productic provides user authentication, an admin dashboard, and user profile management with a clean, accessible UI powered by shadcn/ui and Tailwind CSS.

---

## Features

- **Authentication** — Login, registration, and logout flows with JWT-based access tokens and refresh tokens
- **Session Sliding** — Automatic token refresh to keep users logged in without interruption
- **Admin Dashboard** — Manage users: list, view details, add, and delete users with search/filter support
- **User Profile** — View and update personal profile information
- **Dark / Light Theme** — System-aware theme toggle powered by `next-themes`
- **Form Validation** — Client-side validation with `zod` schemas and `react-hook-form`
- **Toast Notifications** — Non-blocking feedback for user actions
- **Image Support** — Remote images from `localhost` (dev) and Cloudinary (production)

---

## Tech Stack

| Category        | Library / Tool                                            |
| --------------- | --------------------------------------------------------- |
| Framework       | Next.js 16 (App Router, Turbopack)                        |
| Language        | TypeScript 5                                              |
| UI Components   | shadcn/ui (Radix UI primitives)                           |
| Styling         | Tailwind CSS 3                                            |
| Forms           | React Hook Form + Zod                                     |
| HTTP Client     | Custom `fetch` wrapper (`src/lib/http.ts`)                |
| Auth            | JWT (access token + refresh token) via Next.js API routes |
| Icons           | Lucide React                                              |
| Date Utilities  | date-fns                                                  |
| Package Manager | pnpm                                                      |

---

## Project Structure

```
src/
├── app/                     # Next.js App Router pages & layouts
│   ├── (auth)/              # Auth pages: login, register, logout
│   ├── admin/               # Admin dashboard (users management)
│   ├── me/                  # User profile page
│   └── api/                 # Next.js API routes (auth proxy)
├── apiRequests/             # API call functions (auth, user, product)
├── components/              # Shared UI components & shadcn/ui wrappers
├── lib/                     # Utilities: HTTP client, helpers, time utils
├── schemaValidations/       # Zod schemas for all data models
└── config.ts                # Environment variable validation
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 10

### Installation

```bash
pnpm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_ENDPOINT=http://localhost:5000
NEXT_PUBLIC_URL=http://localhost:3000
```

| Variable                   | Description                      |
| -------------------------- | -------------------------------- |
| `NEXT_PUBLIC_API_ENDPOINT` | Base URL of the backend REST API |
| `NEXT_PUBLIC_URL`          | Public URL of this Next.js app   |

### Running Locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
pnpm build
pnpm start
```

---

## Authentication Flow

1. User submits credentials via the login form.
2. The client calls the backend API (`v1/auth/login`) and receives an access token and a refresh token.
3. Tokens are stored in HTTP-only cookies via a Next.js API route (`/api/auth`).
4. A `SlideSession` component silently refreshes the access token before it expires.
5. On logout, the session is cleared both server-side and client-side.

---

## API Routes (Next.js)

| Route                          | Purpose                                          |
| ------------------------------ | ------------------------------------------------ |
| `POST /api/auth`               | Store tokens in server-side session cookie       |
| `POST /api/auth/logout`        | Clear session and forward logout to backend      |
| `POST /api/auth/slide-session` | Refresh the access token using the refresh token |

---

## Scripts

| Command      | Description                     |
| ------------ | ------------------------------- |
| `pnpm dev`   | Start dev server with Turbopack |
| `pnpm build` | Build for production            |
| `pnpm start` | Start production server         |
| `pnpm lint`  | Run ESLint                      |
