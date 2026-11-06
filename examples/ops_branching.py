"""Module 02 - a branch is a movable label; HEAD is a label pointing at one."""
from __future__ import annotations

from examples.git_lab import current_branch, rev, run


def create_and_switch(repo: str, branch: str) -> dict[str, object]:
    """git switch -c: create a branch at the current commit, move HEAD onto it."""
    fork_point = rev(repo)
    run(["switch", "-c", branch], repo)
    return {
        "head_branch": current_branch(repo),
        "branch_points_at_fork": rev(repo, branch) == fork_point,
    }


def rename_and_delete(repo: str, old: str, new: str) -> dict[str, bool]:
    """git branch -m renames a label; -d refuses to delete an unmerged branch."""
    run(["branch", old], repo)
    run(["branch", "-m", old, new], repo)
    renamed_exists = new in run(["branch", "--format=%(refname:short)"], repo)
    old_gone = old not in run(["branch", "--format=%(refname:short)"], repo)
    return {"renamed_exists": renamed_exists, "old_gone": old_gone}
