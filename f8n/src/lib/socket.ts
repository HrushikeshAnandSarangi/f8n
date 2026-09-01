import { io, type Socket } from "socket.io-client";
import { fakeSocket, type SimpleSocket } from "./demo/fake-socket";
import { isDemoMode } from "./demo/mode";

let socket: Socket | null = null;

export function getSocket(): SimpleSocket {
  if (isDemoMode()) {
    return fakeSocket;
  }

  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000";
    socket = io(url, { transports: ["websocket", "polling"], autoConnect: true });
  }
  return socket;
}
