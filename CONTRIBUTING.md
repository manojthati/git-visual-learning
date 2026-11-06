# Contributing

Corrections, clearer analogies and new modules are all welcome. The bar is: **does this make the concept land faster?**

---

## The rules that keep the repo coherent

### 1. No dependencies, ever

No build step, no package manager, no JavaScript, no CDN links, no external fonts. Every asset must render from a fresh `git clone` with nothing installed. This is not minimalism for its own sake — it is what lets the animations work identically on GitHub, offline and on Pages.

### 2. Animations are CSS inside the SVG

- Motion goes in a `<style>` block **inside the `.svg` file**, using `@keyframes`.
- **No `<script>`.** It will not run — GitHub renders SVGs in an `<img>` context, where scripts are inert.
- No external references of any kind: no webfonts, no linked images, no imported stylesheets.
- Give every file a `viewBox`, explicit `width`/`height`, a `<title>`, and an `aria-label`.
- Paint the panel background inside the file so it reads correctly in both GitHub themes.
- Keep files under ~30 KB.

### 3. The colour legend is a contract

Defined in [`docs/00-how-to-read-this.md`](docs/00-how-to-read-this.md) and used identically across all 36 assets:

| Colour | Meaning |
|:--|:--|
| `#34d399` green | the structure at rest, or the safe/settled state |
| `#fbbf24` amber | active right now, or in flight |
| `#38bdf8` cyan | a secondary branch, or the local side of a remote |
| `#fb7185` rose | destructive, risky, or rejected |
| `#c084fc` violet | a third branch, or a relocated/picked element |
| `#94a3b8` slate | labels, dimensions, ghosted/abandoned state |

Do not introduce a new colour without also updating the legend and every asset that would now be inconsistent with it.

### 4. Frames must hard-cut, never cross-fade

Multi-step animations show one frame at a time. Two frames visible simultaneously produces unreadable double-exposed text. Keyframes should take a frame from opacity 1 straight to 0 at the exact percentage the next one appears.

Every loop also holds at its first and last frame so a reader can take in the start and end state.

### 5. Mermaid must be `flowchart`, not `mindmap`

**GitHub does not render Mermaid `mindmap` diagrams.** Mindmaps in this repo are written as `flowchart LR` with `classDef` styling, which renders everywhere. Do not "fix" them to `mindmap` syntax — it will silently produce a broken code block on GitHub.

### 6. Commands are shown as real commands; the tested proof lives in examples/

Git's "pseudocode" is the command line itself — show the real commands you'd type, exactly as you'd type them.

For the operation each module centers on, back it with a **tested Python function** that drives the real `git` binary via `subprocess`. Write it in [`examples/`](examples/) — never directly into a module — and let the sync tool place it:

```bash
python3 tools/sync_examples.py          # rewrite every marked fence
python3 tools/sync_examples.py --check  # report drift only
```

A doc marks each Python snippet with the source it came from:

```markdown
<!-- py:ops_merging:fast_forward_merge -->
```python
...
```
<!-- /py -->
```

`tools/verify.py` fails if a fence has drifted from its source, if the snippets aren't valid Python, or if the test suite doesn't pass. So **edit `examples/`, then re-sync** — hand-editing a Python fence in a module will be caught.

Every function in `examples/` needs a test in [`examples/test_ops.py`](examples/test_ops.py), driving a real scratch repository via [`examples/git_lab.py`](examples/git_lab.py) — never a simulated git. Untested code in a teaching repo is worse than no code.

### 7. Every module has the same nine blocks

Analogy → animation → blueprint → mindmap → commands → risk & reversibility → trade-offs → flashcards → quiz → navigation. A module missing a block will feel wrong next to the others. Copy the shape from [`docs/06-stashing.md`](docs/06-stashing.md) if you are starting a new one.

---

## Before you open a PR

```bash
python3 tools/verify.py
```

Twelve checks, stdlib only — no install, no build step. CI runs the identical
file on every push and pull request, so a green local run means a green PR.

It covers: SVG well-formedness, no `<script>` and no external references, the
`viewBox`/`<title>`/`aria-label` trio, file size, no placeholder usernames,
internal markdown links and image references resolving, every module linking
back to the index, unclosed `<details>` blocks, unsupported Mermaid `mindmap`
blocks, Python snippets drifting from `examples/`, and the full test suite
passing.

Then open `index.html` and confirm your animation actually plays and does not collide with any text at its edges. The validators check structure, not layout — only your eyes catch a caption overlapping a node.

---

## Writing style

- **Analogy first.** If you cannot state the concept as something physical in one sentence, the module is not ready.
- **Say why, not just what.** "Never rebase a shared branch" is a rule; "rebase rewrites every commit's hash, and a collaborator's clone still has the old ones" is the reason the rule exists.
- **Name the trap.** Every operation has one — the squash-merge that erases a merge relationship, the `--hard` reset that looks exactly like `--mixed` until you check `git status`. Those are the parts people actually get wrong.
- **Rate the risk honestly.** Reversibility is the axis that matters most in a tool this easy to misuse — every module's risk table should say plainly what's safe to try and what needs a second thought.

---

## A note for forkers

`index.html` links to the module docs using absolute `github.com/.../blob/main/docs/...` URLs, not relative paths. That is deliberate: GitHub Pages serves a `.md` file as raw `text/markdown`, so a relative link from the gallery would show unrendered markdown — pipe tables, literal `**` and all. The blob URL renders properly.

The cost is that a fork's gallery still links to the upstream repo. If you fork this, run:

```bash
sed -i '' 's|github.com/manojthati/git-visual-learning|github.com/YOUR-USER/YOUR-REPO|g' index.html
```

The relative links inside `README.md` and `docs/*.md` are correct as they are — those are only ever read on github.com, where relative markdown links resolve and render.

---

## Adding a new module

1. Write `docs/NN-name.md` using the nine-block template.
2. Add at least one animation to `assets/anim/` and one blueprint to `assets/blueprint/`.
3. Add the matching operation(s) to a new `examples/ops_name.py`, tested in `examples/test_ops.py`.
4. Wire up the navigation footer in your module **and in its two neighbours**.
5. Add rows to the README module table and the animation gallery.
6. Add its cards to [`docs/flashcards.md`](docs/flashcards.md) and update the count in its index table.
7. Add its row to [`docs/cheatsheet-commands.md`](docs/cheatsheet-commands.md).
8. Add the card to `index.html`.

Run the checks above, and thank you.
