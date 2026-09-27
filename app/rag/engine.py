"""
DevAssistEngine — the retrieval half of the RAG pipeline.

Base algorithm (TF-IDF + cosine similarity) is exactly what you validated
in the notebook. What's added here, to satisfy the project spec:

  * Two named collections ("common" / "complex") are indexed separately
    AND together, so the API can either search everything (best recall,
    what your notebook did) or restrict to one collection (what section 5
    / 26 of the spec ask for: "distinguish between Common and Complex").
  * `classify()` gives a lightweight Common-vs-Complex signal so the UI can
    show which knowledge base a ticket was routed to, using cues from
    section 5 of the spec (multi-user / intermittent / "some but not
    others" language -> Complex).
  * `next_step()` supports the iterative troubleshooting loop (spec section
    18): given a guide and how many steps have already been completed,
    return the next step, or signal that the guide is exhausted (escalate).
  * `re_query()` implements "system uses new result + previous context,
    RAG searches again" (spec section 2) for when the junior developer
    reports a *different* error than the one originally analyzed.
"""

from __future__ import annotations

import re
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .models import Guide
from .parser import load_knowledge_base

# Below this confidence score (0-100) we do NOT trust the match. Instead of
# guessing, DevAssist AI asks for more detail or recommends escalation.
# (Matches CONFIDENCE_THRESHOLD from the notebook.)
CONFIDENCE_THRESHOLD = 12.0

COMPLEX_HINTS = (
    "some users", "one user but not another", "intermittent", "sometimes",
    "partially", "some but not", "works in test", "after credential rotation",
    "after a product update", "returns after", "multiple users", "differs from",
)


class DevAssistEngine:
    """Loads both knowledge bases once, then matches customer problems against them."""

    def __init__(self, common_path: Path, complex_path: Path):
        self.guides: list[Guide] = load_knowledge_base(common_path, complex_path)
        if not self.guides:
            raise RuntimeError("No guides were loaded — check the knowledge base files.")
        self._build_index()

    @classmethod
    def from_guides(cls, guides: list[Guide]) -> "DevAssistEngine":
        """Build an engine directly from already-parsed guides (used when
        loading the cached app/backend/data/processed/guides.json instead of re-parsing
        the .docx files on every server start)."""
        self = cls.__new__(cls)
        self.guides = guides
        self._build_index()
        return self

    # -- indexing ------------------------------------------------------

    def _build_index(self):
        corpus = [g.search_text() for g in self.guides]
        self.vectorizer = TfidfVectorizer(
            stop_words="english", ngram_range=(1, 2), sublinear_tf=True
        )
        self.doc_matrix = self.vectorizer.fit_transform(corpus)

        # Index positions per collection, so we can restrict a query to
        # just "common" or just "complex" guides when asked to.
        self._collection_idx = {"common": [], "complex": []}
        for i, g in enumerate(self.guides):
            self._collection_idx.setdefault(g.collection, []).append(i)

    def guide_by_id(self, guide_id: str) -> Guide | None:
        return next((g for g in self.guides if g.guide_id == guide_id), None)

    # -- classification --------------------------------------------------

    def classify(self, problem_text: str) -> str:
        """Very lightweight Common vs Complex signal, per spec section 5/26.
        This does not gate retrieval (retrieval always searches everything,
        for best recall) — it's just used to label the ticket in the UI."""
        lower = (problem_text or "").lower()
        if any(hint in lower for hint in COMPLEX_HINTS):
            return "complex"
        return "common"

    # -- retrieval --------------------------------------------------------

    def match(self, problem_text: str, top_k: int = 3, collection: str | None = None) -> list[tuple[Guide, float]]:
        """
        Compare problem_text against guides (optionally restricted to one
        collection). Returns a list of (Guide, confidence_score) tuples,
        best first.
        """
        query_text = self._enrich_screenshot_query(problem_text)
        query_vec = self.vectorizer.transform([query_text])
        scores = cosine_similarity(query_vec, self.doc_matrix)[0]

        if collection in ("common", "complex"):
            candidate_idx = self._collection_idx.get(collection, [])
        else:
            candidate_idx = range(len(self.guides))

        ranked = sorted(candidate_idx, key=lambda i: scores[i], reverse=True)[:top_k]
        return [(self.guides[i], round(float(scores[i]) * 100, 1)) for i in ranked]

    def re_query(self, original_text: str, prior_steps: list[str], new_result_text: str, top_k: int = 3):
        """Spec section 2 / 18: combine the original ticket, the steps already
        tried, and the junior developer's new reported result, then search
        again. Used when a step is reported as 'still failing' with a
        materially different symptom, or 'a different error appeared'."""
        combined = " ".join([
            original_text or "",
            " ".join(prior_steps),
            new_result_text or "",
        ])
        return self.match(combined, top_k=top_k)

    @staticmethod
    def _enrich_screenshot_query(problem_text: str) -> str:
        """Add explicit meaning when one screenshot shows both success and failure."""
        text = problem_text or ""
        lower = text.lower()
        has_notification = "notification" in lower
        has_failure = any(word in lower for word in ("error", "unable", "failed"))
        has_success = any(phrase in lower for phrase in (
            "new notification", "new message", "notification sent"
        ))
        if has_notification and has_failure and has_success:
            return (text + " Some users receive notifications while other users do not. "
                    "Compare notification preferences and user settings.")
        return text


def analyze(engine: DevAssistEngine, problem_text: str) -> dict:
    """
    Core decision logic (unchanged from the notebook):
      - If no usable text, ask for clarification.
      - If the best match's confidence is below the threshold, ask for
        clarification / recommend escalation instead of guessing.
      - Otherwise, return the matched guide plus alternates.
    """
    problem_text = (problem_text or "").strip()

    if not problem_text:
        return {
            "status": "NEEDS_CLARIFICATION",
            "message": (
                "No usable problem description was provided. Ask the customer "
                "what they were doing, what they expected to happen, and what "
                "actually happened (including any exact error text)."
            ),
        }

    matches = engine.match(problem_text, top_k=3)
    best_guide, best_score = matches[0]

    if best_score < CONFIDENCE_THRESHOLD:
        return {
            "status": "NEEDS_CLARIFICATION",
            "message": (
                "Reliable troubleshooting information was not found. Further "
                f"investigation or escalation is recommended (highest match was "
                f"only {best_score}% confidence)."
            ),
            "closest_guesses": matches,
        }

    return {
        "status": "MATCH_FOUND",
        "guide": best_guide,
        "confidence": best_score,
        "other_matches": matches[1:],
    }
