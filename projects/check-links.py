#!/usr/bin/env python3
"""Scan local HTML links and fragments for the static portfolio release."""

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]


class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.refs = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if attributes.get("id"):
            self.ids.add(attributes["id"])
        if tag == "a" and attributes.get("href") is not None:
            self.refs.append(("href", attributes["href"]))
        for attr in ("src", "href"):
            if tag != "a" and attributes.get(attr) is not None:
                self.refs.append((attr, attributes[attr]))


def load_documents():
    documents = {}
    for path in sorted(ROOT.rglob("*.html")):
        parser = Document()
        parser.feed(path.read_text(encoding="utf-8", errors="replace"))
        documents[path.resolve()] = parser
    return documents


def destination(source, raw_path):
    candidate = (source.parent / raw_path).resolve() if raw_path else source
    if candidate.is_dir() or raw_path.endswith("/"):
        candidate /= "index.html"
    return candidate


def main():
    documents = load_documents()
    errors = []
    for source, document in documents.items():
        for attribute, reference in document.refs:
            if not reference:
                continue
            parsed = urlsplit(reference)
            scheme = parsed.scheme.lower()
            host = (parsed.hostname or "").lower()
            if reference == "#":
                errors.append(f"{source}: placeholder href=\"#\"")
                continue
            if host in {"localhost", "127.0.0.1", "::1"}:
                errors.append(f"{source}: localhost reference {reference}")
                continue
            if parsed.path.startswith("/") and scheme not in {"http", "https"}:
                errors.append(f"{source}: absolute filesystem reference {reference}")
                continue
            if scheme in {"http", "https", "mailto", "tel", "data", "javascript"}:
                continue
            if scheme:
                errors.append(f"{source}: unsupported URL scheme {reference}")
                continue

            target = destination(source, parsed.path)
            if not target.is_file():
                errors.append(f"{source}: missing {attribute} target {reference}")
                continue
            if parsed.fragment and parsed.fragment not in documents.get(target, Document()).ids:
                errors.append(f"{source}: missing fragment #{parsed.fragment} in {target}")

    print(f"scanned_html={len(documents)}")
    if errors:
        print("local link scan: FAIL")
        print("\n".join(errors))
        return 1
    print("local link scan: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
