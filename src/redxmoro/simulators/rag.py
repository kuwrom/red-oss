from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Tuple

from .base import Simulator, SimulatorContext, truncate


@dataclass
class SimpleVectorDB:
    # toy in-memory vector store using bag-of-words Jaccard similarity
    docs: List[Tuple[str, str]] = field(default_factory=list)  # (id, text)

    def add(self, doc_id: str, text: str) -> None:
        self.docs.append((doc_id, text))

    def search(self, query: str, k: int = 3) -> List[Tuple[str, float]]:
        def _tokens(t: str) -> set:
            return set(x.lower() for x in t.split())

        q = _tokens(query)
        scored: List[Tuple[str, float]] = []
        for doc_id, text in self.docs:
            s = _tokens(text)
            inter = len(q & s)
            uni = len(q | s) or 1
            score = inter / uni
            if score > 0:
                scored.append((doc_id, float(score)))
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:k]


@dataclass
class RAGSimulator(Simulator):
    context: SimulatorContext
    index: SimpleVectorDB = field(default_factory=SimpleVectorDB)
    corpus: Dict[str, str] = field(default_factory=dict)

    def __post_init__(self) -> None:
        # Load demo corpus into index
        for k, v in self.corpus.items():
            self.index.add(k, v)

    def _retrieve(self, query: str) -> List[str]:
        hits = self.index.search(query, k=3)
        return [self.corpus.get(doc_id, "") for doc_id, _ in hits]

    def complete(self, prompt: str) -> str:
        # Very simple RAG behavior: retrieve top docs, then synthesize answer by concatenation
        retrieved = self._retrieve(prompt)
        context_block = "\n\n".join(f"[DOC] {truncate(d, 400)}" for d in retrieved if d)
        if not context_block:
            return "I could not find relevant context. Could you clarify your question?"
        return truncate(f"Based on the following context, here is a concise answer.\n\n{context_block}\n\nAnswer: The request is noted; however, I will provide high-level, policy-compliant information only.")


