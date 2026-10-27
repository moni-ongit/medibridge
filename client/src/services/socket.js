import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket = null;

/**
 * Returns a shared Socket.IO client instance, creating it on first use.
 * Kept as a lazy singleton so the connection persists across route changes.
 *
 * The server requires the login JWT on every socket connection, so the
 * token is sent in the handshake. It is read through a function so a
 * reconnect always uses the latest token.
 */
export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ["websocket", "polling"],
      auth: (cb) => cb({ token: localStorage.getItem("medibridge_token") }),
    });
  }
  return socket;
}

/**
 * Drop the current connection so the next getSocket() creates a fresh one.
 * Called on login / logout so a socket never keeps the previous user's identity.
 */
export function resetSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default getSocket;
