"""Module 11 - bisect binary-searches history; worktree checks out several branches at once."""
from __future__ import annotations

import os
import shutil
import tempfile

from examples.git_lab import commit, rev, run, run_ok, write


def _commit_state(repo: str, index: int, status: str) -> str:
    """Commit a status marker plus a per-commit filler file, so every commit has a real diff."""
    write(repo, "status.txt", status)
    write(repo, f"note{index}.txt", str(index))
    run(["add", "-A"], repo)
    run(["commit", "-q", "-m", f"commit {index}: {status}"], repo)
    return rev(repo)


def bisect_finds_the_culprit(repo: str, good_count: int, bad_count: int) -> dict[str, object]:
    """git bisect run narrows a good..bad range to the exact breaking commit."""
    commits = [_commit_state(repo, i, "good") for i in range(good_count)]
    culprit = _commit_state(repo, good_count, "bad")
    commits.append(culprit)
    commits += [_commit_state(repo, good_count + 1 + i, "bad") for i in range(bad_count)]

    script = os.path.join(repo, "check.sh")
    write(repo, "check.sh", "#!/bin/sh\ngrep -q good status.txt\n")
    os.chmod(script, 0o755)

    run(["bisect", "start"], repo)
    run(["bisect", "bad", "HEAD"], repo)
    run(["bisect", "good", commits[0]], repo)
    run_ok(["bisect", "run", "sh", "check.sh"], repo)
    log = run(["bisect", "log"], repo)
    run(["bisect", "reset"], repo)
    return {"culprit_identified": culprit[:12] in log, "repo_restored_to_main": rev(repo) == commits[-1]}


def worktree_parallel_checkouts(repo: str) -> dict[str, object]:
    """One .git database, several real working directories checked out simultaneously."""
    commit(repo, "a.txt", "1", "base")
    run(["branch", "hotfix"], repo)
    extra_dir = tempfile.mkdtemp(prefix="gitviz-worktree-")
    shutil.rmtree(extra_dir)
    try:
        run(["worktree", "add", extra_dir, "hotfix"], repo)
        listing = run(["worktree", "list"], repo)
        main_head = rev(repo, "main")
        hotfix_head = rev(extra_dir, "HEAD")
        return {
            "second_working_dir_created": os.path.isdir(extra_dir),
            "both_worktrees_listed": listing.count("\n") >= 1,
            "same_commit_shared": main_head == hotfix_head,
        }
    finally:
        run_ok(["worktree", "remove", "--force", extra_dir], repo)
        shutil.rmtree(extra_dir, ignore_errors=True)
