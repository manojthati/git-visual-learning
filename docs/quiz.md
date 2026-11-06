# ❓ Quiz bank — 24 questions, three levels

These are **new** questions, not the ones inside the modules. Work through a level without looking anything up, then check. Score yourself at the bottom.

| Level | Questions | What it tests |
|:--|--:|:--|
| [🟢 Level 1 · Recall](#level-1--recall) | 8 | do you know what each command *does* |
| [🟡 Level 2 · Apply](#level-2--apply) | 8 | can you pick the right tool for the job |
| [🔴 Level 3 · Reason](#level-3--reason) | 8 | do you understand *why* git behaves the way it does |

---

## Level 1 · Recall

**1.1** What are the three trees every git command moves state between?

<details><summary>Answer</summary>

**The working directory, the staging area (index), and the repository.** `git add` moves forward from the first to the second; `git commit` moves forward from the second to the third.
</details>

**1.2** What does `HEAD` normally point at?

<details><summary>Answer</summary>

**A branch** — which in turn points at a commit. "Detached HEAD" is the exception, where HEAD points directly at a commit hash.
</details>

**1.3** What's the difference in parent count between a normal commit and a merge commit?

<details><summary>Answer</summary>

A normal commit has **one** parent. A merge commit has **two** (or more, for an octopus merge) — one per branch being combined.
</details>

**1.4** Does `git stash` include untracked files by default?

<details><summary>Answer</summary>

**No.** You need `git stash push --include-untracked` (or `--all`, which also grabs ignored files).
</details>

**1.5** What does `git fetch` update?

<details><summary>Answer</summary>

**Only your `origin/*` tracking refs** — your own branches are untouched. `git pull` does the fetch and then merges (or rebases) into your current branch.
</details>

**1.6** What's the default mode of `git reset`, if you don't pass `--soft` or `--hard`?

<details><summary>Answer</summary>

**`--mixed`.** It moves HEAD and unstages changes, but leaves the working directory untouched.
</details>

**1.7** What does `git cherry-pick` do to the branch you're picking *from*?

<details><summary>Answer</summary>

**Nothing.** The donor branch is completely untouched; only a copy of the picked commit's diff lands on the destination branch, as a new commit with a new hash.
</details>

**1.8** How long does `git reflog` typically retain entries for, by default?

<details><summary>Answer</summary>

**About 90 days** for reachable-but-dangling entries (configurable via `gc.reflogExpire`), which is why a "lost" commit from last week is usually still recoverable.
</details>

---

## Level 2 · Apply

**2.1** You need to undo a commit that was pushed to `main` three days ago and is already deployed. What do you run?

<details><summary>Answer</summary>

**`git revert <sha>`.** It adds a new commit undoing the change without rewriting history that others (and your deploy pipeline) already depend on.
</details>

**2.2** You want just one bugfix commit from a long-running feature branch, without bringing in the rest of that branch's work. What's the tool?

<details><summary>Answer</summary>

**`git cherry-pick <sha>`.** It copies just that one commit's diff onto your current branch.
</details>

**2.3** Your team ships a desktop app with dated version numbers and needs to patch older releases independently of new development. Which branching strategy fits?

<details><summary>Answer</summary>

**Git Flow** — its `release/*` and `hotfix/*` branches exist specifically for maintaining shipped versions in parallel with ongoing `develop` work.
</details>

**2.4** You're mid-edit, dirty, and need to switch branches right now without committing. What's the single right move?

<details><summary>Answer</summary>

**`git stash push -m "description"`**, switch branches, do whatever's needed, switch back, `git stash pop`.
</details>

**2.5** A regression exists somewhere in the last 300 commits and you have a script that exits non-zero when it's present. What's the fastest way to find the exact commit?

<details><summary>Answer</summary>

**`git bisect start`, mark `bad`/`good`, then `git bisect run ./script.sh`** — roughly 9 automated steps (log₂ 300 ≈ 9) instead of checking commits one at a time.
</details>

**2.6** You're three branches deep in a stack (A → B → C) and A just got review feedback requiring a change. What's the correct order of operations?

<details><summary>Answer</summary>

**Update A, then `git rebase feature-A` on B, then `git rebase feature-B` on C** — bottom to top, always. Skipping a layer leaves a branch pointing at a stale ancestor.
</details>

**2.7** You need to work on a hotfix while a long build runs uninterrupted on `main` in another terminal. What avoids stashing entirely?

<details><summary>Answer</summary>

**`git worktree add ../repo-hotfix hotfix`** — a second real working directory, sharing the same `.git` database, checked out to a different branch.
</details>

**2.8** You rebased your own unpublished feature branch and need to update the remote copy you already pushed once. What's the safe push command?

<details><summary>Answer</summary>

**`git push --force-with-lease`** — it refuses the push if the remote moved since you last fetched, unlike a bare `--force`.
</details>

---

## Level 3 · Reason

**3.1** Why does a fast-forward merge not create a new commit, while a three-way merge does?

<details><summary>Answer</summary>

A fast-forward is possible only when the target branch hasn't diverged — there's nothing to combine, so git just slides the branch label forward along the existing line of commits. A three-way merge exists precisely because **both** branches have independent commits that need a new commit with two parents to tie together.
</details>

**3.2** Why does rebasing a branch someone else has pulled break things for them, specifically?

<details><summary>Answer</summary>

Rebase re-applies each commit as a **new object with a new hash**. Their clone still has the old-hash commits; the remote now has new-hash commits with the same content. `git pull`'s normal merge logic sees two unrelated-looking histories and tries to merge them, producing a confusing duplicate-looking mess rather than a clean update.
</details>

**3.3** Why is `rebase --onto` necessary for restacking, rather than a plain `rebase`?

<details><summary>Answer</summary>

A plain `git rebase <newbase>` replays *every* commit the current branch has over `<newbase>`'s tip. In a stack, the upper branch's ancestry already includes the lower branch's old commits — a plain rebase would try to replay those a second time. `rebase --onto <new> <old> <branch>` explicitly replays only the commits unique to `<branch>` (those not already on `<old>`), correctly skipping the duplicates.
</details>

**3.4** Why can `git reset --hard` be undone via reflog for *commits*, but not for uncommitted edits?

<details><summary>Answer</summary>

Reflog records every position **HEAD and branches have pointed at** — i.e., committed snapshots. Uncommitted working-directory edits were never snapshotted into any git object in the first place, so there's nothing for reflog to point back to.
</details>

**3.5** Why does `git stash` behave like a mini-commit internally, rather than some separate file-diff mechanism?

<details><summary>Answer</summary>

Because committing is the one operation git already knows how to snapshot, diff, and restore reliably — stash entries are actually commit objects (on a hidden ref), which is exactly why `git stash show -p` works like `git show` and why a stash can be turned into a real branch with `git stash branch`.
</details>

**3.6** Why is trunk-based development considered *higher* discipline than Git Flow, despite having fewer branches?

<details><summary>Answer</summary>

Fewer branches means less built-in isolation — safety has to come from somewhere, and that somewhere is disciplined feature flags, fast and trustworthy CI, and small, frequent commits. Git Flow's branches substitute process structure for that discipline; remove the structure without the discipline and trunk-based collapses into chaos.
</details>

**3.7** Why does `git bisect` need a *monotonic* bug — one that, once introduced, stays broken for every commit after it — to work correctly?

<details><summary>Answer</summary>

Bisect assumes the "bad" region is contiguous: everything from the culprit onward is bad, everything before is good. If the bug is intermittent or gets masked and reintroduced, that assumption breaks, and bisect's good/bad answers can point it at the wrong commit entirely.
</details>

**3.8** Why does `git cherry-pick` of a merge commit need special handling (`-m <parent-number>`) that a normal cherry-pick doesn't?

<details><summary>Answer</summary>

A normal commit has one parent, so "the diff this commit introduced" is unambiguous — it's the diff against that one parent. A merge commit has two parents, so there are two different diffs it could represent depending on which parent you compare against; `-m` tells git which one you mean.
</details>

---

### Score yourself

| Score | What it means |
|:--|:--|
| 20–24 | solid — you could onboard a teammate onto a stacked-PR workflow tomorrow |
| 14–19 | comfortable with daily git, revisit rebase/reset/reflog |
| under 14 | start from [01 · The Three Trees](01-three-trees.md) and work straight through |

---

⬅️ [🃏 Flashcards](flashcards.md) · [🏠 Index](../README.md) · [📋 Command cheat sheet](cheatsheet-commands.md) ➡️
