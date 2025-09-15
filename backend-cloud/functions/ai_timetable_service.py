"""
AI Timetable Generation Service
Handles comprehensive timetable generation using OpenAI
"""
from openai import OpenAI
import json

def create_timetable_prompt(class_requests, courses, teachers, rooms, existing_timetables):
    """
    Create a comprehensive prompt for AI timetable generation
    """
    
    # Build the main system prompt
    system_prompt = """You are a highly experienced timetable coordinator and academic scheduler for a university/college. You are responsible for creating optimal, conflict-free weekly timetables for various classes and programs.

Your responsibilities include:
- Creating comprehensive weekly timetables with NO scheduling conflicts
- Efficiently utilizing all available resources (teachers, rooms, time slots)
- Distributing workload fairly among faculty members
- Allocating appropriate rooms based on capacity and features
- Respecting course credit requirements and distributing class hours accordingly
- Minimizing gaps between classes for better student experience
- Balancing daily schedules to avoid overloading any single day
- Considering any medical constraints or special requirements for professors
- Ensuring room allocations match course requirements and student group restrictions

CRITICAL REQUIREMENTS:
1. NO TEACHER can teach multiple classes at the same time
2. NO ROOM can be occupied by multiple classes simultaneously
3. Distribute classes according to COURSE CREDITS - higher credits need more weekly hours
4. Balance teacher workloads fairly across all available faculty
5. Allocate rooms efficiently based on capacity and course type
6. Minimize scheduling gaps and optimize daily flow
7. Respect any existing timetable constraints provided

Return your response in the exact JSON format specified, with complete weekly schedules for each class requested."""

    # Process class requests
    class_info = []
    for i, req in enumerate(class_requests, 1):
        class_info.append(f"""
Class {i}:
- Program: {req.get('program', 'Not specified')}
- Branch: {req.get('branch', 'Not specified')}
- Semester: {req.get('semester', 'Not specified')}
- Batch: {req.get('batch', 'Not specified')}
- Type: {req.get('type', 'Not specified')}
- Credits: {req.get('credits', 'Not specified')} (determine weekly hours based on this)""")

    # Process available resources
    teachers_info = []
    for teacher in teachers:
        subjects = teacher.get('subjects', [])
        subjects_str = ', '.join(subjects) if subjects else 'No subjects specified'
        teachers_info.append(f"- {teacher.get('name', 'Unknown')}: {subjects_str}")

    rooms_info = []
    for room in rooms:
        capacity = room.get('capacity', 'Unknown')
        room_type = room.get('type', 'Unknown')
        rooms_info.append(f"- {room.get('name', 'Unknown')}: Capacity {capacity}, Type: {room_type}")

    courses_info = []
    for course in courses:
        duration = course.get('duration', 'Unknown')
        course_type = course.get('type', 'Unknown')
        courses_info.append(f"- {course.get('name', 'Unknown')}: Duration {duration}, Type: {course_type}")

    # Process existing timetables for conflict avoidance
    existing_info = ""
    if existing_timetables:
        existing_info = f"\n\nEXISTING TIMETABLES TO AVOID CONFLICTS WITH:\n"
        for tt in existing_timetables:
            existing_info += f"- {tt.get('program', 'Unknown')} {tt.get('branch', 'Unknown')} Sem {tt.get('semester', 'Unknown')} Batch {tt.get('batch', 'Unknown')}\n"
        existing_info += "ENSURE NO SCHEDULING CONFLICTS with these existing timetables.\n"

    # Create the complete prompt
    user_prompt = f"""
TIMETABLE GENERATION REQUEST

CLASSES TO SCHEDULE:
{chr(10).join(class_info)}

AVAILABLE TEACHERS:
{chr(10).join(teachers_info) if teachers_info else '- No teachers data provided'}

AVAILABLE ROOMS:
{chr(10).join(rooms_info) if rooms_info else '- No rooms data provided'}

AVAILABLE COURSES:
{chr(10).join(courses_info) if courses_info else '- No courses data provided'}

{existing_info}

SCHEDULING CONSTRAINTS:
- Weekly schedule: Monday to Friday
- Time slots: 7:00-8:00, 8:00-9:00, 9:00-10:00, 10:00-11:00, 11:00-12:00, 12:00-13:00, 13:00-14:00, 14:00-15:00, 15:00-16:00, 16:00-17:00
- Allocate class hours based on course credits (higher credits = more weekly hours)
- NO scheduling conflicts between teachers or rooms
- Distribute teacher workload fairly
- Optimize room utilization based on capacity and type
- Minimize gaps between classes for students
- Balance daily schedules evenly

REQUIRED OUTPUT FORMAT (JSON Array):
[
  {{
    "program": "Program Name",
    "branch": "Branch Name", 
    "semester": "Semester Number",
    "batch": "Batch Name",
    "type": "full-time/part-time",
    "credits": "Credit Hours",
    "monday": {{
      "7:00-8:00": {{"course": "Course Name", "teacher": "Teacher Name", "room": "Room Name"}},
      "8:00-9:00": {{"course": "Course Name", "teacher": "Teacher Name", "room": "Room Name"}},
      // ... other time slots as needed
    }},
    "tuesday": {{
      // ... time slots with course assignments
    }},
    "wednesday": {{
      // ... time slots with course assignments  
    }},
    "thursday": {{
      // ... time slots with course assignments
    }},
    "friday": {{
      // ... time slots with course assignments
    }}
  }}
  // ... additional classes if multiple requested
]

Generate comprehensive, conflict-free weekly timetables for all requested classes. Ensure optimal resource utilization and student-friendly scheduling.
"""

    return system_prompt, user_prompt


