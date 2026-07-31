import { execSync } from 'child_process';
import path from 'path';

export interface GitContext {
  repoName: string;
  branchName: string;
  commits: string[];
  changedFiles: string[];
  diffStat: string;
  recentDiffs: string;
}

export class GitCollector {
  private cwd: string;

  constructor(targetDir?: string) {
    this.cwd = targetDir || process.cwd();
  }

  public isGitRepository(): boolean {
    try {
      execSync('git rev-parse --is-inside-work-tree', { cwd: this.cwd, stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  public collectContext(options?: { since?: string; maxCommits?: number }): GitContext {
    if (!this.isGitRepository()) {
      return {
        repoName: path.basename(this.cwd),
        branchName: 'main',
        commits: [],
        changedFiles: [],
        diffStat: '',
        recentDiffs: ''
      };
    }

    const sinceArg = options?.since || '00:00:00';
    const maxCommits = options?.maxCommits || 15;

    // Repo Name & Branch
    const repoName = this.exec('git rev-parse --show-toplevel')
      ? path.basename(this.exec('git rev-parse --show-toplevel'))
      : path.basename(this.cwd);
    
    const branchName = this.exec('git rev-parse --abbrev-ref HEAD') || 'main';

    // Commits from today or recent
    let commitLogs = this.exec(`git log --since="${sinceArg}" --pretty=format:"%h - %s (%cr)" -n ${maxCommits}`);
    if (!commitLogs) {
      // Fallback: Last N commits if no commits found today
      commitLogs = this.exec(`git log --pretty=format:"%h - %s (%cr)" -n 5`);
    }

    const commits = commitLogs ? commitLogs.split('\n').filter(Boolean) : [];

    // Changed files
    const changedFilesRaw = this.exec(`git diff --name-only HEAD~${commits.length || 1} HEAD 2>/dev/null`)
      || this.exec('git status --short');
    const changedFiles = changedFilesRaw ? changedFilesRaw.split('\n').filter(Boolean) : [];

    // Diff stats
    const diffStat = this.exec(`git diff --stat HEAD~${commits.length || 1} HEAD 2>/dev/null`)
      || this.exec('git diff --stat');

    // Code Diffs summary (truncated to avoid huge context)
    let recentDiffs = this.exec(`git diff HEAD~${commits.length || 1} HEAD 2>/dev/null`) || '';
    if (recentDiffs.length > 5000) {
      recentDiffs = recentDiffs.slice(0, 5000) + '\n... [Diff truncado para brevidade]';
    }

    return {
      repoName,
      branchName,
      commits,
      changedFiles,
      diffStat,
      recentDiffs
    };
  }

  private exec(cmd: string): string {
    try {
      return execSync(cmd, { cwd: this.cwd, encoding: 'utf-8' }).trim();
    } catch {
      return '';
    }
  }
}
