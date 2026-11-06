# 🃏 Flashcard deck — all 11 modules

The full deck, gathered from every module. Read the question, answer it **out loud or on paper**, then click to check. Getting it wrong is the useful part.

**How to use this:** work one section at a time, immediately after reading its module. Come back a day later and do the same section again — the second pass is where it sticks.

| Section | Cards |
|:--|--:|
| [The Three Trees](#the-three-trees) | 4 |
| [Branching Basics](#branching-basics) | 4 |
| [Merging](#merging) | 3 |
| [Rebase](#rebase) | 3 |
| [Stacked Branches](#stacked-branches) | 3 |
| [Stashing](#stashing) | 3 |
| [Cherry-Picking](#cherry-picking) | 2 |
| [Branching Strategies](#branching-strategies) | 2 |
| [Undoing Things](#undoing-things) | 3 |
| [Remote Workflows](#remote-workflows) | 2 |
| [The Advanced Toolbox](#the-advanced-toolbox) | 2 |
| **Total** | **31** |

---

## The Three Trees

<details><summary>What exactly is a git commit — a diff, or something else?</summary>
A full snapshot of the entire tracked tree at that point, plus a pointer to its parent commit(s). Git computes diffs on demand by comparing two snapshots; it doesn't store them.</details>

<details><summary>What's the difference between <code>git diff</code> and <code>git diff --staged</code>?</summary>
<code>git diff</code> compares the working directory to the staging area. <code>git diff --staged</code> compares the staging area to the last commit (the repository).</details>

<details><summary>If <code>git add</code> stages a file and you then edit it again, what does <code>git status</code> show?</summary>
The file in both "changes to be committed" (the staged version) and "changes not staged for commit" (your newer edit) — staging snapshots the file, it isn't a live link.</details>

<details><summary>Why is <code>git checkout -- file.txt</code> more dangerous than <code>git reset HEAD~1</code>?</summary>
<code>reset</code> only discards committed state, which reflog can usually recover. <code>checkout --</code> discards uncommitted working-directory edits, which were never snapshotted anywhere.</details>

---

## Branching Basics

<details><summary>What is a git branch, physically?</summary>
A small text file under <code>.git/refs/heads/</code> containing a 40-character commit hash. No copy of your files, no extra storage beyond that pointer.</details>

<details><summary>What does HEAD point to, normally?</summary>
A branch, not directly to a commit. The branch then points to the commit.</details>

<details><summary>What is "detached HEAD," and how do you get there?</summary>
HEAD pointing directly at a commit hash instead of a branch name, e.g. <code>git checkout abc1234</code>. New commits there are reachable only by hash until you create a branch.</details>

<details><summary>Why does <code>git branch -d</code> sometimes refuse to delete a branch?</summary>
Because it has commits unreachable from any other branch — deleting would make them effectively unrecoverable. <code>-D</code> overrides the check.</details>

---

## Merging

<details><summary>What determines whether a merge is fast-forward or three-way?</summary>
Whether the target branch has moved since the source branch forked off it. If not, fast-forward is possible. If it has, a three-way merge commit is required.</details>

<details><summary>How many parents does a merge commit have?</summary>
Two (or more for an octopus merge) — one per branch being combined. Every other commit has exactly one parent.</details>

<details><summary>What's the practical downside of <code>git merge --squash</code>?</summary>
It discards the source branch's individual commit history and records no merge relationship — a later genuine merge will show the whole diff again as new.</details>

---

## Rebase

<details><summary>What does rebase actually do to a commit?</summary>
Re-applies the same change as a brand-new commit object — same diff and message, different parent, different hash.</details>

<details><summary>Why is rebasing a shared branch dangerous?</summary>
The rewritten commits have new hashes. Anyone who already pulled the old ones now has history <code>git pull</code> can't reconcile normally.</details>

<details><summary>What does <code>rebase --onto new old branch</code> do differently from plain <code>rebase new</code>?</summary>
It replays only the commits on <code>branch</code> that aren't on <code>old</code>, instead of every commit <code>branch</code> has over <code>new</code>.</details>

---

## Stacked Branches

<details><summary>In a stack, does feature-B branch off main or off feature-A?</summary>
Off feature-A's current tip — that's the definition of a stack.</details>

<details><summary>Why does feature-C get "stranded" when feature-B merges into feature-A?</summary>
feature-C's history still points at feature-B's old commits. Once those fold into A and B is deleted, C's base is no longer actively maintained.</details>

<details><summary>Why use <code>rebase --onto</code> instead of a plain <code>rebase feature-A</code> to fix feature-C?</summary>
feature-C's ancestry already contains feature-B's old commits; a plain rebase would try to replay them a second time. <code>--onto</code> excludes everything already on the old base.</details>

---

## Stashing

<details><summary>What exactly does <code>git stash push</code> shelve?</summary>
Both working-directory changes and anything already staged, restoring the tree to match HEAD. Untracked files need <code>--include-untracked</code>.</details>

<details><summary>What's the difference between <code>stash pop</code> and <code>stash apply</code>?</summary>
<code>pop</code> applies then removes the entry. <code>apply</code> applies but leaves it on the stack.</details>

<details><summary>If <code>git stash pop</code> conflicts, is the stash entry lost?</summary>
No — it stays in <code>git stash list</code> until the conflict is fully resolved and there's nothing left to apply.</details>

---

## Cherry-Picking

<details><summary>Does cherry-pick remove the commit from the branch you picked it from?</summary>
No. The donor branch is untouched — cherry-pick applies a copy as a new commit elsewhere, with a new hash.</details>

<details><summary>What does the <code>-x</code> flag add?</summary>
A trailer line, <code>(cherry picked from commit &lt;sha&gt;)</code>, noting where a backported fix came from.</details>

---

## Branching Strategies

<details><summary>What's the core trade Git Flow makes?</summary>
More structure (separate develop/release/hotfix branches) for a clear boundary between in-progress and released work.</details>

<details><summary>How does trunk-based development get safety without feature branches?</summary>
From feature flags plus fast, trustworthy CI — unfinished work ships dark behind a flag instead of being isolated on a branch.</details>

---

## Undoing Things

<details><summary>What's the one thing all three reset modes have in common?</summary>
All three move HEAD and the branch pointer to the target commit; they differ only in how far downstream that move reaches.</details>

<details><summary>Why is <code>revert</code> safe on a shared branch when <code>reset --hard</code> is not?</summary>
<code>revert</code> adds a new commit and never rewrites history. <code>reset --hard</code>, if pushed, can erase commits others already pulled.</details>

<details><summary>You ran <code>git reset --hard</code> and lost a commit. Is it gone?</summary>
Almost certainly not, if it was ever committed — <code>git reflog</code> keeps ~90 days of everywhere HEAD pointed locally.</details>

---

## Remote Workflows

<details><summary>What's the one-sentence difference between fetch and pull?</summary>
Fetch updates your knowledge of the remote without touching your branch; pull fetches, then merges (or rebases) that into your current branch.</details>

<details><summary>What does <code>git push -u origin feature/x</code> do that a plain push doesn't?</summary>
Sets the upstream tracking relationship, so future plain <code>push</code>/<code>pull</code> on this branch know where to go.</details>

---

## The Advanced Toolbox

<details><summary>Why is bisect's step count O(log n) rather than O(n)?</summary>
Each test halves the remaining range of commits, exactly like binary search — a 1,000-commit range narrows to the culprit in about ten tests.</details>

<details><summary>What does <code>git worktree</code> avoid that switching branches normally requires?</summary>
Stashing — each worktree is its own real directory with its own checked-out branch, sharing one <code>.git</code> object database.</details>

---

⬅️ [00 · How to read this repo](00-how-to-read-this.md) · [🏠 Index](../README.md) · [❓ Quiz](quiz.md) ➡️
