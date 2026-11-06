"""Module 09 - reset moves pointers, revert adds history, reflog remembers everything."""
from __future__ import annotations

from examples.git_lab import commit, log_messages, rev, run, write


def reset_soft_mixed_hard(repo: str, mode: str) -> dict[str, object]:
    """--soft keeps staging; --mixed (default) unstages but keeps the file; --hard discards it."""
    commit(repo, "a.txt", "1", "first")
    commit(repo, "a.txt", "2", "second")
    head_before = rev(repo)
    run(["reset", f"--{mode}", "HEAD~1"], repo)
    return {
        "head_moved": rev(repo) != head_before,
        "status": run(["status", "--porcelain"], repo).strip(),
    }


def revert_keeps_history(repo: str) -> dict[str, object]:
    """git revert undoes a commit by adding a NEW one, never rewriting the old."""
    first = commit(repo, "a.txt", "1", "first")
    bad = commit(repo, "a.txt", "bad value", "a bad change")
    run(["revert", "--no-edit", bad], repo)
    with open(f"{repo}/a.txt") as f:
        file_content = f.read()
    return {
        "original_bad_commit_still_in_history": bad in run(["log", "--format=%H"], repo),
        "history_grew": len(log_messages(repo)) == 3,
        "file_content": file_content,
    }


def reflog_recovers_a_lost_commit(repo: str) -> dict[str, bool]:
    """reflog remembers every place HEAD pointed, even after a hard reset."""
    commit(repo, "a.txt", "1", "first")
    lost = commit(repo, "a.txt", "2", "second - about to be lost")
    run(["reset", "--hard", "HEAD~1"], repo)
    gone_from_log = lost not in run(["log", "--format=%H"], repo)
    reflog_hashes = run(["reflog", "--format=%H"], repo).splitlines()
    recoverable = lost in reflog_hashes
    run(["branch", "recovered", lost], repo)
    restored = lost in run(["log", "--format=%H", "recovered"], repo)
    return {"gone_from_main_log": gone_from_log, "visible_in_reflog": recoverable, "restored_via_new_branch": restored}
