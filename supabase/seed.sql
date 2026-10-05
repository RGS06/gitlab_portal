-- GitLab Learning & Assessment Portal - Seed Data
-- 25CSAE370: Project Management with Git
-- Initial Administrative Roster, Demo Batches, 12 Course Units, 40 MCQs, 15 Viva Questions

-- 1. SECTIONS
INSERT INTO public.sections (id, section_code, section_name, academic_year, program, handling_faculty_name, handling_faculty_email, active)
VALUES 
  ('10000000-0000-0000-0000-000000000001', 'A', 'Section A - Computer Science', '2025-2026', 'B.E. CSE', 'Mr. Raghavendra G.S', 'raghugs.cs@sode-edu.in', true),
  ('10000000-0000-0000-0000-000000000002', 'B', 'Section B - Computer Science', '2025-2026', 'B.E. CSE', 'Ms. Ashritha K P', 'ashritha.cs@sode-edu.in', true),
  ('10000000-0000-0000-0000-000000000003', 'C', 'Section C - Computer Science', '2025-2026', 'B.E. CSE', 'Ms. R. Soundharya', 'soundharya.cs@sode-edu.in', true)
ON CONFLICT (section_code) DO NOTHING;

-- 2. OPERATIONAL BATCHES
INSERT INTO public.batches (id, section_id, batch_code, batch_name, academic_year, program, active)
VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'A1', 'Batch A1 (Roll 001 - 030)', '2025-2026', 'B.E. CSE', true),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'A2', 'Batch A2 (Roll 031 - 060)', '2025-2026', 'B.E. CSE', true),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'B1', 'Batch B1 (Roll 001 - 030)', '2025-2026', 'B.E. CSE', true),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'B2', 'Batch B2 (Roll 031 - 060)', '2025-2026', 'B.E. CSE', true),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 'C1', 'Batch C1 (Roll 001 - 030)', '2025-2026', 'B.E. CSE', true),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000003', 'C2', 'Batch C2 (Roll 031 - 060)', '2025-2026', 'B.E. CSE', true)
ON CONFLICT (section_id, batch_code) DO NOTHING;

-- 3. FACULTY & ADMIN PROFILES
INSERT INTO public.profiles (id, roll_number, full_name, email, role, section_id, active)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'ADMIN01', 'System Administrator', 'admin@sode-edu.in', 'admin', NULL, true),
  ('30000000-0000-0000-0000-000000000002', 'FAC-CSE-01', 'Mr. Raghavendra G.S (Section A In-Charge)', 'raghugs.cs@sode-edu.in', 'faculty', '10000000-0000-0000-0000-000000000001', true),
  ('30000000-0000-0000-0000-000000000003', 'FAC-CSE-02', 'Ms. Ashritha K P (Section B In-Charge)', 'ashritha.cs@sode-edu.in', 'faculty', '10000000-0000-0000-0000-000000000002', true),
  ('30000000-0000-0000-0000-000000000004', 'FAC-CSE-03', 'Ms. R. Soundharya (Section C In-Charge)', 'soundharya.cs@sode-edu.in', 'faculty', '10000000-0000-0000-0000-000000000003', true)
ON CONFLICT (email) DO NOTHING;

