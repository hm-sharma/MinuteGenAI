import os
from typing import Optional
from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx
import json
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

app = FastAPI(
    title="MinuteGenAI API Proxy",
    description="Secure FastAPI backend proxy to route Google Gemini API requests securely.",
    version="1.0.0"
)

class VercelPathMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            for header, val in scope.get("headers", []):
                if header == b"x-matched-path":
                    scope["path"] = val.decode("utf-8")
                    break
        await self.app(scope, receive, send)

app.add_middleware(VercelPathMiddleware)

# CORS Policy: Allow local static web client to interact securely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class GenerateRequest(BaseModel):
    transcript: str = Field(..., description="Raw dialogue transcript of the meeting.")
    model: str = Field("gemini-3.5-flash", description="Google Gemini model parameter.")
    style: str = Field("professional", description="Output tone profile.")
    title: Optional[str] = Field(None, description="Suggested meeting title.")
    platform: Optional[str] = Field(None, description="Suggested meeting platform.")
    date: Optional[str] = Field(None, description="Suggested meeting date.")

# Health status endpoint (lets frontend verify configuration status)
@app.get("/health")
@app.get("/api/health")
async def health_check():
    api_key = os.getenv("GEMINI_API_KEY")
    is_configured = api_key is not None and api_key != "YOUR_GEMINI_API_KEY_HERE" and api_key.strip() != ""
    return {
        "status": "active",
        "api_key_configured": is_configured
    }

# Proxy compiler endpoint
@app.post("/generate")
@app.post("/api/generate")
async def generate_mom(payload: GenerateRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "YOUR_GEMINI_API_KEY_HERE" or api_key.strip() == "":
      raise HTTPException(
          status_code=status.HTTP_400_BAD_REQUEST,
          detail="Gemini API Key is unconfigured on the server. Please define GEMINI_API_KEY in the backend .env file."
      )

    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{payload.model}:generateContent?key={api_key}"

    # Tone style prompt guidelines
    style_instruction = ""
    if payload.style == "action-oriented":
        style_instruction = "Focus heavily on actionable items, assigned owners, and concrete deliverables. The summary should be concise, while action items and future plans should be highly detailed and granular."
    elif payload.style == "detailed":
        style_instruction = "Provide exhaustive, detailed summaries and bullet points. Document arguments, options discussed, alternative views, and deep-dive technical descriptions."
    elif payload.style == "concise":
        style_instruction = "Make the executive summary, highlights, and description very brief and high-level. Keep explanations down to 1-2 clear sentences."
    else: # professional
        style_instruction = "Maintain a formal corporate tone. Balance summary details with clear bulleted takeaways and actionable owner assignments."

    metadata_context = f"""
    Meeting Title Suggestion: {payload.title or "Auto-detect"}
    Date Suggestion: {payload.date or "Auto-detect"}
    Platform Suggestion: {payload.platform or "Auto-detect"}
    """

    system_prompt = f"""You are a highly efficient meeting coordinator and AI administrative assistant.
Your task is to analyze the provided meeting transcript and compile standard, structured Minutes of Meeting (MOM).

Analyze the transcript for the following details:
1. Title of the meeting. If a suggestion is provided, refine it or use it. If not, generate a professional one.
2. Date, Platform (Google Meet, Zoom, MS Teams, etc.), Duration (estimated or exact), Organizer, and list of Attendees.
3. Executive Summary: A coherent, beautifully worded paragraph (supporting markdown for formatting like bold text) detailing the main purpose, consensus reached, and key achievements of the meeting.
4. Highlights: Specific discussion points. For each point:
   - keyPoint: 3-6 word title.
   - description: 2-3 sentence brief description of what was argued or decided.
   - speaker: Name(s) of active speakers who drove that discussion.
   - level: 'critical' (for blocks, dates, security, budget, major shifts), 'warning' (risks, warnings, tasks with constraints), or 'info' (general updates, announcements).
5. Action Items: Clear, assignable tasks. For each task:
   - task: Actionable verb-driven task title.
   - assignee: Person responsible (e.g. "Alex Rivera"). If not explicitly mentioned, assign to "Unassigned" or a role.
   - deadline: Specific date or relative time (e.g., "Aug 5, 2026", "Before next sync", "End of Week").
   - status: Always output "pending".
6. Future Actions: Upcoming events, meetings, or carryover plans. For each:
   - event: Title of next step/meeting.
   - details: Brief explanation of what will be discussed or prepared.
   - date: Expected date/time.

Style requirements: {style_instruction}
Here is the meeting metadata suggestions:
{metadata_context}

Return the output strictly matching the requested JSON schema. Do not wrap the JSON in markdown blocks like ```json."""

    request_body = {
        "contents": [
            {
                "parts": [
                    {"text": system_prompt},
                    {"text": f"Here is the meeting transcript:\n\n{payload.transcript}"}
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "title": {"type": "STRING"},
                    "date": {"type": "STRING"},
                    "platform": {"type": "STRING"},
                    "duration": {"type": "STRING"},
                    "organizer": {"type": "STRING"},
                    "attendees": {
                        "type": "ARRAY",
                        "items": {"type": "STRING"}
                    },
                    "summary": {"type": "STRING", "description": "Comprehensive markdown summary of the meeting."},
                    "highlights": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "keyPoint": {"type": "STRING"},
                                "description": {"type": "STRING"},
                                "speaker": {"type": "STRING"},
                                "level": {"type": "STRING", "enum": ["info", "warning", "critical"]}
                            },
                            "required": ["keyPoint", "description", "speaker", "level"]
                        }
                    },
                    "actionItems": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "task": {"type": "STRING"},
                                "assignee": {"type": "STRING"},
                                "deadline": {"type": "STRING"},
                                "status": {"type": "STRING"}
                            },
                            "required": ["task", "assignee", "deadline", "status"]
                        }
                    },
                    "futureActions": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "event": {"type": "STRING"},
                                "details": {"type": "STRING"},
                                "date": {"type": "STRING"}
                            },
                            "required": ["event", "details", "date"]
                        }
                    }
                },
                "required": [
                    "title", "date", "platform", "duration", "organizer", "attendees", 
                    "summary", "highlights", "actionItems", "futureActions"
                ]
            }
        }
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(endpoint, json=request_body)
            
            if response.status_code != 200:
                try:
                    error_data = response.json()
                    error_msg = error_data.get("error", {}).get("message", "")
                except Exception:
                    error_msg = f"HTTP status code {response.status_code}"
                
                # Check for rate limiting / token exhaustion / invalid keys
                if response.status_code == 429 or "quota" in error_msg.lower() or "limit" in error_msg.lower():
                    error_msg = "API key tokens exhausted or too many requests. Please try again later."
                elif response.status_code == 400 and ("key" in error_msg.lower() or "api key" in error_msg.lower()):
                    error_msg = "Invalid Gemini API Key. Please verify your server credentials."
                elif not error_msg:
                    error_msg = f"API error status {response.status_code}"

                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=error_msg
                )

            data = response.json()
            text_response = data["candidates"][0]["content"]["parts"][0]["text"]
            
            if not text_response:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Empty response received from Gemini API."
                )

            parsed_mom = json.loads(text_response)
            return parsed_mom

    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Network error communicating with Gemini API: {exc}"
        )
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to parse structured JSON from Gemini API response."
        )

@app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def catch_all(path_name: str, request: Request):
    headers = {k: v for k, v in request.headers.items()}
    return {
        "error": "Not Found",
        "path_received": path_name,
        "request_path": request.scope.get("path"),
        "headers": headers
    }
