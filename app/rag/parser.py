"""
Knowledge-base .docx parser.

This is your original notebook parsing logic (DevAssist_AI_FAST_Image_OCR.ipynb,
cells "Knowledge-base document loading"), moved here unchanged in behaviour.
The only functional addition is that each Guide is tagged with which
collection it came from ("common" or "complex"), which the spec's section 26
(RAG BACKEND -> separate collections/indexes for common / complex) requires.
"""

import re
from pathlib import Path

from docx import Document
from docx.text.paragraph import Paragraph
from docx.table import Table

from .models import Guide

# ------------------------------------------------------------------
# Section layout of each guide inside the .docx files. This mirrors the
# structure your knowledge-base template uses:
#   1. Problem Statement
#   2. Visual Indicators
#   3. Symptoms
#   4. Possible Causes
#   5. Troubleshooting Steps
#   6. Decision Guidance
#   7. Resolution / Solution
#   8. Verification            (parsed but not surfaced to the junior dev)
#   9. Escalation Criteria
#  10. Responsible Support Team
#  11. Related Guides
# ------------------------------------------------------------------

SECTION_BAR_PATTERN = re.compile(r"^\s*(\d{1,2})\.\s+(.+)$")
GUIDE_HEADING_PATTERN = re.compile(r"^([A-Z]+-\d+)\s*\|\s*(.+)$")

SECTION_NUMBER_TO_FIELD = {
    1: "problem",
    2: "visual",
    3: "symptoms",
    4: "causes",
    5: "steps",
    6: "decision",
    7: "solution",
    8: None,          # Verification — not needed for junior-facing output
    9: "escalation",
    10: "team",
    11: "related",
}

LIST_FIELDS = {"visual", "symptoms", "causes", "steps", "related"}


def _clean(text: str) -> str:
    return text.strip()


def parse_docx(file_path: Path, collection: str) -> list[Guide]:
    """Parse one knowledge-base .docx file into a list of Guide objects."""
    if not file_path.exists():
        raise FileNotFoundError(
            f"Knowledge base file not found: {file_path}\n"
            f"Make sure the .docx files are in app/backend/data/raw/."
        )

    doc = Document(str(file_path))
    items = list(doc.iter_inner_content())  # paragraphs + tables, in order

    guides: list[Guide] = []
    current_guide: Guide | None = None
    current_field: str | None = None

    for item in items:
        if isinstance(item, Paragraph):
            text = _clean(item.text)
            if not text:
                continue

            # New guide starts, e.g. "API-001  |  API 401 Unauthorized"
            heading_match = GUIDE_HEADING_PATTERN.match(text)
            if heading_match:
                if current_guide is not None:
                    guides.append(current_guide)
                current_guide = Guide(
                    guide_id=heading_match.group(1),
                    title=heading_match.group(2),
                    collection=collection,
                )
                current_field = None
                continue

            if current_guide is None:
                continue  # still inside cover page / TOC / intro text

            if text.startswith("Primary Identifier:"):
                current_guide.identifier = text.split(":", 1)[1].strip()
                continue

            if text.startswith("If the junior developer uploads"):
                continue

            if current_field is None:
                continue

            if current_field in LIST_FIELDS:
                cleaned = re.sub(r"^\[Primary match\]\s*", "", text)
                cleaned = re.sub(r"^\d+\.\s*", "", cleaned)
                getattr(current_guide, current_field).append(cleaned)
            else:
                existing = getattr(current_guide, current_field)
                combined = (existing + " " + text).strip() if existing else text
                setattr(current_guide, current_field, combined)

        elif isinstance(item, Table):
            rows = item.rows
            if len(rows) == 0:
                continue

            # 4x2 metadata table -> pull out the Category value
            if len(rows) >= 2 and len(rows[0].cells) == 2:
                for row in rows:
                    label = _clean(row.cells[0].text)
                    value = _clean(row.cells[1].text)
                    if label == "Category" and current_guide is not None:
                        current_guide.category = value
                continue

            # 1x1 section-bar table, e.g. "1. Problem Statement"
            if len(rows) == 1 and len(rows[0].cells) == 1:
                bar_text = _clean(rows[0].cells[0].text)
                match = SECTION_BAR_PATTERN.match(bar_text)
                if match and current_guide is not None:
                    section_number = int(match.group(1))
                    current_field = SECTION_NUMBER_TO_FIELD.get(section_number)
                continue

    if current_guide is not None:
        guides.append(current_guide)

    return guides


def load_knowledge_base(common_path: Path, complex_path: Path) -> list[Guide]:
    """Load and combine both knowledge base documents, tagged by collection."""
    guides: list[Guide] = []
    guides.extend(parse_docx(common_path, collection="common"))
    guides.extend(parse_docx(complex_path, collection="complex"))
    return guides
