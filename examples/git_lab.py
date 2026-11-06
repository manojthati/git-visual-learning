"""Shared scratch-repo helpers used by every ops_*.py module.

Every example in this repo drives the REAL `git` binary against a throwaway
repository in a temp directory, then inspects the resulting state. Nothing
here simulates git — it is git, which is what makes the tests trustworthy.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
from contextlib import contextmanager


def run(args: list[str], cwd: str) -> str:
    """Run a git command in cwd, raise on failure, return stdout."""
    result = subprocess.run(
        ["git", *args], cwd=cwd, capture_output=True, text=True,
        env={**os.environ, "GIT_CONFIG_NOSYSTEM": "1"},
    )
    if result.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} failed:\n{result.stderr}")
    return result.stdout


def run_ok(args: list[str], cwd: str) -> subprocess.CompletedProcess:
    """Run a git command that is allowed to fail; return the CompletedProcess."""
    return subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True)


@contextmanager
def scratch_repo():
    """A fresh, isolated git repo on branch 'main', cleaned up on exit."""
    path = tempfile.mkdtemp(prefix="gitviz-")
    run(["init", "-q", "-b", "main"], path)
    run(["config", "user.email", "test@example.com"], path)
    run(["config", "user.name", "Test"], path)
    run(["config", "commit.gpgsign", "false"], path)
    try:
        yield path
    finally:
        shutil.rmtree(path, ignore_errors=True)


def write(repo: str, filename: str, content: str) -> None:
    """Write (or overwrite) a tracked file's content."""
    with open(os.path.join(repo, filename), "w") as f:
        f.write(content)


def commit(repo: str, filename: str, content: str, message: str) -> str:
    """Write a file, stage it, commit it. Returns the new commit hash."""
    write(repo, filename, content)
    run(["add", filename], repo)
    run(["commit", "-q", "-m", message], repo)
    return rev(repo)


def rev(repo: str, ref: str = "HEAD") -> str:
    """Resolve a ref to its full commit hash."""
    return run(["rev-parse", ref], repo).strip()


def branches(repo: str) -> list[str]:
    """Every local branch name, sorted."""
    out = run(["branch", "--format=%(refname:short)"], repo)
    return sorted(l for l in out.splitlines() if l)


def log_messages(repo: str, ref: str = "HEAD") -> list[str]:
    """Commit subject lines on ref, newest first."""
    out = run(["log", "--format=%s", ref], repo)
    return out.splitlines()


def current_branch(repo: str) -> str:
    """The branch HEAD currently points at (empty string if detached)."""
    return run(["branch", "--show-current"], repo).strip()
