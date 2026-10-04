# West Rand Judo Association Website

A website for the **West Rand Judo Association (WRJA)**, an umbrella organization supporting affiliated judo clubs across the West Rand, South Africa, including Golden Score Judo and KJK Judo Club.

The website covers:

* Instructor profiles
* Events calendar and event details
* Competitions with registration links and payment instructions
* Proof of payment uploads
* Club news
* Photo gallery
* User login and sign-up with real accounts
* A private admin console for the committee
* Contact form and location
* Live Mapbox maps
* AI chatbot powered by Google Gemini

Built as the practical deliverable for the **INSY7315 Work-Integrated Learning** module.

**Live site:** https://westrandjudoassociationwrja-website.vercel.app

## Current State

The website is a working full-stack application. It uses real WRJA content, including instructor biographies, program descriptions, contact details and published news coverage of club athletes.

Currently:

* Login, sign-up and logout work against Supabase Auth.
* User accounts and profiles are stored in a Supabase Postgres database.
* Events, competitions, news, contact messages and payment records are stored in Supabase and managed from the admin console.
* Images are stored in Supabase Storage. Proof of payment files are kept in a private bucket.
* The Gemini AI chatbot runs through the Express backend, so the API key never reaches the browser.
* The admin console is fully connected to the backend and database.
* The site is deployed on Vercel as one project: the React frontend and the Express API.

## Features

### Public visitors

* Home page with an image slider, programs, news, competitions and an interactive Mapbox map
* About page, instructor profiles, photo gallery with lightbox, FAQ page
* News list and news article pages
* Competitions list and competition detail pages
* Contact form with rate limiting and a hidden honeypot field against bots
* AI chatbot that answers questions about WRJA clubs, programs, events and FAQs
* Mobile friendly layout with a tap-to-open navigation menu

### Members (athletes and guardians)

* Create an account, log in and log out
* View the events calendar and event details (login required)
* Open competition pages with the registration link and payment instructions
* Upload proof of payment as PDF, JPG or PNG (up to 6 MB)
* See a list of their own payment uploads and their review status

### Administrators

* Overview dashboard with live counts and system health
* Add, edit and delete competitions, events and news posts, with image uploads
* Read, mark as read and delete contact messages
* Review payment proofs: approve, reject, download or delete
* Create, edit and delete users and change their role
* When deleting a user who has payment records, choose whether to keep or delete those records

## Technologies

* React 18
* Vite 7
* JavaScript
* CSS
* React Router 6
* Node.js 22
* Express 5
* Supabase (Postgres, Auth, Storage)
* Google Gemini AI
* Mapbox GL JS
* Vercel (hosting and serverless functions)
* Git/GitHub

## How It Fits Together

```text
Browser (React)
   |
   |  /api/*   same origin, HttpOnly session cookie
   v
Express API   (Vercel serverless function, or a Node server locally)
   |
   +--> Supabase Auth       accounts and sessions
   +--> Supabase Postgres   events, competitions, news, payments, profiles
   +--> Supabase Storage    public-media (public), payment-proofs (private)
   +--> Google Gemini       chatbot
```

The browser never holds a secret key. All privileged work happens in the Express API, which is the only place that uses the Supabase service role key.

## Setup

### Requirements

* Node.js 22 or newer
* A Supabase project
* A Google Gemini API key
* A Mapbox public token

### 1. Install dependencies

From the root project folder:

```powershell
npm install
```

The root `package.json` contains the dependencies for both the frontend and the backend, so one install is enough.

### 2. Create the required environment file

**IMPORTANT:** `server/.env` is intentionally **not included in the GitHub repository** because it contains API credentials.

Anyone cloning this project must create this file manually.

Create this file inside the server folder:

```text
server/.env
```

Add the values required by your deployment:

