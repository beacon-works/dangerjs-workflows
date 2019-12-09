import { GitHubPRDSL } from '../node_modules/danger/distribution/dsl/GitHubDSL';
export declare function message(message: string): void;
export declare function warn(message: string): void;
export declare function fail(message: string): void;
export declare function markdown(message: string): void;
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
export interface ExtendedGitHubPRDSL extends GitHubPRDSL {
    labels?: GitHubLabel[];
    mergeable?: boolean;
    mergeable_state?: string;
    rebaseable?: boolean;
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
