import sys, os

# ✅ Ensure Python can see this folder when importing
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import json
from firebase_functions import https_fn

# Import AI service (same folder)
# Defer importing ai_services to avoid import-time failures in emulator

# No OpenAI secrets needed; using Gemini via env (GEMINI_API_KEY/GOOGLE_API_KEY)

ALLOWED_ORIGINS = {
    "http://localhost:5173",
    "http://127.0.0.1:5173",
}

def _cors_headers(origin: str):
    allow_origin = origin if origin in ALLOWED_ORIGINS else "*"
    return {
        "Access-Control-Allow-Origin": allow_origin,
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
    }

def cors_response(req: https_fn.Request, body, status: int = 200) -> https_fn.Response:
    headers = _cors_headers(req.headers.get("Origin", "*"))
    if isinstance(body, (dict, list)):
        body = json.dumps(body)
        headers["Content-Type"] = "application/json"
    elif isinstance(body, str):
        headers["Content-Type"] = headers.get("Content-Type", "text/plain; charset=utf-8")
    else:
        body = str(body)
        headers["Content-Type"] = "text/plain; charset=utf-8"
    return https_fn.Response(body, status=status, headers=headers)

@https_fn.on_request()
def hello(req: https_fn.Request) -> https_fn.Response:
    # CORS preflight
    if req.method == "OPTIONS":
        return https_fn.Response("", status=204, headers=_cors_headers(req.headers.get("Origin", "*")))
    return cors_response(req, {"message": "Hello World!"}, 200)

@https_fn.on_request()
def ai_status(req: https_fn.Request) -> https_fn.Response:
    # CORS preflight
    if req.method == "OPTIONS":
        return https_fn.Response("", status=204, headers=_cors_headers(req.headers.get("Origin", "*")))
    # Check if google-genai is importable
    try:
        from google import genai as _genai  # type: ignore
        genai_ok = True
    except Exception:
        genai_ok = False

    import sys
    status = {
        "gemini_key_present": bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")),
        "disable_gemini": os.getenv("DISABLE_GEMINI", "").lower() in ("1", "true", "yes"),
        "cwd": os.getcwd(),
        "python_executable": sys.executable,
        "google_genai_installed": genai_ok,
    }
    return cors_response(req, status, 200)

@https_fn.on_request()
def ai_smoke_test(req: https_fn.Request) -> https_fn.Response:
    # CORS preflight
    if req.method == "OPTIONS":
        return https_fn.Response("", status=204, headers=_cors_headers(req.headers.get("Origin", "*")))

    # Minimal viable input
    sample = {
        "classRequests": [
            {"program": "B.Tech", "branch": "CSE", "semester": "1", "batch": "A", "type": "full-time"}
        ],
        "teachers": [
            {"name": "Dr. Smith", "courses": ["CS101"]}
        ],
        "rooms": [
            {"name": "R-101", "capacity": 60, "type": "classroom"}
        ],
        "courses": [
            {"code": "CS101", "name": "Intro to CS", "credits": 3}
        ],
        "existingTimetables": []
    }

    try:
        from ai_services import generate_timetable_with_ai
        result = generate_timetable_with_ai(sample)
        return cors_response(req, result, 200)
    except Exception as e:
        return cors_response(req, {"success": False, "error": str(e)}, 500)

@https_fn.on_request()
def generate_timetable_ai(req: https_fn.Request) -> https_fn.Response:
    # CORS preflight
    if req.method == "OPTIONS":
        return https_fn.Response("", status=204, headers=_cors_headers(req.headers.get("Origin", "*")))
    if req.method != "POST":
        return cors_response(req, {"error": "Method Not Allowed"}, 405)

    try:
        data = req.get_json(silent=True) or {}
        # Minimal logs (no emojis to avoid Windows console encoding issues)
        print("AI timetable request received")
        print(f"classRequests={len(data.get('classRequests', []))}, "
              f"teachers={len(data.get('teachers', []))}, "
              f"rooms={len(data.get('rooms', []))}, "
              f"courses={len(data.get('courses', []))}, "
              f"existingTimetables={len(data.get('existingTimetables', []))}")

        # Lazy import to keep emulator happy if dependencies/keys aren't present at import time
        gen_fn = None
        try:
            from ai_services import generate_timetable_with_ai as _gen
            if callable(_gen):
                gen_fn = _gen
        except Exception as imp_err:
            # Log and continue with fallback response
            print(f"ai_services import skipped: {imp_err}")

        if gen_fn:
            result = gen_fn(data)
            return cors_response(req, result, 200)

        # Fallback: acknowledge receipt if AI service not available
        return cors_response(req, {
            "success": True,
            "message": "Backend received data. AI service not available.",
            "receivedData": {
                "classRequests": len(data.get('classRequests', [])),
                "teachers": len(data.get('teachers', [])),
                "rooms": len(data.get('rooms', [])),
                "courses": len(data.get('courses', [])),
                "existingTimetables": len(data.get('existingTimetables', [])),
            }
        }, 200)

    except Exception as e:
        print(f"Error in generate_timetable_ai: {e}")
        return cors_response(req, {
            "success": False,
            "error": "Failed to process timetable generation request",
            "details": str(e),
        }, 500)