/* eslint-disable @typescript-eslint/camelcase */
// Provides dev-time type structures for  `danger` - doesn't affect runtime.
import { DangerDSLType } from '../node_modules/danger/distribution/dsl/DangerDSL';
declare let danger: DangerDSLType;
export declare function message(message: string): void;
export declare function warn(message: string): void;
export declare function fail(message: string): void;
export declare function markdown(message: string): void;

import { PRIssue, PRPull, ExtendedGitHubPRDSL, DangerOptions, GitHubUser } from './types';

const clubhouseBaseUrl = 'https://app.clubhouse.io/beacon-works/story';

export class DangerCheck {
  private opts: DangerOptions;
  private pr: ExtendedGitHubPRDSL; // https://danger.systems/js/reference.html#GitHubPRDSL
  private prPull: PRPull;
  private prIssue: PRIssue;
  private prLabels: string[];
  private currentApprovals: string[];
  private mergeCommitBlock: string | undefined;

  constructor(opts: DangerOptions) {
    // tslint:disable-next-line
    const { repo, owner, number } = danger.github.thisPR;
    this.opts = opts;
    this.pr = danger.github.pr;
    this.prPull = { repo, owner, pull_number: number };
    this.prIssue = { repo, owner, issue_number: number };
    this.prLabels = this.pr.labels ? this.pr.labels.map(label => label.name.toLowerCase()) : [];
    this.mergeCommitBlock = undefined;
    this.currentApprovals = [];
  }

  // GitHub API: https://octokit.github.io/rest.js
  public run = async (): Promise<void> => {
    const { manualMergeTag, noQaTag, workInProgressTag, checkType } = this.opts;
    const {
      locked,
      merged,
      mergeable,
      mergeable_state,
      rebaseable,
      requested_reviewers,
      requested_teams,
      state,
    } = this.pr;
    const branchRef = this.pr.head.ref;

    await this.getListOfCurrentApprovals();
    await this.removeExistingBotComments();

    if (workInProgressTag && this.prLabels.includes(workInProgressTag)) {
      return message('Detected a work-in-progress label. Skipping DangerJS checks.');
    }

    if (state === 'open' && !locked) {
      if (checkType === 'pr-checks') {
        if (!this.prLabels.includes(noQaTag)) {
          this.addReviewTeamsBasedOnApprovals(['qa'], 2);
        }

        // this.checkChangelog();

        // Looks for Clubhouse story ID in branch name and creates link to corresponding story in Clubhouse
        if (branchRef) {
          this.addLinkToClubhouseStory(branchRef);
        }
        this.addMetaDataAboutPR(); // an example of showing meta data or other useful information
      } else if (checkType === 'automerge') {
        // Return if there are still outstanding reviews requested
        if (requested_reviewers && requested_reviewers.length > 0) return;
        if (requested_teams && requested_teams.length > 0) return;

        if (manualMergeTag && this.prLabels.includes(manualMergeTag)) {
          return message('Detected a manual merge label. Disabling auto-merge.');
        }

        // if (this.currentApprovals.length < 2) {
        //   return warn('Waiting for at least two approval. Disabling auto-merge.');
        // }

        if (!merged && mergeable && mergeable_state !== 'blocked' && rebaseable) {
          this.autoMergePullRequest();
        }
      }
    }
  };

  private removeExistingBotComments = async (): Promise<void> => {
    const { repo, owner } = danger.github.thisPR;
    const { listComments, deleteComment } = danger.github.api.issues;
    await listComments(this.prIssue).then(resp => {
      if (resp.data && resp.data.length > 0) {
        resp.data.forEach(comment => {
          if (comment.user.login === 'beacon-bot') {
            deleteComment({ repo, owner, comment_id: comment.id });
          }
        });
      }
    });
  };

  // Rule: "PR with specified labels matching teams should assign those teams for reviewers"
  private addReviewTeamsBasedOnLabels = (labels: string[]): void => {
    const requiredTeams = this.prLabels.filter(label => labels.includes(label));
    // TODO: add a check to verify a label does have a matching team before adding it to the api call.
    if (requiredTeams.length > 0) {
      danger.github.api.pulls.createReviewRequest({
        ...this.prPull,
        reviewers: [],
        team_reviewers: requiredTeams,
      });
    }
  };

