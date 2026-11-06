"""Module 04 - rebase replays commits onto a new base, producing new hashes."""
from __future__ import annotations

from examples.git_lab import commit, log_messages, run, run_ok


def rebase_onto_main(repo: str) -> dict[str, object]:
    """Same two commits, relocated onto main's current tip, with new identities."""
    commit(repo, "a.txt", "1", "base")
    run(["switch", "-c", "feature"], repo)
    old_c1 = commit(repo, "b.txt", "2", "feature: first change")
    old_c2 = commit(repo, "c.txt", "3", "feature: second change")
    run(["switch", "main"], repo)
    commit(repo, "d.txt", "4", "main moved on while feature was being built")
    run(["switch", "feature"], repo)
    run(["rebase", "main"], repo)
    new_c1, new_c2 = run(["log", "--format=%H", "main..feature"], repo).strip().splitlines()[::-1]
    return {
        "hashes_changed": {old_c1, old_c2}.isdisjoint({new_c1, new_c2}),
        "messages_preserved": log_messages(repo, "feature")[:2] == ["feature: second change", "feature: first change"],
        "feature_now_descends_from_main": run_ok(["merge-base", "--is-ancestor", "main", "feature"], repo).returncode == 0,
    }
