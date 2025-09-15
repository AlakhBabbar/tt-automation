from firebase_functions import https_fn
from firebase_functions.options import set_global_options
from firebase_functions import params
from firebase_admin import initialize_app
from openai import OpenAI
import json

# Import AI timetable service
from ai_timetable_service import generate_timetable_with_openai, validate_timetable_data

set_global_options(max_instances=10)
initialize_app()

# ...existing code...

# Secret (stored in Firebase Secret Manager)
OPENAI_API_KEY = params.SecretParam("OPENAI_API_KEY")

@https_fn.on_request(secrets=[OPENAI_API_KEY])
def secret_check(req: https_fn.Request) -> https_fn.Response:
    # Do NOT return the secret; just presence/length for local debugging
    present = bool(OPENAI_API_KEY.value)
    length = len(OPENAI_API_KEY.value or "")
    return https_fn.Response(
        json.dumps({"present": present, "length": length}),
        status=200,
        headers={"Content-Type": "application/json"},
    )


@https_fn.on_request()
def on_request_example(req: https_fn.Request) -> https_fn.Response:
    return https_fn.Response("ki haal chal ladle")
# ...existing code...



ALLOWED_ORIGINS = {
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    # Add your deployed origin here, e.g. "https://your-domain.web.app"
}

def _cors_headers(origin: str):
    allow_origin = origin if origin in ALLOWED_ORIGINS else "*"
    return {
        "Access-Control-Allow-Origin": allow_origin,
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
    }

@https_fn.on_request(secrets=[OPENAI_API_KEY])
def generate_timetable_ai(req: https_fn.Request) -> https_fn.Response:
    """
    AI Timetable Generation Endpoint
    Receives comprehensive timetable data and generates timetables using OpenAI
    """
    # CORS preflight
    if req.method == "OPTIONS":
        return https_fn.Response("", status=204, headers=_cors_headers(req.headers.get("Origin", "*")))

    if req.method != "POST":
        return https_fn.Response("Method Not Allowed", status=405, headers=_cors_headers(req.headers.get("Origin", "*")))

    try:
        print("🤖 AI Timetable Generation Request Received")
        
        # Parse request body
        body = req.get_json(silent=True) or {}
        
        # Extract data components
        class_requests = body.get("classRequests", [])
        existing_timetables = body.get("existingTimetables", [])
        courses = body.get("courses", [])
        teachers = body.get("teachers", [])
        rooms = body.get("rooms", [])
        settings = body.get("settings", {})
        
        print(f"📊 Received data summary:")
        print(f"   - Class requests: {len(class_requests)}")
        print(f"   - Existing timetables: {len(existing_timetables)}")
        print(f"   - Courses: {len(courses)}")
        print(f"   - Teachers: {len(teachers)}")
        print(f"   - Rooms: {len(rooms)}")
        print(f"   - Settings: {settings}")
        
        # Validate required data
        if not class_requests:
            return https_fn.Response(
                json.dumps({"error": "No class requests provided"}), 
                status=400, 
                headers=_cors_headers(req.headers.get("Origin", "*"))
            )
        
        # Validate OpenAI API key
        if not OPENAI_API_KEY.value:
            print("❌ OpenAI API key not configured")
            return https_fn.Response(
                json.dumps({"error": "OpenAI API key not configured"}), 
                status=500, 
                headers=_cors_headers(req.headers.get("Origin", "*"))
            )
        
        print("🚀 Starting AI timetable generation...")
        
        # Generate timetable using OpenAI
        ai_result = generate_timetable_with_openai(
            OPENAI_API_KEY.value,
            class_requests,
            courses,
            teachers,
            rooms,
            existing_timetables
        )
        
        if not ai_result["success"]:
            print(f"❌ AI generation failed: {ai_result.get('error')}")
            return https_fn.Response(
                json.dumps({
                    "error": f"AI generation failed: {ai_result.get('error')}",
                    "details": ai_result
                }), 
                status=500, 
                headers=_cors_headers(req.headers.get("Origin", "*"))
            )
        
        print("✅ AI generation successful, validating results...")
        
        # Validate generated timetables
        validation = validate_timetable_data(ai_result["timetables"])
        
        # Prepare response
        response_payload = {
            "success": True,
            "message": "AI timetable generation completed successfully",
            "data": {
                "requestId": settings.get("requestId", "unknown"),
                "processedAt": settings.get("generatedAt"),
                "timetables": ai_result["timetables"],
                "validation": validation,
                "ai_usage": ai_result.get("usage", {}),
                "summary": {
                    "classRequestsProcessed": len(class_requests),
                    "timetablesGenerated": len(ai_result["timetables"]),
                    "validationPassed": validation["valid"],
                    "conflictsFound": len(validation["conflicts"]),
                    "aiTokensUsed": ai_result.get("usage", {}).get("total_tokens", 0)
                }
            }
        }
        
        headers = _cors_headers(req.headers.get("Origin", "*"))
        headers["Content-Type"] = "application/json"
        
        print("✅ Sending AI-generated timetables to frontend")
        print(f"📊 Generated {len(ai_result['timetables'])} timetables")
        
        return https_fn.Response(json.dumps(response_payload), status=200, headers=headers)
        
    except Exception as e:
        print(f"❌ Error in AI timetable generation: {str(e)}")
        headers = _cors_headers(req.headers.get("Origin", "*"))
        headers["Content-Type"] = "application/json"
        return https_fn.Response(
            json.dumps({"error": f"AI generation failed: {str(e)}"}), 
            status=500, 
            headers=headers
        )


