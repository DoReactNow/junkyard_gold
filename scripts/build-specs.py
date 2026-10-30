#!/usr/bin/env python3
"""Builds src/data/specs.json (year -> make -> model -> engine/transmission specs for the finder).

Usage: python3 scripts/build-specs.py <engines.json> <transmissions.json>
Only spec wording is kept. Source prices and product links are dropped; our prices come from our own sales.
"""
import json
import re
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "src/data/specs.json"

# Sales copy that leaked into the spec field of some source rows
JUNK = re.compile(r"warrant|warr\b|reman|\bcore\b|\$|https?:|low miles|ran well|\bvideo\b|\bcall\b|used engine|used transmission|\bP#", re.I)


def clean(raw):
    """Fixes the unbalanced brackets in the source ("2.0L), VIN D" -> "2.0L, VIN D")."""
    kept = []
    depth = 0
    for ch in raw:
        if ch == "(":
            depth += 1
        elif ch == ")":
            if depth == 0:
                continue
            depth -= 1
        kept.append(ch)
    s = "".join(kept)
    # drop brackets left open
    while depth > 0:
        i = s.rfind("(")
        s = s[:i] + s[i + 1 :]
        depth -= 1
    s = re.sub(r"\(\s+", "(", s)
    s = re.sub(r"\s+\)", ")", s)
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"\s+,", ",", s)
    return s.strip(" ,;.")


def usable(s):
    return 2 <= len(s) <= 90 and not JUNK.search(s) and not re.fullmatch(r"(19|20)\d\d", s)


def add(out, path, kind):
    data = json.loads(Path(path).read_text())["data"]
    for year, makes in data.items():
        for make, models in makes.items():
            for model, opts in models.items():
                specs = {}
                for o in opts:
                    s = clean(o["opt"])
                    if usable(s):
                        specs.setdefault(s.lower(), s)
                if specs:
                    slot = out.setdefault(year, {}).setdefault(make, {}).setdefault(model, {})
                    slot[kind] = sorted(specs.values())


def main():
    out = {}
    add(out, sys.argv[1], "e")
    add(out, sys.argv[2], "t")
    OUT.write_text(json.dumps(out, separators=(",", ":"), sort_keys=True))
    print(f"{OUT}: {OUT.stat().st_size / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