def generate_timetable_with_openai(api_key, class_requests, courses, teachers, rooms, existing_timetables):
    """
    Generate timetable using OpenAI with comprehensive data
    """
    try:
        print("🤖 Initializing OpenAI client...")
        client = OpenAI(api_key=api_key)
        
        print("📝 Creating comprehensive timetable prompt...")
        system_prompt, user_prompt = create_timetable_prompt(
            class_requests, courses, teachers, rooms, existing_timetables
        )
        
        print(f"📊 Prompt created - System: {len(system_prompt)} chars, User: {len(user_prompt)} chars")
        
        print("🌐 Calling OpenAI API...")
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,  # Lower temperature for more consistent outputs
            max_tokens=4000   # Sufficient for timetable JSON
        )
        
        print("✅ OpenAI API call successful")
        
        # Extract the response
        ai_response = completion.choices[0].message.content
        print(f"📋 AI Response length: {len(ai_response)} characters")
        
        # Try to parse as JSON
        try:
            # Look for JSON content (sometimes AI wraps it in markdown)
            if "```json" in ai_response:
                json_start = ai_response.find("```json") + 7
                json_end = ai_response.find("```", json_start)
                json_content = ai_response[json_start:json_end].strip()
            elif "[" in ai_response and "]" in ai_response:
                # Extract JSON array
                json_start = ai_response.find("[")
                json_end = ai_response.rfind("]") + 1
                json_content = ai_response[json_start:json_end]
            else:
                json_content = ai_response
            
            timetable_data = json.loads(json_content)
            print("✅ Successfully parsed AI response as JSON")
            
            return {
                "success": True,
                "timetables": timetable_data,
                "ai_response": ai_response,
                "usage": {
                    "prompt_tokens": completion.usage.prompt_tokens,
                    "completion_tokens": completion.usage.completion_tokens,
                    "total_tokens": completion.usage.total_tokens
                }
            }
            
        except json.JSONDecodeError as e:
            print(f"❌ Failed to parse AI response as JSON: {str(e)}")
            return {
                "success": False,
                "error": "Failed to parse AI response as valid JSON",
                "raw_response": ai_response,
                "parse_error": str(e)
            }
            
    except Exception as e:
        print(f"❌ Error in OpenAI timetable generation: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "step": "openai_api_call"
        }


def validate_timetable_data(timetable_data):
    """
    Validate the generated timetable data for conflicts and completeness
    """
    validation_results = {
        "valid": True,
        "conflicts": [],
        "warnings": [],
        "statistics": {}
    }
    
    try:
        if not isinstance(timetable_data, list):
            validation_results["valid"] = False
            validation_results["conflicts"].append("Timetable data must be a list of timetables")
            return validation_results
        
        # Check for conflicts across all timetables
        teacher_schedule = {}
        room_schedule = {}
        
        for tt_index, timetable in enumerate(timetable_data):
            for day in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']:
                if day in timetable:
                    for time_slot, class_info in timetable[day].items():
                        if isinstance(class_info, dict):
                            teacher = class_info.get('teacher')
                            room = class_info.get('room')
                            
                            # Check teacher conflicts
                            if teacher:
                                key = f"{day}_{time_slot}_{teacher}"
                                if key in teacher_schedule:
                                    validation_results["conflicts"].append(
                                        f"Teacher conflict: {teacher} scheduled at {day} {time_slot} in multiple classes"
                                    )
                                    validation_results["valid"] = False
                                else:
                                    teacher_schedule[key] = f"Timetable {tt_index + 1}"
                            
                            # Check room conflicts
                            if room:
                                key = f"{day}_{time_slot}_{room}"
                                if key in room_schedule:
                                    validation_results["conflicts"].append(
                                        f"Room conflict: {room} scheduled at {day} {time_slot} for multiple classes"
                                    )
                                    validation_results["valid"] = False
                                else:
                                    room_schedule[key] = f"Timetable {tt_index + 1}"
        
        # Generate statistics
        validation_results["statistics"] = {
            "total_timetables": len(timetable_data),
            "unique_teachers_used": len(set(key.split('_')[2] for key in teacher_schedule.keys())),
            "unique_rooms_used": len(set(key.split('_')[2] for key in room_schedule.keys())),
            "total_classes_scheduled": len(teacher_schedule)
        }
        
        print(f"🔍 Validation complete: {'✅ Valid' if validation_results['valid'] else '❌ Invalid'}")
        print(f"📊 Statistics: {validation_results['statistics']}")
        
        return validation_results
        
    except Exception as e:
        validation_results["valid"] = False
        validation_results["conflicts"].append(f"Validation error: {str(e)}")
        return validation_results
