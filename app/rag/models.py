"""
Guide data structure.

This is the same shape you defined in the notebook — one Guide per
troubleshooting entry in either knowledge base document. `collection`
is the one field added here (not in the notebook) so the engine can
tell a Common guide from a Complex guide once both are loaded together.
"""

from dataclasses import dataclass, field, asdict


@dataclass
class Guide:
    guide_id: str
    title: str
    collection: str = ""       # "common" | "complex"
    category: str = ""
    identifier: str = ""
    problem: str = ""
    visual: list = field(default_factory=list)
    symptoms: list = field(default_factory=list)
    causes: list = field(default_factory=list)
    steps: list = field(default_factory=list)
    decision: str = ""
    solution: str = ""
    escalation: str = ""
    team: str = ""
    related: list = field(default_factory=list)

    def search_text(self) -> str:
        """All the text used to match this guide against a customer problem."""
        # Identifiers and titles are the strongest retrieval signals, so give
        # them more weight than the long explanatory sections.
        return " ".join([
            self.identifier, self.identifier,
            self.title, self.title, self.title,
            self.problem,
            " ".join(self.symptoms),
            " ".join(self.causes),
            " ".join(self.visual),
        ])

    def to_dict(self) -> dict:
        return asdict(self)

    @staticmethod
    def from_dict(data: dict) -> "Guide":
        return Guide(**data)
