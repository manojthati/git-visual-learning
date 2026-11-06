"""Module 07 - cherry-pick copies one commit's change onto another branch."""
from __future__ import annotations

from examples.git_lab import commit, log_messages, run


def cherry_pick_one(repo: str) -> dict[str, object]:
    """branch-B donates one commit to branch-A; branch-B stays fully intact."""
    commit(repo, "base.txt", "0", "base")
    run(["switch", "-c", "branch-B"], repo)
    commit(repo, "x.txt", "x", "unrelated work")
    picked = commit(repo, "fix.txt", "the fix", "the fix we need")
    commit(repo, "y.txt", "y", "more unrelated work")
    donor_history_before = log_messages(repo, "branch-B")
    run(["switch", "main"], repo)
    run(["cherry-pick", picked], repo)
    return {
        "branch_A_gained_the_fix": "the fix we need" in log_messages(repo, "main"),
        "branch_B_unchanged": log_messages(repo, "branch-B") == donor_history_before,
        "branch_A_commit_count": len(log_messages(repo, "main")),
    }
