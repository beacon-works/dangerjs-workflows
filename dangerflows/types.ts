import { GitHubPRDSL, GitHubUser } from 'danger';

interface GitHubLabel {
  id: number;
  node_id: string;
  url: string;
  name: string;
  color: string;
  default: boolean;
  description?: string;
}

export { GitHubPRDSL, GitHubUser };

export interface ThisPR {
  repo: string;
  owner: string;
}

export interface PRIssue extends ThisPR {
  issue_number: number;
}

export interface PRPull extends ThisPR {
  pull_number: number;
}

interface Team {
  name: string;
  id: number;
  node_id: string;
  slug: string;
  description: string;
  privacy: string;
  url: string;
  html_url: string;
  members_url: string;
  repositories_url: string;
  permission: string;
}

// GitHubPRDSL: https://danger.systems/js/reference.html#GitHubPRDSL
export interface ExtendedGitHubPRDSL extends GitHubPRDSL {
  labels?: GitHubLabel[];
  mergeable?: boolean;
  mergeable_state?: string;
  rebaseable?: boolean;
  requested_reviewers?: GitHubUser[];
  requested_teams?: Team[];
}

export interface DangerOptions {
  checkType: 'pr-checks' | 'automerge';
  manualMergeTag: string;
  noQaTag: string;
  workInProgressTag: string;
}
