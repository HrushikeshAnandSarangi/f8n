from flask_socketio import join_room, leave_room

from .extensions import socketio


@socketio.on("join_session")
def handle_join_session(data):
    session_id = (data or {}).get("session_id")
    if session_id:
        join_room(f"session_{session_id}")


@socketio.on("leave_session")
def handle_leave_session(data):
    session_id = (data or {}).get("session_id")
    if session_id:
        leave_room(f"session_{session_id}")
