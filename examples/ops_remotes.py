"""Module 10 - fetch, pull and push between a local repo and a remote."""
from __future__ import annotations

import os
import shutil
import tempfile
from contextlib import contextmanager

from examples.git_lab import commit, rev, run


@contextmanager
def remote_pair():
    """A bare 'origin' plus a local clone of it, both cleaned up on exit."""
    bare = tempfile.mkdtemp(prefix="gitviz-origin-")
    run(["init", "-q", "--bare", "-b", "main"], bare)
    local = tempfile.mkdtemp(prefix="gitviz-local-")
    run(["clone", "-q", bare, local], os.path.dirname(local))
    run(["config", "user.email", "test@example.com"], local)
    run(["config", "user.name", "Test"], local)
    run(["config", "commit.gpgsign", "false"], local)
    commit(local, "a.txt", "1", "initial")
    run(["push", "-q", "-u", "origin", "main"], local)
    try:
        yield bare, local
    finally:
        shutil.rmtree(bare, ignore_errors=True)
        shutil.rmtree(local, ignore_errors=True)


def fetch_vs_pull(bare: str, local: str) -> dict[str, object]:
    """fetch only updates origin/main; pull also merges it into your branch."""
    other = tempfile.mkdtemp(prefix="gitviz-other-")
    try:
        run(["clone", "-q", bare, other], os.path.dirname(other))
        run(["config", "user.email", "test@example.com"], other)
        run(["config", "user.name", "Test"], other)
        run(["config", "commit.gpgsign", "false"], other)
        pushed = commit(other, "b.txt", "2", "someone else's change")
        run(["push", "-q"], other)

        run(["fetch", "-q"], local)
        local_main_unchanged = rev(local, "main") != pushed
        remote_ref_updated = rev(local, "origin/main") == pushed

        run(["pull", "-q"], local)
        local_main_now_matches = rev(local, "main") == pushed
        return {
            "after_fetch_main_unchanged": local_main_unchanged,
            "after_fetch_tracking_ref_updated": remote_ref_updated,
            "after_pull_main_updated": local_main_now_matches,
        }
    finally:
        shutil.rmtree(other, ignore_errors=True)