  // Formats title: capitalize first letter, remove special characters from the end.
  private formatPRTitle = (): string => {
    const { title } = this.pr;
    const endsWithSpecialChar = new RegExp(/([./,;:'"])+$/);

    return `${title.slice(0, 1).toUpperCase() + title.slice(1)}`.replace(endsWithSpecialChar, '');
  };

  private getCommitDescription = (): string | undefined => {
    const { body } = this.pr;
    // matches every code block in the description that starts with ```commit
    const commitBlockRegex = new RegExp(/(`{3}commit)[\r\n]([a-z]*[\s\S]*?)[\r\n](`{3})$/, 'gm');
    const commitBlocks: string[] | null = body.match(commitBlockRegex);

    if (commitBlocks) {
      const backTicksWithCommitBlock = new RegExp(/(`{3}commit)(\r\n)/, 'g');
      const backTicks = new RegExp(/(`{3})/, 'g');
      const onlyLineBreaks = new RegExp(/^(\r\n)+$/);
      // Rule: if there are multiple ```commit blocks, we only care about the last one
      const lastCommitBlock: string = commitBlocks[commitBlocks.length - 1];
      const strippedCommitBlock: string = lastCommitBlock
        .trim()
        .replace(backTicksWithCommitBlock, '')
        .replace(backTicks, '');

      if (strippedCommitBlock.match(onlyLineBreaks)) {
        fail(
          'Detected an empty commit code block. Did you mean to leave a commit description? If not, remove the ```commit code block.',
        );
      }

      return strippedCommitBlock;
    }
  };

  // Capture unique users who have approved the PR.
  private getListOfCurrentApprovals = async (): Promise<void> => {
    const { listReviews } = danger.github.api.pulls;

    await listReviews(this.prPull).then(resp => {
      this.currentApprovals =
        resp.data && resp.data.length > 0
          ? [...new Set(resp.data.filter(review => review.state === 'APPROVED').map(review => review.user.login))]
          : [];
    });
  };

  // Compares approved reviewers against currently requested reviewers. Resolves to true if there's
  // a match indicating there's a new review request for a user who previously approved the PR.
  private hasPendingReviewRequests = (usersWhoApproved: string[]): boolean => {
    const { requested_reviewers } = this.pr;

    return requested_reviewers && requested_reviewers.length > 0
      ? requested_reviewers.some((requested_reviewer: GitHubUser) =>
          usersWhoApproved.includes(requested_reviewer.login),
        )
      : false;
  };

  private addLinkToClubhouseStory = (refBranch: string): void => {
    const clubhouseTicketRegex = new RegExp(/ch(\d+)/, 'i');
    const storyNumber: string | null = refBranch.match(clubhouseTicketRegex)![1] || null;

    if (storyNumber) {
      message(`Clubhouse Reference: [CH${storyNumber}](${clubhouseBaseUrl}/${storyNumber})`);
    }
  };

  private addMetaDataAboutPR = (): void => {
    const { additions, changed_files, commits, deletions } = this.pr;
    message(
      `This PR contains ${commits} commits affecting ${changed_files} files, for a total of ${additions} additions and ${deletions} deletions.`,
    );
  };

  // Rule: "PR with [noOfApprovals] approvals should then be assigned to [teams]"
  private addReviewTeamsBasedOnApprovals = (teams: string[], noOfApprovals: number): void => {
    const { createReviewRequest } = danger.github.api.pulls;
    const { requested_teams } = this.pr;

    // Return if the team has already been requested
    if (requested_teams && requested_teams.some(team => teams.includes(team.slug))) return;

    if (this.hasPendingReviewRequests(this.currentApprovals)) return;

    if (noOfApprovals === this.currentApprovals.length) {
      createReviewRequest({
        ...this.prPull,
        reviewers: [],
        team_reviewers: teams,
      });
    }
  };

  // Rule: "No PR is too small to include in the changelog"
  private checkChangelog = (): void => {
    const { modified_files, created_files } = danger.git;
    const hasChangelog = modified_files.concat(created_files).includes('CHANGELOG.md');
    if (!hasChangelog) {
      warn(`<i>Warning - You may have forgotten to update the CHANGELOG</i>`);
    }
  };

  private autoMergePullRequest = (): void => {
    const formattedTitle = this.formatPRTitle();

    // Append PR hash to the end of the title, like how GitHub does it by default.
    const titleWithPRHash = `${formattedTitle} (#${this.pr.number})`;

    this.mergeCommitBlock = this.getCommitDescription();

    danger.github.api.pulls
      .merge({
        ...this.prPull,
        commit_title: titleWithPRHash,
        commit_message: this.mergeCommitBlock,
        merge_method: 'squash',
      })
      .then(resp => {
        danger.github.api.issues.createComment({
          ...this.prIssue,
          body: resp.data.message,
        });
      })
      .catch(err => fail(`Attempt to auto-merge failed! ${err}`));
  };
}
