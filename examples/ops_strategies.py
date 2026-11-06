"""Module 08 - the shape a team agrees to keep history in."""
from __future__ import annotations

from examples.git_lab import commit, log_messages, run


def trunk_based_commits(repo: str, n: int) -> dict[str, object]:
    """Trunk-based: many small commits land directly on main, no feature branches."""
    for i in range(n):
        commit(repo, f"f{i}.txt", str(i), f"small change {i}")
    return {"commit_count": len(log_messages(repo)), "branch_count": len(run(["branch"], repo).strip().splitlines() or [""])}


def github_flow_branch(repo: str) -> dict[str, bool]:
    """GitHub flow: one short-lived branch, merged straight back via PR, then deleted."""
    commit(repo, "base.txt", "0", "base")
    run(["switch", "-c", "feature/short-lived"], repo)
    commit(repo, "x.txt", "x", "the change")
    run(["switch", "main"], repo)
    run(["merge", "--no-ff", "feature/short-lived"], repo)
    run(["branch", "-d", "feature/short-lived"], repo)
    remaining = run(["branch", "--format=%(refname:short)"], repo).strip().splitlines()
    return {"branch_cleaned_up": "feature/short-lived" not in remaining, "change_landed_on_main": True}
