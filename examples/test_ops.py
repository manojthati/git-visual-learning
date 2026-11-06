"""Tests for every operation embedded in docs/ — these drive the real git binary.

    python3 -m unittest discover -s examples -t .
"""
from __future__ import annotations

import shutil
import unittest

from examples.git_lab import run, scratch_repo
from examples.ops_advanced import bisect_finds_the_culprit, worktree_parallel_checkouts
from examples.ops_branching import create_and_switch, rename_and_delete
from examples.ops_cherry_pick import cherry_pick_one
from examples.ops_merging import fast_forward_merge, three_way_merge
from examples.ops_rebase import rebase_onto_main
from examples.ops_remotes import fetch_vs_pull, remote_pair
from examples.ops_stacked import build_stack, restack_onto
from examples.ops_stash import stash_is_lifo, stash_roundtrip
from examples.ops_strategies import github_flow_branch, trunk_based_commits
from examples.ops_three_trees import diff_scopes, move_through_trees
from examples.ops_undoing import reflog_recovers_a_lost_commit, reset_soft_mixed_hard, revert_keeps_history


def _has_git() -> bool:
    return shutil.which("git") is not None


@unittest.skipUnless(_has_git(), "git binary not available")
class TestThreeTrees(unittest.TestCase):
    def test_move_through_trees(self):
        with scratch_repo() as repo:
            r = move_through_trees(repo, "a.txt", "hello", "first commit")
            self.assertTrue(r["after_write"].startswith("??"))
            self.assertTrue(r["after_add"].startswith("A "))
            self.assertEqual(r["after_commit"], "")

    def test_diff_scopes(self):
        with scratch_repo() as repo:
            r = diff_scopes(repo, "a.txt", "v1", "v2")
            self.assertIn("a.txt", r["working_vs_staging"])
            self.assertIn("a.txt", r["staging_vs_commit"])


@unittest.skipUnless(_has_git(), "git binary not available")
class TestBranching(unittest.TestCase):
    def test_create_and_switch(self):
        with scratch_repo() as repo:
            run(["commit", "--allow-empty", "-q", "-m", "base"], repo)
            r = create_and_switch(repo, "feature/x")
            self.assertEqual(r["head_branch"], "feature/x")
            self.assertTrue(r["branch_points_at_fork"])

    def test_rename_and_delete(self):
        with scratch_repo() as repo:
            run(["commit", "--allow-empty", "-q", "-m", "base"], repo)
            r = rename_and_delete(repo, "old-name", "new-name")
            self.assertTrue(r["renamed_exists"])
            self.assertTrue(r["old_gone"])


@unittest.skipUnless(_has_git(), "git binary not available")
class TestMerging(unittest.TestCase):
    def test_fast_forward(self):
        with scratch_repo() as repo:
            r = fast_forward_merge(repo)
            self.assertTrue(r["main_advanced"])
            self.assertTrue(r["main_now_equals_feature"])

    def test_three_way(self):
        with scratch_repo() as repo:
            r = three_way_merge(repo)
            self.assertEqual(r["merge_commit_parent_count"], 2)
            self.assertIn("feature work", r["history"])
            self.assertIn("main moved on too", r["history"])


@unittest.skipUnless(_has_git(), "git binary not available")
class TestRebase(unittest.TestCase):
    def test_rebase_onto_main(self):
        with scratch_repo() as repo:
            r = rebase_onto_main(repo)
            self.assertTrue(r["hashes_changed"])
            self.assertTrue(r["messages_preserved"])
            self.assertTrue(r["feature_now_descends_from_main"])


@unittest.skipUnless(_has_git(), "git binary not available")
class TestStacked(unittest.TestCase):
    def test_build_stack(self):
        with scratch_repo() as repo:
            r = build_stack(repo)
            self.assertTrue(all(r.values()))

    def test_restack_onto(self):
        with scratch_repo() as repo:
            r = restack_onto(repo)
            self.assertFalse(r["up_to_date_before_restack"])
            self.assertTrue(r["up_to_date_after_restack"])


