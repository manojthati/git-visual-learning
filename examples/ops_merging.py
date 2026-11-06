"""Module 03 - merging has exactly two outcomes: fast-forward, or a merge commit."""
from __future__ import annotations

from examples.git_lab import commit, log_messages, rev, run


def fast_forward_merge(repo: str) -> dict[str, object]:
    """Possible only when main never moved while feature was being built."""
    commit(repo, "a.txt", "1", "base")
    run(["switch", "-c", "feature"], repo)
    commit(repo, "b.txt", "2", "feature work")
    run(["switch", "main"], repo)
    before = rev(repo, "main")
    run(["merge", "feature"], repo)
    after = rev(repo, "main")
    return {"main_advanced": before != after, "main_now_equals_feature": after == rev(repo, "feature")}


def three_way_merge(repo: str) -> dict[str, object]:
    """Both branches moved, so git ties them together with a new two-parent commit."""
    commit(repo, "a.txt", "1", "base")
    run(["switch", "-c", "feature"], repo)
    commit(repo, "b.txt", "2", "feature work")
    run(["switch", "main"], repo)
    commit(repo, "c.txt", "3", "main moved on too")
    run(["merge", "--no-edit", "feature"], repo)
    parents = run(["log", "-1", "--format=%P"], repo).strip().split()
    return {"merge_commit_parent_count": len(parents), "history": log_messages(repo)}
