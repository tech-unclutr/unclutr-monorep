from typing import Literal

from pydantic import BaseModel


class GeneratedQuestion(BaseModel):
    krq_index: int
    question_number: int
    text: str
    uncovers: str = ""
    objective_link: str = ""
    tag: str = ""
    depth: Literal[1, 2] = 1
    type_descriptor: str = ""
    probes: list[str] = []
    estimated_minutes: float = 0.0
    priority: Literal["must_ask", "if_time_permits"] = "must_ask"


class CohortScriptResponse(BaseModel):
    questions: list[GeneratedQuestion]


# Hand-built Gemini schema. google.generativeai only accepts a narrow OpenAPI 3.0
# subset (type, enum, items, properties, required) — no default/minimum/pattern.
COHORT_SCRIPT_GEMINI_SCHEMA: dict = {
    "type": "OBJECT",
    "properties": {
        "questions": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "krq_index": {"type": "INTEGER"},
                    "question_number": {"type": "INTEGER"},
                    "text": {"type": "STRING"},
                    "uncovers": {"type": "STRING"},
                    "objective_link": {"type": "STRING"},
                    "tag": {"type": "STRING"},
                    "depth": {"type": "INTEGER"},
                    "type_descriptor": {"type": "STRING"},
                    "probes": {"type": "ARRAY", "items": {"type": "STRING"}},
                    "estimated_minutes": {"type": "NUMBER"},
                    "priority": {
                        "type": "STRING",
                        "enum": ["must_ask", "if_time_permits"],
                    },
                },
                "required": ["krq_index", "question_number", "text"],
            },
        }
    },
    "required": ["questions"],
}
