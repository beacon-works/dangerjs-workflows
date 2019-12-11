import { GitHubPRDSL } from 'danger';
interface GitHubLabel {
    id: number;
    node_id: string;
    url: string;
    name: string;
    color: string;
    default: boolean;
    description?: string;
}
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
export interface Team {
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
export interface ExtendedGitHubPRDSL extends GitHubPRDSL {
    labels?: GitHubLabel[];
    mergeable?: boolean;
    mergeable_state?: string;
    rebaseable?: boolean;
    requested_reviewers?: Object[];
    requested_teams?: Team[];
}
export interface DangerOptions {
    manualMergeTag?: string;
}
export declare class DangerChecks {
    private opts;
    private pr;
    private prPull;
    private prIssue;
    private prLabels;
    private mergeCommitBlock;
    constructor(opts: DangerOptions);
    run: () => void;
    private addReviewTeamsBasedOnLabels;
    private checkPRTitle;
    private checkPRDescription;
    private addReviewTeamsBasedOnApprovals;
    private autoMergePullRequest;
    private addMetaDataAboutPR;
    private checkChangelog;
    private performSpellCheck;
}
export {};
