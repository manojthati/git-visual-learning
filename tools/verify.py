#!/usr/bin/env python3
"""Repository invariant checks for the Git Visual Learning course.

Stdlib only, no install step: this is a checker, not a build step. The SVGs and
markdown stay hand-editable, and nothing here generates content.

Run locally:   python3 tools/verify.py
"""
import glob
import os
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

FAILURES = []
CHECKS_RUN = 0


def check(name):
    """Decorator: register a check, collect its failure strings."""
    def wrap(fn):
        global CHECKS_RUN
        CHECKS_RUN += 1
        problems = fn() or []
        if problems:
            FAILURES.append((name, problems))
            print(f"  FAIL  {name}")
            for p in problems[:12]:
                print(f"          {p}")
            if len(problems) > 12:
                print(f"          ... and {len(problems) - 12} more")
        else:
            print(f"  ok    {name}")
        return fn
    return wrap


def svgs():
    return sorted(glob.glob("assets/*/*.svg"))


def md_files():
    return ["README.md", "CONTRIBUTING.md"] + sorted(glob.glob("docs/*.md"))


# --------------------------------------------------------------------- assets
@check("every SVG is well-formed XML")
def _():
    bad = []
    for f in svgs():
        try:
            ET.parse(f)
        except ET.ParseError as e:
            bad.append(f"{f}: {e}")
    return bad


@check("no <script> in any asset (inert in GitHub's <img> context)")
def _():
    return [f for f in svgs() if "<script" in open(f).read()]


@check("every SVG has viewBox, <title> and an aria-label")
def _():
    bad = []
    for f in svgs():
        text = open(f).read()
        if "viewBox=" not in text or "<title>" not in text or "aria-label=" not in text:
            bad.append(f)
    return bad


@check("every SVG stays under 30 KB")
def _():
    return [f"{f} ({os.path.getsize(f)} bytes)" for f in svgs() if os.path.getsize(f) > 30_000]


# ------------------------------------------------------------------ no placeholders
@check("no placeholder usernames anywhere, except the deliberate fork-rename note")
def _():
    bad = []
    pattern = re.compile(r"rajeshgoyalg|YOUR-USER|YOUR-REPO")
    for f in md_files() + ["index.html"] + svgs():
        if f == "CONTRIBUTING.md":
            continue  # "A note for forkers" intentionally shows a sed template with this placeholder
        if pattern.search(open(f).read()):
            bad.append(f)
    return bad


# ------------------------------------------------------------------------- links
@check("internal markdown links resolve to real files")
def _():
    bad = []
    link_re = re.compile(r"\]\(([^)]+)\)")
    for f in md_files():
        base = os.path.dirname(f)
        for target in link_re.findall(open(f).read()):
            if target.startswith(("http://", "https://", "#")):
                continue
            path = target.split("#")[0]
            if not path:
                continue
            resolved = os.path.normpath(os.path.join(base, path))
            if not os.path.exists(resolved):
                bad.append(f"{f} -> {target}")
    return bad


@check("every asset referenced by a module doc actually exists on disk")
def _():
    bad = []
    img_re = re.compile(r"!\[[^\]]*\]\(([^)]+)\)")
    for f in sorted(glob.glob("docs/*.md")):
        base = os.path.dirname(f)
        for target in img_re.findall(open(f).read()):
            if target.startswith(("http://", "https://")):
                continue
            resolved = os.path.normpath(os.path.join(base, target))
            if not os.path.exists(resolved):
                bad.append(f"{f} -> {target}")
    return bad


# --------------------------------------------------------------------- template
@check("every numbered module links back to the index")
def _():
    return [f for f in sorted(glob.glob("docs/[0-1][0-9]-*.md")) if "🏠 Index" not in open(f).read()]


@check("no unclosed <details> blocks")
def _():
    bad = []
    for f in md_files():
        text = open(f).read()
        text = re.sub(r"```.*?```", "", text, flags=re.S)  # fenced blocks aren't real tags
        text = re.sub(r"`[^`]*`", "", text)                 # neither are inline code spans
        opens = len(re.findall(r"<details(?:\s[^>]*)?>", text))
        closes = text.count("</details>")
        if opens != closes:
            bad.append(f"{f}: {opens} open vs {closes} close")
    return bad


@check("mermaid diagrams use flowchart, not the unsupported mindmap syntax")
def _():
    bad = []
    for f in sorted(glob.glob("docs/*.md")):
        text = open(f).read()
        for block in re.findall(r"```mermaid\n(.*?)```", text, re.S):
            if block.strip().startswith("mindmap"):
                bad.append(f)
    return bad


# ------------------------------------------------------------------------- code
@check("Python snippets in docs/ match examples/ (no drift)")
def _():
    result = subprocess.run([sys.executable, "tools/sync_examples.py", "--check"],
                             capture_output=True, text=True)
    return [] if result.returncode == 0 else [result.stdout.strip()]


@check("the example test suite passes")
def _():
    result = subprocess.run([sys.executable, "-m", "unittest", "discover", "-s", "examples", "-t", "."],
                             capture_output=True, text=True)
    return [] if result.returncode == 0 else [result.stderr.strip().splitlines()[-1] if result.stderr else "tests failed"]


# --------------------------------------------------------------------- summary
if __name__ == "__main__":
    print(f"Ran {CHECKS_RUN} checks.")
    if FAILURES:
        print(f"\n{len(FAILURES)} check(s) failed.")
        sys.exit(1)
    print("All checks passed.")
    sys.exit(0)
