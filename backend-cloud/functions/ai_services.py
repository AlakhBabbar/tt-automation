import os
import json
from typing import Dict, List, Any

# Direct Gemini call using the new Google GenAI SDK
def _call_model_json(system_prompt: str, user_prompt: str, model: str = "gemini-2.5-flash") -> str:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY/GOOGLE_API_KEY is not set")
    # Lazy import to avoid import-time errors if package missing
    from google import genai
    client = genai.Client(api_key=api_key)

    contents = f"{system_prompt}\n\n---\n{user_prompt}"
    resp = client.models.generate_content(
        model=model,
        contents=contents,
        config={
            "temperature": 0.2,
            "response_mime_type": "application/json",
            "max_output_tokens": 4000,
        },
    )
    return getattr(resp, "text", None) or "{}"


def generate_timetable_with_ai(data: Dict[str, Any]) -> Dict[str, Any]:
    """
        Calls Gemini to generate conflict-free timetables based on provided data.
    Expects:
      data = {
        classRequests: [...],
        teachers: [...],
        rooms: [...],
        courses: [...],
        existingTimetables: [...]
      }
    Returns dict with success flag and timetables or error info.
    """
    try:
        class_requests = data.get("classRequests", [])
        teachers = data.get("teachers", [])
        rooms = data.get("rooms", [])
        courses = data.get("courses", [])
        existing_timetables = data.get("existingTimetables", [])

        system_prompt = build_system_prompt()
        user_prompt = build_user_prompt(
            class_requests, teachers, rooms, courses, existing_timetables
        )

        # Allow disabling AI in emulator via DISABLE_GEMINI toggle
        if os.getenv("DISABLE_GEMINI", "").lower() in ("1", "true", "yes"):
            print("AI call disabled via DISABLE_GEMINI; returning stub result")
            return {
                "success": True,
                "timetables": [],
                "metadata": {
                    "total_generated": 0,
                    "total_validated": 0,
                    "model_used": "gemini-disabled",
                    "prompt_chars": 0,
                },
            }

        print("Calling Gemini model...")
        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        content = _call_model_json(system_prompt, user_prompt, model=model_name)
        print("Gemini response chars:", len(content))

        try:
            parsed = json.loads(content)
        except json.JSONDecodeError as e:
            # Attempt a light sanitize and retry
            cleaned = _sanitize_json_string(content)
            try:
                parsed = json.loads(cleaned)
            except Exception:
                return {
                    "success": False,
                    "error": "AI response was not valid JSON",
                    "details": str(e),
                    "raw_response": content,
                }

        timetables = parsed.get("timetables", [])
        validated = validate_generated_timetables(timetables, class_requests)

        return {
            "success": True,
            "timetables": validated,
            "metadata": {
                "total_generated": len(timetables),
                "total_validated": len(validated),
                "model_used": model_name,
                "prompt_chars": len(system_prompt) + len(user_prompt),
            },
        }

    except Exception as e:
        return {
            "success": False,
            "error": f"AI generation failed: {str(e)}",
        }

def build_system_prompt() -> str:
    return (
        "You are an experienced university timetable coordinator. "
        "Generate efficient, conflict-free weekly timetables given inputs for classes, courses, teachers, "
        "rooms, and existing timetables. Follow these rules strictly:\n"
        "- No teacher can teach two classes at the same time.\n"
        "- No room can host two classes at the same time.\n"
        "- A batch cannot attend multiple classes at the same time.\n"
        "- Respect course credits when allocating weekly hours (more credits => more slots).\n"
        "- Use room capacity and features appropriately (e.g., labs for lab courses).\n"
        "- Consider any teacher constraints/unavailability if provided.\n"
        "- Distribute sessions across Mon-Sat, minimize gaps, avoid overloading single days.\n\n"
        "Output JSON only with this exact shape:\n"
        "{\n"
        '  "timetables": [\n'
        "    {\n"
        '      "program": "", "branch": "", "semester": "", "batch": "", "type": "",\n'
        '      "monday":    {"7:00-8:00": {"course": "", "teacher": "", "room": ""}, ..., "18:00-19:00": {"course": "", "teacher": "", "room": ""}},\n'
        '      "tuesday":   { ... same slot structure ... },\n'
        '      "wednesday": { ... },\n'
        '      "thursday":  { ... },\n'
        '      "friday":    { ... },\n'
        '      "saturday":  { ... }\n'
        "    }\n"
        "  ]\n"
        "}\n"
        "Every slot key must exist for each day, and empty slots must have empty strings for course/teacher/room.\n"
        "Do not include any commentary, only valid JSON."
    )

def build_user_prompt(
    class_requests: List[Dict],
    teachers: List[Dict],
    rooms: List[Dict],
    courses: List[Dict],
    existing_timetables: List[Dict],
) -> str:
    def safe(o: Any) -> str:
        try:
            return json.dumps(o, ensure_ascii=False)
        except Exception:
            return "[]"

    prompt = []
    prompt.append("INPUT DATA BELOW IN JSON SECTIONS.\n")

    prompt.append("CLASS_REQUESTS_JSON=" + safe(class_requests))
    prompt.append("TEACHERS_JSON=" + safe(teachers))
    prompt.append("ROOMS_JSON=" + safe(rooms))
    prompt.append("COURSES_JSON=" + safe(courses))
    prompt.append("EXISTING_TIMETABLES_JSON=" + safe(existing_timetables))

    prompt.append(
        "\nInstructions:\n"
        "- Create a timetable for each entry in CLASS_REQUESTS_JSON.\n"
        "- Avoid any conflicts with EXISTING_TIMETABLES_JSON.\n"
        "- Use TEACHERS_JSON and COURSES_JSON to match teachers to appropriate courses.\n"
        "- Use ROOMS_JSON ensuring capacity and type requirements are satisfied.\n"
        "- Respect requested type (full-time/part-time) and credits when distributing slots.\n"
        "- Return JSON exactly in the required schema."
    )

    return "\n".join(prompt)

def _sanitize_json_string(s: str) -> str:
    """Attempt minimal cleanup for common JSON issues from LLMs.
    - Remove trailing commas before closing braces/brackets.
    - Ensure property names are quoted (best-effort; assumes they already are in most cases).
    """
    try:
        import re
        # Remove trailing commas before } or ]
        s = re.sub(r",(\s*[}\]])", r"\1", s)
        return s
    except Exception:
        return s

def validate_generated_timetables(
    timetables: List[Dict], class_requests: List[Dict]
) -> List[Dict]:
    validated: List[Dict] = []
    expected_slots = [
        "7:00-8:00",
        "8:00-9:00",
        "9:00-10:00",
        "10:00-11:00",
        "11:00-12:00",
        "12:00-13:00",
        "13:00-14:00",
        "14:00-15:00",
        "15:00-16:00",
        "16:00-17:00",
        "17:00-18:00",
        "18:00-19:00",
    ]
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

    for tt in timetables:
        try:
            # Required top-level fields
            for f in ["program", "branch", "semester", "batch", "type"]:
                if f not in tt:
                    raise ValueError(f"missing field {f}")

            # Days and slots
            for d in days:
                if d not in tt or not isinstance(tt[d], dict):
                    raise ValueError(f"missing day {d}")
                for s in expected_slots:
                    if s not in tt[d] or not isinstance(tt[d][s], dict):
                        raise ValueError(f"missing slot {d} {s}")
                    for k in ["course", "teacher", "room"]:
                        if k not in tt[d][s]:
                            raise ValueError(f"missing key {k} in {d} {s}")

            validated.append(tt)
        except Exception:
            # Skip invalid entries silently (keep backend clean)
            continue

    return validated