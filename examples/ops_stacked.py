"""Module 05 - a stack of branches, each forking from the tip of the one below it."""
from __future__ import annotations

from examples.git_lab import commit, run, run_ok


def build_stack(repo: str) -> dict[str, bool]:
    """feature-B forks from feature-A's tip, feature-C forks from feature-B's tip."""
    commit(repo, "base.txt", "0", "base")
    run(["switch", "-c", "feature-A"], repo)
    commit(repo, "a.txt", "a", "A work")
    run(["switch", "-c", "feature-B"], repo)
    commit(repo, "b.txt", "b", "B work")
    run(["switch", "-c", "feature-C"], repo)
    commit(repo, "c.txt", "c", "C work")
    is_anc = lambda base, branch: run_ok(["merge-base", "--is-ancestor", base, branch], repo).returncode == 0
    return {
        "A_is_ancestor_of_B": is_anc("feature-A", "feature-B"),
        "B_is_ancestor_of_C": is_anc("feature-B", "feature-C"),
        "A_is_ancestor_of_C": is_anc("feature-A", "feature-C"),
    }


def restack_onto(repo: str) -> dict[str, bool]:
    """After feature-A gains new commits, feature-B must be rebased onto the new tip."""
    commit(repo, "base.txt", "0", "base")
    run(["switch", "-c", "feature-A"], repo)
    commit(repo, "a.txt", "a", "A work")
    run(["switch", "-c", "feature-B"], repo)
    commit(repo, "b.txt", "b", "B work")
    run(["switch", "feature-A"], repo)
    commit(repo, "a2.txt", "a2", "A gained review feedback")
    run(["switch", "feature-B"], repo)
    before = run_ok(["merge-base", "--is-ancestor", "feature-A", "feature-B"], repo).returncode == 0
    run(["rebase", "feature-A"], repo)
    after = run_ok(["merge-base", "--is-ancestor", "feature-A", "feature-B"], repo).returncode == 0
    return {"up_to_date_before_restack": before, "up_to_date_after_restack": after}
