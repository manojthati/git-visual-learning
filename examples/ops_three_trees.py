"""Module 01 - the three trees, and the two diffs between them."""
from __future__ import annotations

from examples.git_lab import run, write


def move_through_trees(repo: str, filename: str, content: str, message: str) -> dict[str, str]:
    """Walk one change through working dir -> staging -> repository."""
    write(repo, filename, content)
    dirty = run(["status", "--porcelain"], repo).strip()      # working dir only: untracked/modified
    run(["add", filename], repo)
    staged = run(["status", "--porcelain"], repo).strip()     # staged for the next commit
    run(["commit", "-q", "-m", message], repo)
    clean = run(["status", "--porcelain"], repo).strip()      # repository: tree is clean again
    return {"after_write": dirty, "after_add": staged, "after_commit": clean}


def diff_scopes(repo: str, filename: str, before: str, after: str) -> dict[str, str]:
    """git diff and git diff --staged compare two different pairs of trees."""
    write(repo, filename, before)
    run(["add", filename], repo)
    run(["commit", "-q", "-m", "base"], repo)
    write(repo, filename, after)                               # dirties the working dir only
    unstaged = run(["diff", "--stat"], repo).strip()           # working dir vs staging
    run(["add", filename], repo)
    staged = run(["diff", "--staged", "--stat"], repo).strip()  # staging vs last commit (repository)
    return {"working_vs_staging": unstaged, "staging_vs_commit": staged}
