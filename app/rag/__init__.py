"""
app/rag
========
This package is the RAG (Retrieval-Augmented Generation) layer of DevAssist AI.

It is a direct, cleaned-up evolution of the logic you already built and
validated in notebooks/DevAssist_AI_FAST_Image_OCR.ipynb:

- models.py   -> the Guide data structure (unchanged from your notebook)
- parser.py   -> parse_docx() / load_knowledge_base() (unchanged parsing logic,
                 split into "common" and "complex" collections as required by
                 the spec instead of one merged list)
- engine.py   -> DevAssistEngine: TF-IDF + cosine-similarity retrieval,
                 now retrieval-aware of common vs complex collections and
                 reusable by the FastAPI backend (not just a CLI)
- build_cache.py -> a small script that parses both .docx files once and
                 writes app/backend/data/processed/guides.json, so the API does not have
                 to re-parse the Word documents on every server restart
"""
