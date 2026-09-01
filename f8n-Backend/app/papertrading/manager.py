"""Tracks the background threads that run active paper-trading sessions.

Deliberately in-process (no Celery/Redis) so the whole backend stays a single
deployable container for the MVP - a session's bot only survives as long as this
process does, which is an acceptable limitation for one instance and is documented
as the first thing to change if this needs to scale past that.
"""

import threading

from .bot import run_paper_session

_running_sessions = {}


def start_session(app, session_id):
    stop_event = threading.Event()
    thread = threading.Thread(target=run_paper_session, args=(app, session_id, stop_event), daemon=True)
    _running_sessions[session_id] = {"thread": thread, "stop_event": stop_event}
    thread.start()


def stop_session(session_id):
    entry = _running_sessions.get(session_id)
    if entry:
        entry["stop_event"].set()


def is_running(session_id):
    entry = _running_sessions.get(session_id)
    return bool(entry and entry["thread"].is_alive())
