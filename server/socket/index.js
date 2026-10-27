const jwt = require("jsonwebtoken");
const { translateText } = require("../services/translationService");
const { checkRoomAccess } = require("../services/consultationAccess");
const Consultation = require("../models/Consultation");
const User = require("../models/User");

/**
 * initSocket(io)
 * ----------------------------------------------------------------
 * All real-time behaviour for MediBridge lives here:
 *   - joining a consultation room (video + subtitles + chat)
 *   - WebRTC signaling relay (offer/answer/ICE candidates) for the
 *     mock/demo peer-to-peer video mode
 *   - "speech:transcript" -> runs translationService -> broadcasts
 *     "subtitle:new" to everyone else in the room (real-time subtitles)
 *   - interpreter request notifications ("interpreters" room)
 *   - basic in-room text chat
 *
 * Security:
 *   - Every socket must present a valid JWT (handshake `auth.token`).
 *   - `room:join` is only accepted for a participant of the appointment,
 *     and only inside its scheduled join window (utils/schedule.js).
 *   - Room events (video signaling, subtitles, chat) are ignored unless
 *     the sender has been admitted to that room.
 */

/** True only if this socket was admitted to `roomId` via room:join. */
const inRoom = (socket, roomId) => typeof roomId === "string" && socket.rooms.has(roomId);

function initSocket(io) {
  // ---- Authentication: identify who is connecting --------------------
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("AUTH_REQUIRED"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user || user.isActive === false) return next(new Error("AUTH_INVALID"));

      socket.data.auth = { id: String(user._id), name: user.name, role: user.role };
      next();
    } catch (err) {
      next(new Error("AUTH_INVALID"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ---- Room / presence management -------------------------------
    // The client passes an ack callback and gets { ok: true } or
    // { ok: false, reason, schedule } where reason is one of:
    // "too_early" | "ended" | "cancelled" | "not_participant" | "not_found"
    socket.on("room:join", async (payload, ack) => {
      const reply = typeof ack === "function" ? ack : () => {};
      try {
        const roomId = payload?.roomId;
        const access = await checkRoomAccess(roomId, socket.data.auth);
        if (!access.allowed) {
          return reply({ ok: false, reason: access.reason, schedule: access.schedule });
        }

        const user = { name: socket.data.auth.name, role: socket.data.auth.role };
        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.user = user;
        socket.to(roomId).emit("room:user-joined", { user, socketId: socket.id });
        io.to(roomId).emit("room:participants-updated");
        reply({ ok: true });
      } catch (err) {
        console.error("room:join error:", err.message);
        reply({ ok: false, reason: "error" });
      }
    });

    socket.on("room:leave", ({ roomId }) => {
      socket.leave(roomId);
      socket.to(roomId).emit("room:user-left", { socketId: socket.id, user: socket.data.user });
    });

    // Interpreters subscribe to a global "interpreters" room so they
    // receive broadcast notifications of new requests anywhere on the platform.
    socket.on("interpreter:subscribe", () => {
      if (socket.data.auth?.role === "interpreter") socket.join("interpreters");
    });

    // ---- WebRTC signaling relay (mock/demo video mode) --------------
    socket.on("webrtc:offer", ({ roomId, offer, to }) => {
      if (!inRoom(socket, roomId)) return;
      socket.to(to || roomId).emit("webrtc:offer", { offer, from: socket.id });
    });
    socket.on("webrtc:answer", ({ roomId, answer, to }) => {
      if (!inRoom(socket, roomId)) return;
      socket.to(to || roomId).emit("webrtc:answer", { answer, from: socket.id });
    });
    socket.on("webrtc:ice-candidate", ({ roomId, candidate, to }) => {
      if (!inRoom(socket, roomId)) return;
      socket.to(to || roomId).emit("webrtc:ice-candidate", { candidate, from: socket.id });
    });

    // ---- Call controls ------------------------------------------------
    socket.on("call:toggle-audio", ({ roomId, muted, user }) => {
      if (!inRoom(socket, roomId)) return;
      socket.to(roomId).emit("call:peer-toggle-audio", { muted, user });
    });
    socket.on("call:toggle-video", ({ roomId, videoOff, user }) => {
      if (!inRoom(socket, roomId)) return;
      socket.to(roomId).emit("call:peer-toggle-video", { videoOff, user });
    });
    socket.on("call:end", ({ roomId }) => {
      if (!inRoom(socket, roomId)) return;
      io.to(roomId).emit("call:ended");
    });

    // ---- Real-time translated subtitles -----------------------------
    // Client sends a transcript chunk (from Web Speech API or mock),
    // we translate it server-side, then broadcast to the room so both
    // sides see: original text + translated text + speaker + timestamp.
    socket.on("speech:transcript", async (payload) => {
      try {
        const { roomId, speakerRole, speakerName, text, sourceLanguage, targetLanguage } = payload;
        if (!inRoom(socket, roomId)) return;
        if (!text || !text.trim()) return;

        const { translatedText, provider } = await translateText(text, sourceLanguage, targetLanguage);

        const subtitleEntry = {
          speakerRole,
          speakerName,
          originalText: text,
          originalLanguage: sourceLanguage,
          translatedText,
          translatedLanguage: targetLanguage,
          provider,
          timestamp: new Date().toISOString(),
        };

        io.to(roomId).emit("subtitle:new", subtitleEntry);

        // Persist to consultation transcript (best-effort, non-blocking)
        Consultation.findOneAndUpdate(
          { roomId },
          { $push: { transcript: subtitleEntry }, status: "ongoing", $setOnInsert: { startTime: new Date() } }
        ).catch(() => {});
      } catch (err) {
        console.error("speech:transcript handling error:", err.message);
      }
    });

    // ---- In-room text chat --------------------------------------------
    socket.on("chat:message", ({ roomId, sender, text }) => {
      if (!inRoom(socket, roomId)) return;
      io.to(roomId).emit("chat:message", { sender, text, timestamp: new Date().toISOString() });
    });

    // ---- Interpreter request lifecycle (also triggered via REST, but
    // sockets give instant delivery to interpreters currently online) --
    socket.on("interpreter:request", (requestPayload) => {
      io.to("interpreters").emit("interpreter:new-request", requestPayload);
    });

    socket.on("interpreter:joined-room", ({ roomId, interpreter }) => {
      if (!inRoom(socket, roomId)) return;
      io.to(roomId).emit("interpreter:joined", { interpreter });
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
      if (socket.data.roomId) {
        socket.to(socket.data.roomId).emit("room:user-left", { socketId: socket.id, user: socket.data.user });
      }
    });
  });
}

module.exports = initSocket;
