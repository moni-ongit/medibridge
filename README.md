# 🩺 MediBridge — Multilingual Telemedicine Platform

MediBridge is a full-stack telemedicine platform built to remove language barriers from
healthcare. It gives patients, doctors, and interpreters a shared, multilingual experience —
including a fully translated UI, live-translated subtitles during video consultations, and a
one-click human interpreter request system.

> Built as a demo/portfolio/hackathon project. Every external integration (speech-to-text,
> translation, video calling) ships with a **mock/demo mode** so the whole app runs with
> **zero paid API keys**, while the architecture is structured so real providers can be
> dropped in later.

---

## ✨ Features

- **Multilingual UI** — English, Tamil (தமிழ்), and Hindi (हिन्दी), powered by i18next. Switch
  languages instantly from the navbar; the whole app (nav, forms, dashboards, consultation
  room) updates immediately.
- **Role-based authentication** — Patients, Doctors, and Interpreters, with JWT auth,
  bcrypt password hashing, and protected/role-gated routes.
- **Appointment booking** — Patients browse doctors, filter by specialization, pick an
  available date/time, and book. Doctors confirm/cancel; both sides see live status.
- **Video consultations** — open only at the booked time (see *Scheduled consultation window* below). WebRTC peer-to-peer video calling (mic/camera toggle, end call),
  signaled over Socket.IO. Configurable to a real LiveKit deployment via environment
  variables.
- **Real-time translated subtitles** — Speech is captured with the browser's Web Speech API
  (or a demo fallback), sent to the backend, translated server-side through a pluggable
  `translationService`, and broadcast back over Socket.IO as subtitles — showing speaker,
  original text/language, translated text/language, and timestamp.
- **Human interpreter integration** — Either participant can request a live interpreter
  mid-call. Available interpreters are notified in real time, can accept/decline, and the
  accepted interpreter is dropped straight into the consultation room.
- **Role dashboards** — Purpose-built dashboards for patients, doctors, and interpreters.

---

## 🧱 Tech Stack

**Frontend:** React + Vite, Tailwind CSS, React Router, i18next, Socket.IO client
**Backend:** Node.js, Express.js, MongoDB + Mongoose, JWT auth, Socket.IO
**Video:** WebRTC (mock/demo mode by default) — swappable for LiveKit

---

## 📁 Project Structure

```
medibridge/
├── client/                      # React + Vite frontend
│   ├── src/
│   │   ├── components/          # Navbar, Footer, DoctorCard, AppointmentCard, ...
│   │   ├── pages/
│   │   │   ├── patient/         # Patient dashboard, booking, appointments, profile
│   │   │   ├── doctor/          # Doctor dashboard, appointments, availability, profile
│   │   │   ├── interpreter/     # Interpreter dashboard, requests, profile
│   │   │   └── ConsultationRoom.jsx   # Shared video + subtitles + chat room
│   │   ├── layouts/             # MainLayout, DashboardLayout
│   │   ├── context/             # AuthContext
│   │   ├── services/            # api.js (Axios), socket.js (Socket.IO client)
│   │   ├── locales/             # en.json, ta.json, hi.json
│   │   └── i18n.js
│   └── .env.example
│
└── server/                      # Express + Socket.IO backend
    ├── config/db.js
    ├── models/                  # User, DoctorProfile, Appointment, InterpreterProfile,
    │                             # InterpreterRequest, Consultation
    ├── controllers/              # auth, doctor, appointment, interpreter
    ├── routes/
    ├── middleware/               # auth (JWT), errorHandler
    ├── services/
    │   ├── translationService.js # text translation — mock by default, pluggable provider
    │   └── speechService.js      # speech-to-text — mock by default, pluggable provider
    ├── socket/index.js           # all Socket.IO real-time behaviour
    ├── utils/seed.js             # demo data seeder
    ├── server.js
    └── .env.example
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas connection string
- npm

### 1. Clone & install

```bash
# From the project root
cd server
npm install

cd ../client
npm install
```

### 2. Configure environment variables

```bash
# Backend
cd server
cp .env.example .env
# Edit .env if needed — defaults work out of the box with a local MongoDB instance

