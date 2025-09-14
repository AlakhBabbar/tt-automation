from firebase_functions import https_fn
from firebase_functions.options import set_global_options
from firebase_functions import params
from firebase_admin import initialize_app
from openai import OpenAI
import json

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