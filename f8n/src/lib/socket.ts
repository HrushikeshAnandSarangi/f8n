import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000";
    socket = io(url, { transports: ["websocket", "polling"], autoConnect: true });
  }
  return socket;
}