# Frontend
cd ../client
cp .env.example .env
```

Nothing else is required — `TRANSLATION_PROVIDER`, `SPEECH_PROVIDER`, and `VIDEO_PROVIDER`
all default to `"mock"`, so the app is fully usable without any paid API keys.

### 3. Seed demo data (recommended)

```bash
cd server
npm run seed
```

This creates ready-to-use accounts (password for all: `Demo@1234`):

| Role        | Email                        | Notes                              |
|-------------|-------------------------------|-------------------------------------|
| Patient     | patient@medibridge.demo       | Prefers Tamil                       |
| Doctor      | doctor@medibridge.demo        | General Physician (en/hi)           |
| Doctor      | doctor2@medibridge.demo       | Pediatrics (en/ta)                  |
| Doctor      | doctor3@medibridge.demo       | Dermatology (en/hi/ta)              |
| Interpreter | interpreter@medibridge.demo   | en/ta, available                    |
| Interpreter | interpreter2@medibridge.demo  | en/hi, unavailable                  |

### 4. Run the app

```bash
# Terminal 1 — backend (http://localhost:5000)
cd server
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd client
npm run dev
```

Open **http://localhost:5173** in two browser windows (e.g. one normal + one incognito) —
log in as a patient in one and a doctor in the other, book an appointment between them, and
join the same consultation room from both to see the video call, subtitles, and interpreter
flow end-to-end.

---

## 🔌 Connecting Real Providers Later

The whole point of the service-layer split is that you can swap in real providers without
touching the rest of the app:

- **Translation** — implement a new branch in `server/services/translationService.js`
  (Google Cloud Translate is already stubbed in) and set `TRANSLATION_PROVIDER` in `.env`.
- **Speech-to-text** — implement a new branch in `server/services/speechService.js` and set
  `SPEECH_PROVIDER`.
- **Video** — the current mode uses browser WebRTC signaled over Socket.IO. To use LiveKit,
  set `VIDEO_PROVIDER=livekit` plus `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` / `LIVEKIT_URL`
  in `server/.env`, then swap the `ConsultationRoom.jsx` media logic for the LiveKit React
  SDK — the rest of the room (subtitles, chat, interpreter requests) is provider-agnostic.

---

## ⏰ Scheduled Consultation Window

A video consultation can only be joined around its booked time. The rule is enforced
**on the server**, so it cannot be bypassed from the browser:

| Setting (`server/.env`)            | Default | Meaning                                                              |
|-------------------------------------|---------|-----------------------------------------------------------------------|
| `JOIN_EARLY_MINUTES`                | `5`     | The room opens this many minutes before the start time.              |
| `JOIN_CLOSE_AFTER_MINUTES`          | `45`    | Late joins are accepted until this many minutes after the start.     |
| `APPOINTMENT_UTC_OFFSET_MINUTES`    | `330`   | Booked date/time are clinic-local time (330 = IST, UTC+5:30).        |

How it behaves:
- **Dashboards:** the *Join Video Consultation* button is enabled only while the room is open;
  before that it shows *"Opens at HH:MM"*, and after the window it shows that the time has passed.
- **Consultation page:** opened early, it shows a live countdown and lets the user in automatically
  the moment the room opens (camera/mic are not requested until then).
- **Server checks:** every socket must carry the login JWT. `room:join` is accepted only for that
  appointment's patient, doctor, or an interpreter who accepted its request, and only inside the
  window. Cancelled appointments can never be joined. Room events (video signaling, subtitles, chat)
  are ignored from anyone who was not admitted.
- **Clock safety:** the browser measures its offset from the server's clock, so a wrong device clock
  neither opens the room early nor keeps it closed.
- **Calls in progress are never cut off** when the window closes; it only limits *joining*.
- **Booking/updating rules** that protect the window: past times cannot be booked, only the doctor
  can reschedule or confirm, and a consultation cannot be marked completed before it is due.

Run the automated tests (schedule logic, socket access control, booking rules) with:

```bash
cd server && npm test
```

---

## 📡 API Endpoints

**Auth**
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/profile
PUT    /api/auth/profile
```

**Doctors**
```
GET    /api/doctors
GET    /api/doctors/:id
POST   /api/doctors/profile        (doctor only)
GET    /api/doctors/me/profile     (doctor only)
```

**Appointments**
```
POST   /api/appointments           (patient only)
GET    /api/appointments
GET    /api/appointments/:id
PUT    /api/appointments/:id
DELETE /api/appointments/:id       (cancels)
```

**Interpreter**
```
POST   /api/interpreter/request        (doctor/patient)
GET    /api/interpreter/requests
PUT    /api/interpreter/request/:id    (interpreter only)
POST   /api/interpreter/profile        (interpreter only)
GET    /api/interpreter/profile/me     (interpreter only)
```

**Health check**
```
GET    /api/health
```

---

## 🔊 Real-Time Events (Socket.IO)

| Event                     | Direction        | Purpose                                   |
|----------------------------|------------------|--------------------------------------------|
| `room:join` / `room:leave` | client → server  | Join (acknowledged `{ok}` or `{ok:false, reason}`; only inside the scheduled window) / leave a room |
| `webrtc:offer/answer/ice-candidate` | both    | WebRTC signaling relay                     |
| `speech:transcript`        | client → server  | Send a transcribed sentence for translation |
| `subtitle:new`             | server → clients | Broadcast the translated subtitle          |
| `chat:message`              | both             | In-room text chat                          |
| `interpreter:subscribe`    | client → server  | Interpreter opts in to request broadcasts  |
| `interpreter:new-request`  | server → clients | New interpreter request notification       |
| `interpreter:status-update`| server → clients | Accept/decline/complete updates            |
| `call:end`                 | both             | Notify the room the call has ended         |

---

## 🧪 Notes on the MVP Translation/Speech Pipeline

```
Patient speaks (Tamil)
   ↓  Web Speech API (browser) — or mock fallback
Tamil text
   ↓  socket "speech:transcript"
translationService.translateText()  — mock dictionary or real provider
   ↓  socket "subtitle:new"
Doctor sees English subtitles (with original + translated text, speaker, timestamp)
```

The reverse (doctor → patient) works the same way, using each user's `preferredLanguage`.

---

## 🛡️ Security Notes

- Passwords are hashed with bcrypt before storage; the hash is never returned by the API.
- All non-public routes require a valid JWT (`Authorization: Bearer <token>`).
- Role-based authorization middleware (`authorize("doctor", ...)`) protects sensitive routes.
- CORS is restricted to `CLIENT_URL` from the environment.
- No API keys are hardcoded anywhere — all provider credentials are read from `.env`
  (see `.env.example` in both `client/` and `server/`).

---

## 📄 License

Built for educational/demo purposes. Free to use and adapt for coursework, hackathons, or
your own portfolio.