-- 4. 12 LAB UNITS (Course: 25CSAE370)
INSERT INTO public.units (id, unit_number, title, program_number, description, notes_url, key_takeaways, published)
VALUES
  ('40000000-0000-0000-0000-000000000001', 1, 'Setting Up and Basic Commands', 'Exp 1', 'Initialize repository, track files, staging area, commit lifecycle and configuration.', '/notes/exp1-git-basics.pdf', ARRAY['git init creates .git directory', 'git add stages changes in index', 'git commit records immutable snapshot with SHA-1 hash', 'git status inspects working tree state'], true),
  ('40000000-0000-0000-0000-000000000002', 2, 'Creating and Managing Branches', 'Exp 2', 'Branch creation, checkout/switch, fast-forward merge and branch pointers.', '/notes/exp2-branching.pdf', ARRAY['A branch in Git is simply a lightweight movable pointer to a commit', 'git branch creates new branch without switching', 'git switch / git checkout moves HEAD pointer', 'Fast-forward merge updates target pointer directly if no divergent commits'], true),
  ('40000000-0000-0000-0000-000000000003', 3, 'Stashing and Workspace Switching', 'Exp 3', 'Temporary snapshotting of uncommitted changes with git stash, pop, and apply.', '/notes/exp3-stashing.pdf', ARRAY['git stash pushes dirty working directory state onto a stack', 'git stash pop applies and removes top stash', 'git stash list views stored stashes', 'Stashing preserves untracked files with -u flag'], true),
  ('40000000-0000-0000-0000-000000000004', 4, 'Collaboration and Remote Repositories', 'Exp 4', 'Cloning remote repositories, tracking branches, and remote aliases.', '/notes/exp4-remotes.pdf', ARRAY['git clone downloads entire commit history and creates origin remote', 'origin/master is a remote-tracking branch', 'git remote -v displays configured remote URLs', 'Remote tracking branches cannot be modified directly'], true),
  ('40000000-0000-0000-0000-000000000005', 5, 'Fetch and Rebase Operations', 'Exp 5', 'Fetching updates without merge and rebasing local commits onto updated upstream.', '/notes/exp5-fetch-rebase.pdf', ARRAY['git fetch retrieves objects without altering local working branches', 'git rebase replays local commits on top of new base commit', 'Rebase maintains a clean linear project history', 'Never rebase public shared branches that others depend upon'], true),
  ('40000000-0000-0000-0000-000000000006', 6, 'Custom Commit Merge Operations', 'Exp 6', 'Non-fast-forward merge creation with custom commit messages and merge conflict resolution.', '/notes/exp6-merge.pdf', ARRAY['git merge --no-ff forces a merge commit even when fast-forward is possible', 'Custom commit message can be supplied via -m flag', 'Merge conflicts occur when overlapping lines in same file are modified', 'Conflict markers <<<<<<<, =======, >>>>>>> denote conflicting regions'], true),
  ('40000000-0000-0000-0000-000000000007', 7, 'Git Tags and Releases', 'Exp 7', 'Lightweight and annotated tags, release tagging and semantic versioning.', '/notes/exp7-tags.pdf', ARRAY['Lightweight tags are simple pointers to specific commits', 'Annotated tags contain author, date, message and GPG signature', 'git tag -a v1.0 -m "Release v1.0" creates annotated tag', 'Tags must be pushed explicitly with git push origin --tags'], false),
  ('40000000-0000-0000-0000-000000000008', 8, 'Advanced Git: Cherry-Picking', 'Exp 8', 'Selective commit porting across branches using git cherry-pick.', '/notes/exp8-cherrypick.pdf', ARRAY['git cherry-pick applies the changes introduced by existing commits onto HEAD', 'Cherry-pick creates a new commit with identical diff but different hash', 'Can cherry-pick a range: commitA..commitB', 'Useful for hotfixing production branches without full branch merge'], false),
  ('40000000-0000-0000-0000-000000000009', 9, 'Analyzing History: Inspecting Commits', 'Exp 9', 'Inspecting individual commit diffs, metadata and tree objects with git show and log.', '/notes/exp9-git-show.pdf', ARRAY['git show displays commit metadata, log message and unified diff', 'git show <hash>:<file> inspects a file version at that specific commit', 'git log -p displays patch difference for each historical commit', 'Git objects are content-addressable by their SHA-1 hash'], false),
  ('40000000-0000-0000-0000-000000000010', 10, 'Filtered History Analysis', 'Exp 10', 'Filtering commit logs by author, date ranges, commit message and paths.', '/notes/exp10-log-filters.pdf', ARRAY['git log --author="Name" filters commits by author name or email pattern', 'git log --since="date" --until="date" bounds commit search temporally', 'git log --grep="bug" filters by commit message content', 'Multiple filter conditions combine conjunctively (AND logic)'], false),
  ('40000000-0000-0000-0000-000000000011', 11, 'Commit Log Formatting and Limits', 'Exp 11', 'Formatting history with --oneline, --graph, --stat and output limits (-n).', '/notes/exp11-log-formatting.pdf', ARRAY['git log -n 5 limits history output to the last 5 commits', 'git log --oneline condenses each commit to short SHA and subject line', 'git log --graph draws ASCII representation of branch merging topology', 'git log --stat summarizes changed files and inserted/deleted line counts'], false),
  ('40000000-0000-0000-0000-000000000012', 12, 'Undoing Changes in History', 'Exp 12', 'Safe history rewriting, reverting commits, soft/mixed/hard resets and checkout.', '/notes/exp12-undoing.pdf', ARRAY['git revert <hash> creates a forward commit that inverses previous changes', 'git revert is safe for shared/public branches', 'git reset --soft moves HEAD without touching staging or working tree', 'git reset --hard discards all uncommitted and staged modifications'], false)
ON CONFLICT (unit_number) DO NOTHING;

-- 5. VIDEOS FOR PUBLISHED UNITS
INSERT INTO public.videos (id, unit_id, title, source_type, source_url, duration_seconds)
VALUES
  ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Unit 1: Setting Up & Basic Git Commands', 'youtube', 'https://www.youtube.com/watch?v=mAFoROnOfHs', 720),
  ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'Unit 2: Creating and Managing Branches', 'youtube', 'https://www.youtube.com/watch?v=mAFoROnOfHs', 660),
  ('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', 'Unit 3: Git Stashing & State Switching', 'youtube', 'https://www.youtube.com/watch?v=mAFoROnOfHs', 540),
  ('50000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000004', 'Unit 4: Remotes and Distributed Collaboration', 'youtube', 'https://www.youtube.com/watch?v=mAFoROnOfHs', 780),
  ('50000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000005', 'Unit 5: Fetch vs Pull and Rebase Workflows', 'youtube', 'https://www.youtube.com/watch?v=mAFoROnOfHs', 840),
  ('50000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000006', 'Unit 6: Custom Merge Commits and Conflict Resolution', 'youtube', 'https://www.youtube.com/watch?v=mAFoROnOfHs', 690)
ON CONFLICT (id) DO NOTHING;