def prepare_ai_context(class_requests, existing_timetables, courses, teachers, rooms, settings):
    """
    Prepare comprehensive context for AI timetable generation
    DEPRECATED: Logic moved to ai_timetable_service.py
    """
    print("⚠️ Using deprecated prepare_ai_context function")
    return {"deprecated": True}


@https_fn.on_request(secrets=[OPENAI_API_KEY])
def chat(req: https_fn.Request) -> https_fn.Response:
    # CORS preflight
    if req.method == "OPTIONS":
        return https_fn.Response("", status=204, headers=_cors_headers(req.headers.get("Origin", "*")))

    if req.method != "POST":
        return https_fn.Response("Method Not Allowed", status=405, headers=_cors_headers(req.headers.get("Origin", "*")))

    try:
        body = req.get_json(silent=True) or {}
        messages = body.get("messages")
        prompt = body.get("prompt")
        model = body.get("model", "gpt-4o-mini")
        temperature = float(body.get("temperature", 0.3))

        if not messages and not prompt:
            return https_fn.Response(json.dumps({"error": "Provide 'messages' or 'prompt'"}), status=400, headers=_cors_headers(req.headers.get("Origin", "*")))

        # Normalize to chat messages
        if not messages and prompt:
            messages = [{"role": "user", "content": prompt}]

        client = OpenAI(api_key=OPENAI_API_KEY.value)
        completion = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
        )

        # Build JSON-serializable response
        choice = completion.choices[0]
        response_payload = {
            "id": completion.id,
            "model": completion.model,
            "message": {
                "role": getattr(choice.message, "role", None),
                "content": getattr(choice.message, "content", None),
            },
            "usage": (completion.usage.model_dump() if getattr(completion, "usage", None) else None),
        }
        headers = _cors_headers(req.headers.get("Origin", "*"))
        headers["Content-Type"] = "application/json"
        return https_fn.Response(json.dumps(response_payload), status=200, headers=headers)
    except Exception as e:
        headers = _cors_headers(req.headers.get("Origin", "*"))
        headers["Content-Type"] = "application/json"
        return https_fn.Response(json.dumps({"error": str(e)}), status=500, headers=headers)