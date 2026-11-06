# 00 · How to read this repo

Every module in this repo is built from the same nine blocks, in the same order. Learn the notation once here and the other ten modules read themselves.

---

## The visual legend

Colour means the same thing in every diagram across all 36 assets. Nothing is decorative.

| Colour | Role | Where you see it |
|:--|:--|:--|
| 🟩 **Green** `#34d399` | the structure at rest, or the safe/settled state | `main`, a committed tree, a resolved merge |
| 🟨 **Amber** `#fbbf24` | active right now, or in flight | the cursor, the commit being replayed, a dirty file |
| 🟦 **Cyan** `#38bdf8` | a secondary branch or the local side of a remote relationship | `feature/x`, the local repo in a fetch/push diagram |
| 🟥 **Rose** `#fb7185` | destructive, risky, or rejected | `--hard`, a force-push, a broken commit |
| 🟪 **Violet** `#c084fc` | a third branch, or a relocated/picked element | `feature-C` in a stack, the commit being rebased `--onto` |
| ⬜ **Slate** `#94a3b8` | labels, dimensions, ghosted/abandoned state | axis text, a branch's old position before a rebase |

One shape convention: a **faded, dashed road** is a position that has been abandoned — the old base of a rebased branch, a branch that's about to be deleted. The commit objects behind it still exist (git never deletes eagerly) but nothing points at them anymore.

---

## The three kinds of picture

| Kind | Folder | What it does |
|:--|:--|:--|
| 🎞️ **Animation** | `assets/anim/` | shows the operation *happening*, on a loop, with a pause at the first and last frame |
| 📐 **Blueprint** | `assets/blueprint/` | a static diagram: anatomy, the exact files/refs involved, the risk notes |
| 📊 **Infographic** | `assets/infographic/` | cross-module comparison — the course map, the risk matrix, the strategy chooser |

All three are plain SVG with any animation written in CSS inside the file. There is no JavaScript, no build step and no dependency: the pictures work on GitHub, in an offline clone, and in the Pages gallery identically.

> **Animations loop with a deliberate pause** at the first and last frame so you can read the start and end state before it restarts. If you catch one mid-cycle, wait a few seconds.

---

## The commands — and the code behind them

Git's "pseudocode" *is* the command line — there's no second notation to learn. Every module shows the real commands you'd actually type, exactly as you'd type them, taken straight from a working reference guide.

Underneath several of those commands sits a **tested Python function** that drives the real `git` binary via `subprocess` against a throwaway repository, then inspects the result:

<!-- py:ops_three_trees:move_through_trees -->
```python
def move_through_trees(repo: str, filename: str, content: str, message: str) -> dict[str, str]:
    """Walk one change through working dir -> staging -> repository."""
    write(repo, filename, content)
    dirty = run(["status", "--porcelain"], repo).strip()      # working dir only: untracked/modified
    run(["add", filename], repo)
    staged = run(["status", "--porcelain"], repo).strip()     # staged for the next commit
    run(["commit", "-q", "-m", message], repo)
    clean = run(["status", "--porcelain"], repo).strip()      # repository: tree is clean again
    return {"after_write": dirty, "after_add": staged, "after_commit": clean}
```
<!-- /py -->

Three things are true of every one of these functions:

- **They run real git.** [`examples/git_lab.py`](../examples/git_lab.py) spins up an isolated temp repo; nothing simulates git — it *is* git.
- **They are tested.** [`examples/test_ops.py`](../examples/test_ops.py) covers every one — 21 tests, stdlib `unittest`, no dependencies:

  ```bash
  python3 -m unittest discover -s examples -t .
  ```

- **The comments carry the teaching.** `# working dir only: untracked/modified` is the point of the line; the command is what makes it concrete.

They are extracted into each module by `tools/sync_examples.py`, so a snippet in a doc cannot silently drift from the code the tests actually cover.

## The nine blocks in every module

| # | Block | What to do with it |
|:--:|:--|:--|
| 1 | **The analogy** | read it first — it is the hook the rest hangs on |
| 2 | 🎞️ **Animation** | watch one full loop before reading anything else |
| 3 | 📐 **Blueprint** | the mechanism again, static and fully labelled |
| 4 | 🗺️ **Mindmap** | the shape of the module, so you know what is coming |
| 5 | ⚙️ **Commands** | the real commands, with a tested Python function underneath the key one |
| 6 | ⚠️ **Risk & reversibility** | how dangerous this is, and how to undo it if it goes wrong |
| 7 | ⚖️ **Trade-offs** | when to reach for it and when not to |
| 8 | 🃏 **Flashcards** | click to reveal — test yourself before moving on |
| 9 | ❓ **Quiz** | a few questions, answers hidden with explanations |

---

## Suggested route

1. **[01 · The Three Trees](01-three-trees.md)** — non-negotiable. Every later module assumes this notation.
2. **[02 · Branching](02-branching-basics.md) → [05 · Stacked Branches](05-stacked-branches.md)** in order — these build on each other directly.
3. **[06 · Stashing](06-stashing.md)** and **[07 · Cherry-Picking](07-cherry-picking.md)** — everyday tools, read whenever you need them.
4. **[08 · Strategies](08-branching-strategies.md)** once, to pick a shape for your team.
5. **[09 · Undoing Things](09-undoing-things.md)** — keep it bookmarked; you'll come back to it.
6. **[10 · Remote Workflows](10-remote-workflows.md)** and **[11 · The Advanced Toolbox](11-advanced-toolbox.md)** once you're collaborating.
7. **[Command cheat sheet](cheatsheet-commands.md)**, **[flashcards](flashcards.md)** and **[quiz](quiz.md)** for revision.

If you only have twenty minutes: read [01 · The Three Trees](01-three-trees.md), then the **[course map](../assets/infographic/course-map.svg)** and the **[command risk matrix](../assets/infographic/command-risk-matrix.svg)**.

---

⬅️ *(start)* · [🏠 Index](../README.md) · [01 · The Three Trees](01-three-trees.md) ➡️