```env
VITE_MAPBOX_TOKEN=your_mapbox_token_here
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

Replace the placeholders with your own credentials. Never add a `VITE_` prefix to secret keys such as `SUPABASE_SERVICE_ROLE_KEY` or `GEMINI_API_KEY`.

**Do not copy API keys from someone else's environment file or commit `server/.env` to GitHub. Do not send it inside zip files either.**

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Public key. Safe in the browser because Row Level Security protects the data |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server only. Bypasses Row Level Security |
| `GEMINI_API_KEY` | Yes | Powers the chatbot |
| `GEMINI_API_KEYS` | No | Extra Gemini keys the chatbot can fall back to |
| `GEMINI_MODELS` | No | Comma separated list of Gemini models to try in order |
| `VITE_MAPBOX_TOKEN` | Yes | Map display |
| `ALLOWED_ORIGINS` | Production | Comma separated site URLs allowed to call the API |
| `TRUST_PROXY` | Production | Set to `true` behind Vercel so cookies and IP rate limits work |
| `WRJA_DATA_DIR` | No | Temporary folder for default images. On Vercel it defaults to the system temp folder |
| `PORT` | No | Local API port. Default is 5000 |

### Required Environment Files

Your project should look like:

```text
wrja-website/
│
├── server/
│   ├── .env                ← YOU MUST CREATE THIS
│   ├── .env.example        ← placeholder values, safe to commit
│   ├── server.js
│   └── package.json
│
└── ...
```

The `server/.env` file supplies both the backend and Vite frontend configuration.

## Run Locally

The project is configured to start the frontend and backend together.

From the root project folder:

```powershell
npm run dev
```

This starts:

```text
Vite frontend       http://localhost:5173
Express/Gemini API  http://localhost:5000
```

Vite proxies `/api` and `/uploads` to the Express server, so the frontend and API behave like one site.

## Build

To create a production build:

```powershell
npm run build
```

To preview the production build locally:

```powershell
npm run preview
```

## Supabase Setup

### 1. Create the project

Create a project at supabase.com and copy the Project URL, the anon key and the service role key (Settings > API).

### 2. Create the tables

The database contains these tables:

| Table | Purpose |
| --- | --- |
| `profiles` | One row per user: name, phone, email, role, active flag |
| `athletes` | Athlete details linked to a profile |
| `guardians`, `guardian_athletes` | Guardians and the athletes they look after |
| `clubs`, `programs`, `instructors`, `program_instructors` | Club and program information |
| `events` | Events and competitions, including registration and payment fields |
| `event_registrations` | Athlete registrations for events |
| `grading_records` | Grade history for athletes |
| `news_posts` | News articles |
| `gallery_items` | Gallery images |
| `trial_requests` | Trial session requests |
| `contact_messages` | Messages from the contact form |
| `payment_proofs` | Uploaded proof of payment records |

Roles are stored in `profiles.profile_role` as `athlete`, `guardian` or `administrator`.

### 3. Run the migrations

Run every file in `database/migrations/` in order, using the Supabase SQL Editor. These files:

* normalise public media paths and set upload limits
* change the foreign keys so a user can be deleted without destroying payment records, and add the `uploader_name` and `uploader_email` columns to `payment_proofs`
* add the `release_user_for_delete` function used when an administrator keeps a deleted member's payment records

### 4. Create the Storage buckets

| Bucket | Visibility | Used for |
| --- | --- | --- |
| `public-media` | Public | Event, competition and news images |
| `payment-proofs` | **Private** | Proof of payment files |

### 5. Turn on Row Level Security

Enable Row Level Security on every table and add policies:

* Public content (news, competitions) can be read by anyone.
* Member data can be read only by its owner or an administrator.
* Only administrators can create, change or delete content.

### 6. Set the redirect URLs

Under Authentication > URL Configuration, set the **Site URL** to your live address and add it to the Redirect URLs. Without this, sign-in and password links point to the wrong place.

### 7. Create the first administrator

1. Sign up through the website.
2. Run this in the Supabase SQL Editor:

```sql
update public.profiles
set profile_role = 'administrator'
where email = 'your-email@example.com';
```

After that, administrators can create and manage other users from the admin console.

## Deploying to Vercel

The frontend builds to static files and the Express app runs as one serverless function.

### Files that make this work

| File | Job |
| --- | --- |
| `api/index.js` | Exports the Express app as the Vercel function |
| `vercel.json` | Sends `/api/*` and `/uploads/*` to the function, and everything else to `index.html` |
| `vite.config.js` | Skips the Cloudflare plugin when building on Vercel |
| `server/server.js` | Exports the app and only calls `listen` when not on Vercel |

### Steps

1. Push the repository to GitHub and import it into Vercel.
2. Set the framework to **Vite**, the build command to `npm run build` and the output directory to `dist`.
3. Add the environment variables from the table above for Production. Include `TRUST_PROXY=true` and `ALLOWED_ORIGINS=https://your-site.vercel.app`.
4. Under Settings > Functions, choose a function region close to your Supabase region.
5. Deploy.
6. Open `/api/health`. It should return `{"success":true,"message":"WRJA AI server is running"}`.

Variables only apply to new deployments, so always redeploy after changing one.

### Limits on Vercel

* Request bodies are limited to 4.5 MB. Uploads are sent as base64, so keep images and payment proofs under about 3 MB.
* The disk is read-only except for the temp folder. All user uploads go to Supabase Storage.
* Rate limit counters are held in memory, so they reset between function instances.
* The first request after a quiet period can be slower because of a cold start.

## Project Structure

```text
api/
└── index.js                Vercel entry point, exports the Express app

database/
└── migrations/             SQL files to run in the Supabase SQL Editor

src/
├── components/
│   ├── NavigationBar       Header and mobile menu
│   ├── SiteFooter
│   ├── PageHeader
│   ├── Reveal
│   ├── HomePageImageSlider
│   ├── ProgramsSection
│   ├── TrainersSection
│   ├── CompetitionsSection / CompetitionCard
│   ├── EventsCalendar / EventCard
│   ├── NewsPost / NewsSection / NewsImageSlider
│   ├── GalleryItem / GalleryLightbox
│   ├── ContactForm / ContactMap / LocationSection
│   ├── ChatWidget
│   ├── Admin panels: Overview, Competitions, Events, News,
│   │   Contacts, Payments, Users
│   └── Other reusable sections and cards
│
├── pages/
│   ├── HomePage
│   ├── AboutPage
│   ├── ProgramsPage / ProgramDetailPage
│   ├── EventsPage / EventDetailPage
│   ├── CompetitionDetailPage / CompetitionPaymentPage
│   ├── ProofOfPaymentPage
│   ├── NewsPage / NewsDetailPage
│   ├── GalleryPage
│   ├── InstructorDetailPage
│   ├── FAQPage
│   ├── ContactPage
│   ├── LoginPage / SignupPage
│   ├── AdminPage
│   └── NotFoundPage
│
├── context/
│   └── AuthContext.jsx     Who is logged in, login, logout
│
├── data/                   Content and client stores for the admin console
│   ├── programs.js, instructors.js, faq.js, galleryItems.js, clubContacts.js
│   └── events.js, competitions.js, newsPosts.js, payments.js,
│       users.js, messages.js, contactMessages.js
│
├── services/
│   └── geminiChat.js       Talks to the chatbot endpoint
│
├── hooks/                  useCollection, useNotice, useAdminCounts,
│                           useEnquiryForm, useScrollReveal
│
├── lib/                    api.js, format.js, images.js, collections.js,
│                           supabaseClient.js, loadMapbox.js
│
├── styles/                 One CSS file per area. mobile.css loads last
│
├── App.jsx
└── main.jsx

server/
├── .env                    Not committed
├── server.js               Express app, middleware order, chatbot, static files
├── routes/api.js           Every API route and who may call it
├── auth.js                 Sessions, requireAuth, requireAdmin
├── security.js             Headers, CORS allow list, CSRF guard, rate limiter
├── validate.js             Input validation for every field
├── uploads.js              File type, size and signature checks
├── supabase.js             Supabase clients (public, user and admin)
├── eventsRepo.js           Events and competitions queries
├── newsRepo.js             News queries
├── paymentsRepo.js         Payment proof queries and file storage
├── contactMessagesRepo.js  Contact message queries
├── adminUsersRepo.js       User management queries
├── systemRepo.js           Counts and health checks
├── mediaRepo.js            Public image storage
├── Knowledge/              JSON files the chatbot uses
└── tests/                  API and security tests
```

`server/db.js`, `server/repo.js`, `server/schema.sql` and `server/seed.js` belong to an earlier local SQLite version. The live site does not use them.

## API Overview

### Public

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| GET | `/api/competitions` | List competitions |
| GET | `/api/news` | List news posts |
| POST | `/api/messages` | Send a contact message (rate limited) |
| POST | `/api/auth/signup` | Create an account |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Current user |
| POST | `/api/chat` | Ask the chatbot |
| POST | `/api/chat/reset` | Clear the chat session |

### Logged-in members

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/events` | List events |
| POST | `/api/payments` | Upload proof of payment |
| GET | `/api/payments/mine` | List own uploads |
| GET | `/api/payments/:id/file` | Download own proof file |

### Administrators only (`/api/admin/...`)

| Area | Routes |
| --- | --- |
| Counts | `GET /counts` |
| Uploads | `POST /uploads` |
| Competitions | `POST /competitions`, `PUT` and `DELETE /competitions/:id` |
| Events | `POST /events`, `PUT` and `DELETE /events/:id` |
| News | `POST /news`, `PUT` and `DELETE /news/:id` |
| Messages | `GET /messages`, `POST /messages/read-all`, `PATCH` and `DELETE /messages/:id` |
| Payments | `GET /payments`, `PATCH` and `DELETE /payments/:id` |
| Users | `GET /users`, `POST /users`, `PUT` and `DELETE /users/:id` |

## Admin Guide

### Competitions

Name, type, date, location and description are required. Choose a registration status, add the external registration link, and tick **Payment required directly to WRJA** when members must pay the club. The payment instructions then appear on the competition page, and members can upload proof of payment.

Leave the payment option unticked for competitions that only need the registration link, such as Gauteng Open and Gauteng Kata.

### Events

Type is a dropdown with three options: Competition, Grading and Training camp. Name, date and location are required.

### News

Add a title, body and image. Published posts appear on the Home and News pages straight away.

### Messages

New contact messages show an unread count in the sidebar. Open a message to read it, or mark everything as read.

### Payments

Open the Payments page to view uploads, approve or reject them and download the files.

### Deleting a user

If the member has payment records, the console asks whether to keep them. Keeping a record stores the member's name and email on it and leaves the file in Storage. Deleting removes the records and the files. Administrators cannot delete their own account or other administrators.

## AI Chatbot

The website includes an AI chatbot powered by **Google Gemini**.

The frontend chatbot service is located at:

```text
src/services/geminiChat.js
```

The backend server is located at:

```text
server/server.js
```

The chatbot communicates with the Express backend so that the Gemini API key is not exposed directly in the frontend. It answers using WRJA-specific information stored in:

```text
server/Knowledge/        clubs, programs, instructors, events, FAQ
src/data/faq.js          FAQ page content
```

If one Gemini key or model is unavailable, the server can fall back to the next one set in `GEMINI_API_KEYS` and `GEMINI_MODELS`. The chat endpoint is rate limited.

## Security

* Sessions are `HttpOnly`, `SameSite=Lax` cookies. Editing the browser's local storage or the React code cannot turn a member into an administrator, because the role is checked on the server for every protected route.
* An origin check blocks cross-site requests, and security headers are set on responses.
* Rate limits apply to login, sign-up, contact messages, payment uploads and admin uploads.
* Uploads are checked for file signature, size and type, and saved under random names.
* The contact form has a honeypot field to catch bots.
* Payment proofs are kept in a private bucket and served only to the owner or an administrator.
* Input is validated on the server for every field, whatever the form allows.
* Secrets live only in environment variables. Rotate any key that has been shared by mistake.

## Environment Security

Never commit the environment file to GitHub:

```text
server/.env
```

These files can contain private API credentials.

Use `server/.env.example` with placeholder values to document the variables:

```env
VITE_MAPBOX_TOKEN=your_mapbox_token_here
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key_here
```

If a key is ever exposed, rotate it in the Supabase or Google dashboard and update the value in Vercel.

## Content Management

Static content that rarely changes still lives in JavaScript data files:

```text
src/data/programs.js
src/data/instructors.js
src/data/galleryItems.js
src/data/faq.js
src/data/clubContacts.js
```

This allows the same content to be displayed consistently across different pages without duplicating information.

Content that the committee changes often is stored in Supabase and managed from the admin console:

* Competitions
* Events
* News posts
* Contact messages
* Payment proofs
* Users

Changes are saved on the server and are visible to every visitor straight away.

## Naming Convention

The project uses full, descriptive names throughout the codebase.

Pages follow the naming convention:

```text
HomePage
AboutPage
ProgramsPage
ProgramDetailPage
EventsPage
EventDetailPage
CompetitionDetailPage
NewsPage
NewsDetailPage
GalleryPage
ContactPage
LoginPage
SignupPage
AdminPage
```

Components and variables use descriptive names rather than unexplained abbreviations.

## Mapbox

Mapbox is used to display the WRJA location on the Contact and Home pages.

The application reads the Mapbox token from:

```env
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

The token must be placed in `server/.env` locally and in the Vercel environment variables in production.

**Remember to create this file after cloning the repository.**

The Mapbox script is loaded only after the page has rendered (`src/lib/loadMapbox.js`), so it does not slow down the first view.

## Performance

* Pages are split into separate files and loaded on demand with React lazy loading.
* The page shows straight away while the login status loads in the background.
* Mapbox and the chat widget load after the main content.
* Only the first hero image loads at the start. The others load just before they are shown.
* Large images should be compressed before upload. A helper script is available at `scripts/optimize-images.mjs`.

## Testing

Run the backend tests from the root folder:

```powershell
npm --prefix server test
```

The tests cover login and role checks, access to payment files, input validation and upload checks.

Before handing in a change, also check these by hand on the live site:

1. Register, log in and log out.
2. Open an event and a competition as a member.
3. Upload a small proof of payment and view it as an administrator.
4. Add, edit and delete a test competition, event and news post.
5. View the site at phone width using the browser's device mode.

## Troubleshooting

| Problem | Likely cause and fix |
| --- | --- |
| `/api/health` returns 500 | Open Vercel Logs. A read-only disk error means an old deployment is still running |
| Every API call returns 500 | A Supabase environment variable is missing. Add it and redeploy |
| "Request blocked" errors | `ALLOWED_ORIGINS` does not match the site URL exactly |
| Logged out on the next page | `TRUST_PROXY` is not set to `true` |
| Blank maps | `VITE_MAPBOX_TOKEN` is missing, or an ad blocker is blocking Mapbox |
| Upload fails with a 413 error | The file is too large for Vercel. Compress it to under about 3 MB |
| Cannot delete a user | Run the migrations that set the foreign key delete rules |
| Admin tables or sidebar look broken | Check that `mobile.css` does not set `overflow-x: hidden` on `body` or a global `table` rule |
| Changes to variables have no effect | Redeploy. Variables only apply to new deployments |

## Known Limitations

* Uploaded files must stay under about 3 MB on Vercel.
* Rate limiting is per function instance, so it is a safeguard rather than a hard limit.
* The AI chatbot depends on the Gemini free quota and can be slow or unavailable when that is used up.
* The contact form stores messages but does not send email notifications.
* Online card payments are not built in. Members pay the club directly and upload proof of payment.

## Next Steps

### Notifications

Send an email when a contact message arrives, and when a payment proof is approved or rejected.

### Registrations

Let members register athletes for events inside the site, using the existing `event_registrations` table, instead of only using external links.

### Payments

Add an online payment option and automatic payment matching.

### Gallery and Media

Move the gallery to Supabase Storage so the committee can add and remove photos from the admin console.

### Real Media

Replace remaining placeholder media with:

* Real instructor headshots
* Real training photographs
* Real competition photographs
* Real event photographs
* Additional WRJA club imagery

## Project Status

| Feature                           | Status                         |
| --------------------------------- | ------------------------------ |
| Frontend                          | Complete                       |
| Responsive interface              | Complete                       |
| WRJA content                      | Implemented                    |
| Mapbox integration                | Implemented                    |
| Login and sign-up                 | Complete, connected to Supabase |
| Production authentication         | Complete                       |
| Database                          | Complete, Supabase Postgres    |
| Express backend                   | Complete                       |
| AI chatbot                        | Implemented                    |
| Events and competitions           | Complete                       |
| Proof of payment uploads          | Complete                       |
| Admin content management          | Complete                       |
| User management                   | Complete                       |
| Deployment                        | Live on Vercel                 |
| Email Service                     | Complete                       |



## Academic Context

This project was developed as the practical deliverable for the:

**INSY7315 Work-Integrated Learning module**

The website demonstrates the practical application of web application development principles, including component-based development, responsive web design, reusable data structures, client-side routing, third-party service integration, backend development, database design, secure authentication, cloud deployment and AI integration.