@unittest.skipUnless(_has_git(), "git binary not available")
class TestStash(unittest.TestCase):
    def test_stash_roundtrip(self):
        with scratch_repo() as repo:
            r = stash_roundtrip(repo)
            self.assertTrue(r["was_dirty_before"])
            self.assertTrue(r["was_clean_after_push"])
            self.assertTrue(r["dirty_again_after_pop"])

    def test_stash_is_lifo(self):
        with scratch_repo() as repo:
            entries = stash_is_lifo(repo)
            self.assertEqual(entries[0], "second")
            self.assertEqual(entries[1], "first")


@unittest.skipUnless(_has_git(), "git binary not available")
class TestCherryPick(unittest.TestCase):
    def test_cherry_pick_one(self):
        with scratch_repo() as repo:
            r = cherry_pick_one(repo)
            self.assertTrue(r["branch_A_gained_the_fix"])
            self.assertTrue(r["branch_B_unchanged"])
            self.assertEqual(r["branch_A_commit_count"], 2)


@unittest.skipUnless(_has_git(), "git binary not available")
class TestStrategies(unittest.TestCase):
    def test_trunk_based_commits(self):
        with scratch_repo() as repo:
            r = trunk_based_commits(repo, 5)
            self.assertEqual(r["commit_count"], 5)
            self.assertEqual(r["branch_count"], 1)

    def test_github_flow_branch(self):
        with scratch_repo() as repo:
            r = github_flow_branch(repo)
            self.assertTrue(r["branch_cleaned_up"])


@unittest.skipUnless(_has_git(), "git binary not available")
class TestUndoing(unittest.TestCase):
    def test_reset_soft_keeps_staged(self):
        with scratch_repo() as repo:
            r = reset_soft_mixed_hard(repo, "soft")
            self.assertTrue(r["head_moved"])
            self.assertTrue(r["status"].startswith("M "))

    def test_reset_hard_discards(self):
        with scratch_repo() as repo:
            r = reset_soft_mixed_hard(repo, "hard")
            self.assertEqual(r["status"], "")

    def test_revert_keeps_history(self):
        with scratch_repo() as repo:
            r = revert_keeps_history(repo)
            self.assertTrue(r["original_bad_commit_still_in_history"])
            self.assertTrue(r["history_grew"])
            self.assertEqual(r["file_content"], "1")

    def test_reflog_recovers_lost_commit(self):
        with scratch_repo() as repo:
            r = reflog_recovers_a_lost_commit(repo)
            self.assertTrue(r["gone_from_main_log"])
            self.assertTrue(r["visible_in_reflog"])
            self.assertTrue(r["restored_via_new_branch"])


@unittest.skipUnless(_has_git(), "git binary not available")
class TestRemotes(unittest.TestCase):
    def test_fetch_vs_pull(self):
        with remote_pair() as (bare, local):
            r = fetch_vs_pull(bare, local)
            self.assertTrue(r["after_fetch_main_unchanged"])
            self.assertTrue(r["after_fetch_tracking_ref_updated"])
            self.assertTrue(r["after_pull_main_updated"])


@unittest.skipUnless(_has_git(), "git binary not available")
class TestAdvanced(unittest.TestCase):
    def test_bisect_finds_culprit(self):
        with scratch_repo() as repo:
            r = bisect_finds_the_culprit(repo, good_count=3, bad_count=3)
            self.assertTrue(r["culprit_identified"])
            self.assertTrue(r["repo_restored_to_main"])

    def test_worktree_parallel(self):
        with scratch_repo() as repo:
            r = worktree_parallel_checkouts(repo)
            self.assertTrue(r["second_working_dir_created"])
            self.assertTrue(r["both_worktrees_listed"])
            self.assertTrue(r["same_commit_shared"])


if __name__ == "__main__":
    unittest.main()
