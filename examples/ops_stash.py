"""Module 06 - stash: a LIFO shelf for uncommitted work."""
from __future__ import annotations

from examples.git_lab import commit, run, write


def stash_roundtrip(repo: str) -> dict[str, object]:
    """push tucks dirty work away and gives back a clean tree; pop restores it."""
    commit(repo, "a.txt", "base", "base")
    write(repo, "a.txt", "dirty edit")
    dirty_before = run(["status", "--porcelain"], repo).strip()
    run(["stash", "push", "-m", "wip"], repo)
    clean_after_push = run(["status", "--porcelain"], repo).strip()
    run(["stash", "pop"], repo)
    dirty_after_pop = run(["status", "--porcelain"], repo).strip()
    return {
        "was_dirty_before": bool(dirty_before),
        "was_clean_after_push": clean_after_push == "",
        "dirty_again_after_pop": dirty_after_pop == dirty_before,
    }


def stash_is_lifo(repo: str) -> list[str]:
    """Each new push inserts at stash@{0} and shifts older entries down."""
    commit(repo, "a.txt", "base", "base")
    write(repo, "a.txt", "first edit")
    run(["stash", "push", "-m", "first"], repo)
    write(repo, "a.txt", "second edit")
    run(["stash", "push", "-m", "second"], repo)
    listing = run(["stash", "list"], repo).strip().splitlines()
    return [line.rsplit(": ", 1)[-1] for line in listing]
