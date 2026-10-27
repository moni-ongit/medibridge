import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../services/api.js";
import getSocket from "../services/socket.js";
import { useAuth } from "../context/AuthContext.jsx";
import useJoinWindow from "../hooks/useJoinWindow.js";

const LANG_NAMES = { en: "English", ta: "Tamil", hi: "Hindi" };

// Demo phrases used when the browser doesn't support the Web Speech API,
// so the "Simulate speech" button still produces a believable subtitle flow.
const DEMO_PHRASES = {
  en: ["How are you feeling today?", "Can you describe your symptoms?", "I will prescribe some medicine.", "Please take rest and drink plenty of water."],
  ta: ["எனக்கு தலைவலி இருக்கிறது", "எனக்கு காய்ச்சல் உள்ளது", "நன்றி மருத்துவரே"],
  hi: ["मुझे सिरदर्द है", "मुझे बुखार है", "धन्यवाद डॉक्टर"],
};

const RTC_CONFIG = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

/**
 * Shown instead of the video room whenever the consultation cannot be
 * joined: before the scheduled time (with a live countdown), after the
 * window has closed, if cancelled, or if the server refused entry.
 */
function ConsultationGate({ reason, win, schedule, onRetry, onBack }) {
  const { t } = useTranslation();
  const startDate = schedule?.startsAtDate || win.startsAtDate;
  const startTime = schedule?.startsAtTime || win.startsAtTime;
  const opensTime = schedule?.opensAtTime || win.opensAtTime;

  let title = t("consultation.schedule.genericDenied");
  let note = null;
  let canRetry = true;
  if (reason === "too_early") {
    title = t("consultation.schedule.notOpenYet");
    note = t("consultation.schedule.opensAtNote", { time: opensTime });
  } else if (reason === "ended") {
    title = t("consultation.schedule.windowClosedTitle");
    note = t("consultation.schedule.windowClosedNote");
    canRetry = false;
  } else if (reason === "cancelled") {
    title = t("consultation.schedule.cancelledTitle");
    canRetry = false;
  } else if (reason === "not_participant") {
    title = t("consultation.schedule.notParticipant");
    canRetry = false;
  } else if (reason === "not_found") {
    title = t("consultation.schedule.notFound");
    canRetry = false;
  }

  // Live countdown only while our own (server-corrected) clock agrees it is early
  const showCountdown = reason === "too_early" && win.state === "too_early";

  return (
    <div className="flex min-h-screen flex-col bg-ink-900 text-white">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 sm:px-6">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-600">🩺</span>
        <span className="font-display font-semibold">MediBridge</span>
      </div>
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white/5 p-8 text-center">
          <p className="text-4xl" aria-hidden="true">{reason === "too_early" ? "⏳" : reason === "cancelled" ? "🚫" : "🔒"}</p>
          <h1 className="mt-4 font-display text-2xl font-semibold">{title}</h1>
          {startDate && startTime && (
            <p className="mt-2 text-sm text-white/60">
              {t("consultation.schedule.scheduledFor", { date: startDate, time: startTime })}
            </p>
          )}
          {showCountdown && (
            <div className="mt-6">
              <p className="text-xs uppercase tracking-wide text-white/50">{t("consultation.schedule.opensIn")}</p>
              <p className="mt-1 font-display text-5xl font-semibold tabular-nums text-teal-300" role="timer" aria-live="off">
                {win.countdown}
              </p>
            </div>
          )}
          {note && <p className="mt-5 text-sm text-white/60">{note}</p>}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {canRetry && !showCountdown && (
              <button onClick={onRetry} className="btn-primary">{t("consultation.schedule.checkAgain")}</button>
            )}
            <button
              onClick={onBack}
              className="inline-flex items-center justify-center rounded-full border-2 border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-ink-900"
            >
              {t("consultation.schedule.backToDashboard")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConsultationRoom() {
  const { appointmentId } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [panel, setPanel] = useState("translation"); // "translation" | "chat"
  const [subtitles, setSubtitles] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [listening, setListening] = useState(false);
  const [interpreterModalOpen, setInterpreterModalOpen] = useState(false);
  const [interpreterStatus, setInterpreterStatus] = useState(null); // request object
  const [callEnded, setCallEnded] = useState(false);
  // Join gate: `admitted` latches true once the scheduled window is open, so
  // the call is never torn down when the window later closes. `denied` holds
  // the server's refusal (reason + schedule) if it overrides our clock.
  const [admitted, setAdmitted] = useState(false);
  const [denied, setDenied] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const recognitionRef = useRef(null);
  const subtitlesBoxRef = useRef(null);

  const win = useJoinWindow(appointment?.schedule);
  const roomId = appointment?.videoRoomId;
  const myRole = user.role;

  // Determine "the other language" for translating my speech into.
  const myLanguage = user.preferredLanguage || "en";
  const otherLanguage =
    myRole === "patient"
      ? "en" // doctors default to English unless appointment specifies otherwise
      : appointment?.preferredLanguage || "en";

  // ---- Load appointment -------------------------------------------------
  const loadAppointment = useCallback(
    () =>
      api
        .get(`/appointments/${appointmentId}`)
        .then((res) => setAppointment(res.data.appointment))
        .catch(() => setError("Could not load this consultation."))
        .finally(() => setLoading(false)),
    [appointmentId]
  );

  useEffect(() => {
    loadAppointment();
  }, [loadAppointment]);

  // Admit the user as soon as the scheduled window opens (and the server hasn't refused)
  // (Only once the appointment - and so its schedule - has actually loaded)
  useEffect(() => {
    if (appointment && win.canJoin && !denied) setAdmitted(true);
  }, [appointment, win.canJoin, denied]);

  // "Check again": refresh the schedule from the server, then try to join again
  const retryJoin = () => {
    setDenied(null);
    loadAppointment();
  };

  // ---- Setup local media + socket + WebRTC -------------------------------
  useEffect(() => {
    if (!roomId || !admitted) return;
    const socket = getSocket();
    socketRef.current = socket;

    let cancelled = false;

    async function setup() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) return;
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (err) {
        console.warn("Camera/mic unavailable, continuing in view-only demo mode:", err.message);
      }

      // The server re-checks the schedule and answers { ok } or { ok: false, reason, schedule }
      socket.emit("room:join", { roomId }, (res) => {
        if (cancelled || !res || res.ok) return;
        setDenied({ reason: res.reason, schedule: res.schedule });
        setAdmitted(false); // tears the call setup down (stops camera/mic)
      });

      socket.on("room:user-joined", async () => {
        setRemoteConnected(true);
        await createPeerConnection(true);
      });

      socket.on("webrtc:offer", async ({ offer }) => {
        const pc = peerConnectionRef.current || (await createPeerConnection(false));
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc:answer", { roomId, answer });
      });

      socket.on("webrtc:answer", async ({ answer }) => {
        const pc = peerConnectionRef.current;
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
      });

      socket.on("webrtc:ice-candidate", async ({ candidate }) => {
        const pc = peerConnectionRef.current;
        if (pc && candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn("ICE candidate error", e);
          }
        }
      });

      socket.on("subtitle:new", (entry) => {
        setSubtitles((prev) => [...prev, entry]);
      });

      socket.on("chat:message", (msg) => {
        setChatMessages((prev) => [...prev, msg]);
      });

      socket.on("interpreter:status-update", (req) => {
        setInterpreterStatus(req);
      });

      socket.on("interpreter:joined", () => {
        setChatMessages((prev) => [...prev, { sender: "System", text: t("consultation.interpreterJoined"), timestamp: new Date().toISOString() }]);
      });

      socket.on("call:ended", () => {
        setCallEnded(true);
      });
    }

    async function createPeerConnection(isInitiator) {
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));
      }

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        setRemoteConnected(true);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) socket.emit("webrtc:ice-candidate", { roomId, candidate: event.candidate });
      };

      if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc:offer", { roomId, offer });
      }

      return pc;
    }

    setup();

    return () => {
      cancelled = true;
      socket.emit("room:leave", { roomId });
      socket.off("room:user-joined");
      socket.off("webrtc:offer");
      socket.off("webrtc:answer");
      socket.off("webrtc:ice-candidate");
      socket.off("subtitle:new");
      socket.off("chat:message");
      socket.off("interpreter:status-update");
      socket.off("interpreter:joined");
      socket.off("call:ended");
      peerConnectionRef.current?.close();
      localStreamRef.current?.getTracks().forEach((tr) => tr.stop());
      if (recognitionRef.current) recognitionRef.current.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, admitted]);

  useEffect(() => {
    // Scroll only the subtitle list (scrollIntoView would also scroll the whole page)
    const box = subtitlesBoxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [subtitles]);

  // ---- Mic / camera toggles ----------------------------------------------
  const toggleMic = () => {
    const next = !micOn;
    setMicOn(next);
    localStreamRef.current?.getAudioTracks().forEach((tr) => (tr.enabled = next));
    socketRef.current?.emit("call:toggle-audio", { roomId, muted: !next, user: user.name });
  };

  const toggleCamera = () => {
    const next = !cameraOn;
    setCameraOn(next);
    localStreamRef.current?.getVideoTracks().forEach((tr) => (tr.enabled = next));
    socketRef.current?.emit("call:toggle-video", { roomId, videoOff: !next, user: user.name });
  };

  // ---- Speech capture (real Web Speech API, with demo fallback) ---------
  const sendTranscript = useCallback(
    (text) => {
      if (!text.trim() || !socketRef.current) return;
      socketRef.current.emit("speech:transcript", {
        roomId,
        speakerRole: myRole,
        speakerName: user.name,
        text,
        sourceLanguage: myLanguage,
        targetLanguage: otherLanguage,
      });
    },
    [roomId, myRole, user.name, myLanguage, otherLanguage]
  );

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Fallback: simulate a spoken sentence for the demo
      const options = DEMO_PHRASES[myLanguage] || DEMO_PHRASES.en;
      sendTranscript(options[Math.floor(Math.random() * options.length)]);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = myLanguage === "ta" ? "ta-IN" : myLanguage === "hi" ? "hi-IN" : "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      sendTranscript(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  // ---- Chat ---------------------------------------------------------------
  const sendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socketRef.current?.emit("chat:message", { roomId, sender: user.name, text: chatInput });
    setChatInput("");
  };

  // ---- Interpreter request --------------------------------------------
  const requestInterpreter = async (targetLang) => {
    setInterpreterModalOpen(false);
    const res = await api.post("/interpreter/request", {
      appointmentId,
      sourceLanguage: myLanguage,
      targetLanguage: targetLang,
    });
    setInterpreterStatus(res.data.request);
  };

  // ---- End call -----------------------------------------------------------
  const endCall = async () => {
    socketRef.current?.emit("call:end", { roomId });
    if (appointment?.status !== "completed") {
      try {
        await api.put(`/appointments/${appointmentId}`, { status: "completed" });
      } catch {
        /* best-effort */
      }
    }
    navigate(`/${myRole}/dashboard`);
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-ink-900 text-white">{t("common.loading")}</div>;
  }
  if (error || !appointment) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-900 text-white">
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className="btn-secondary border-white text-white hover:bg-white hover:text-ink-900">
          {t("common.back")}
        </button>
      </div>
    );
  }

  // Not admitted: show why (countdown before the start, closed, cancelled, refused...)
  if (denied || (!admitted && !win.canJoin)) {
    return (
      <ConsultationGate
        reason={denied?.reason || win.state}
        win={win}
        schedule={denied?.schedule || appointment.schedule}
        onRetry={retryJoin}
        onBack={() => navigate(`/${myRole}/dashboard`)}
      />
    );
  }

  const otherPartyName = myRole === "patient" ? appointment.doctor?.name : appointment.patient?.name;

  return (
    <div className="flex min-h-screen flex-col bg-ink-900 text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-600">🩺</span>
          <span className="font-display font-semibold">MediBridge</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/70">
          <span className={`h-2 w-2 rounded-full ${remoteConnected ? "bg-teal-400" : "bg-amber-400"}`} />
          {remoteConnected ? `Connected with ${otherPartyName}` : t("consultation.waitingRoom")}
        </div>
      </div>

      {callEnded && (
        <div className="bg-amber-500 px-6 py-2 text-center text-sm font-medium text-ink-900">
          The other participant ended the call.
        </div>
      )}

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Video area */}
        <div className="flex-1 p-4 sm:p-6">
          <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="relative h-[64vh] min-h-[260px] overflow-hidden rounded-2xl bg-ink-800">
              <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
              {!remoteConnected && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/50">
                  <span className="text-4xl">{myRole === "patient" ? "🩺" : "🧑"}</span>
                  <span className="text-sm">{t("consultation.waitingRoom")}</span>
                </div>
              )}
              <span className="absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1 text-xs">{otherPartyName || "Participant"}</span>
            </div>

            <div className="relative h-[64vh] min-h-[260px] overflow-hidden rounded-2xl bg-ink-800">
              <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" style={{ display: cameraOn ? "block" : "none" }} />
              {!cameraOn && (
                <div className="absolute inset-0 flex items-center justify-center text-4xl">🎥🚫</div>
              )}
              <span className="absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1 text-xs">You</span>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={toggleMic}
              className={`grid h-12 w-12 place-items-center rounded-full text-lg transition ${micOn ? "bg-white/10 hover:bg-white/20" : "bg-signal-500"}`}
              title={t("consultation.mic")}
            >
              {micOn ? "🎤" : "🔇"}
            </button>
            <button
              onClick={toggleCamera}
              className={`grid h-12 w-12 place-items-center rounded-full text-lg transition ${cameraOn ? "bg-white/10 hover:bg-white/20" : "bg-signal-500"}`}
              title={t("consultation.camera")}
            >
              {cameraOn ? "📹" : "🚫"}
            </button>
            <button
              onClick={listening ? stopListening : startListening}
              className={`flex h-12 items-center gap-2 rounded-full px-5 text-sm font-medium transition ${listening ? "bg-teal-500" : "bg-white/10 hover:bg-white/20"}`}
              title="Speak to generate live translated subtitles"
            >
              🎙️ {listening ? "Listening..." : "Speak"}
            </button>
            <button
              onClick={() => setInterpreterModalOpen(true)}
              className="flex h-12 items-center gap-2 rounded-full bg-amber-500 px-5 text-sm font-semibold text-ink-900 hover:bg-amber-600"
            >
              👤 {t("consultation.requestInterpreter")}
            </button>
            <button
              onClick={endCall}
              className="flex h-12 items-center gap-2 rounded-full bg-signal-500 px-6 text-sm font-semibold hover:bg-signal-600"
            >
              ☎ {t("consultation.endCall")}
            </button>
          </div>

          {interpreterStatus && (
            <div className="mx-auto mt-4 max-w-md rounded-xl bg-white/10 px-4 py-2 text-center text-sm">
              {interpreterStatus.status === "waiting" && t("consultation.interpreterRequested")}
              {interpreterStatus.status === "accepted" && `✅ ${interpreterStatus.interpreter?.name} joined as interpreter`}
              {interpreterStatus.status === "declined" && "Interpreter request declined. You can try again."}
            </div>
          )}
        </div>

        {/* Side panel: translation + chat */}
        <div className="flex w-full flex-col border-t border-white/10 bg-ink-800 lg:w-96 lg:border-l lg:border-t-0">
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setPanel("translation")}
              className={`flex-1 py-3 text-sm font-medium ${panel === "translation" ? "border-b-2 border-teal-400 text-teal-300" : "text-white/50"}`}
            >
              🌐 {t("consultation.translation")}
            </button>
            <button
              onClick={() => setPanel("chat")}
              className={`flex-1 py-3 text-sm font-medium ${panel === "chat" ? "border-b-2 border-teal-400 text-teal-300" : "text-white/50"}`}
            >
              💬 {t("consultation.chat")}
            </button>
          </div>

          {panel === "translation" ? (
            <div className="flex flex-1 flex-col overflow-hidden">
              <p className="border-b border-white/10 px-4 py-2 text-xs uppercase tracking-wide text-white/40">{t("consultation.subtitlesTitle")}</p>
              <div ref={subtitlesBoxRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3" style={{ maxHeight: "60vh" }}>
                {subtitles.length === 0 && <p className="text-sm text-white/30">No subtitles yet. Press "Speak" to try it.</p>}
                {subtitles.map((s, idx) => (
                  <div key={idx} className="rounded-xl bg-white/5 p-3">
                    <div className="flex items-center justify-between text-[11px] text-white/40">
                      <span className="font-semibold capitalize text-white/70">{s.speakerName} ({s.speakerRole})</span>
                      <span>{new Date(s.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <p className="mt-1 text-xs text-white/40">{t("consultation.original")} ({LANG_NAMES[s.originalLanguage] || s.originalLanguage}): {s.originalText}</p>
                    <p className="mt-1 text-sm text-teal-200">{t("consultation.translated")} ({LANG_NAMES[s.translatedLanguage] || s.translatedLanguage}): {s.translatedText}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3" style={{ maxHeight: "55vh" }}>
                {chatMessages.length === 0 && <p className="text-sm text-white/30">No messages yet.</p>}
                {chatMessages.map((m, idx) => (
                  <div key={idx} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${m.sender === user.name ? "ml-auto bg-teal-600" : "bg-white/10"}`}>
                    {m.sender !== user.name && <p className="text-[11px] font-semibold text-white/50">{m.sender}</p>}
                    <p>{m.text}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={sendChat} className="flex gap-2 border-t border-white/10 p-3">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={t("consultation.typeMessage")}
                  className="flex-1 rounded-full bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
                />
                <button type="submit" className="rounded-full bg-teal-600 px-4 py-2 text-sm font-medium hover:bg-teal-700">
                  {t("consultation.send")}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Interpreter request modal */}
      {interpreterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-ink-900">
            <h3 className="font-display text-lg font-semibold">{t("consultation.requestInterpreter")}</h3>
            <p className="mt-2 text-sm text-ink-500">Which language does the interpreter need to translate into?</p>
            <div className="mt-4 space-y-2">
              {Object.entries(LANG_NAMES).filter(([code]) => code !== myLanguage).map(([code, label]) => (
                <button
                  key={code}
                  onClick={() => requestInterpreter(code)}
                  className="w-full rounded-xl border border-ink-100 px-4 py-2.5 text-left text-sm hover:border-teal-400 hover:bg-teal-50"
                >
                  {myLanguage.toUpperCase()} → {label}
                </button>
              ))}
            </div>
            <button onClick={() => setInterpreterModalOpen(false)} className="mt-4 w-full text-sm text-ink-400 hover:text-ink-600">
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
