/* eslint-disable @typescript-eslint/camelcase */
// Provides dev-time type structures for  `danger` - doesn't affect runtime.
import { DangerDSLType } from '../node_modules/danger/distribution/dsl/DangerDSL';
declare let danger: DangerDSLType;
export declare function message(message: string): void;
export declare function warn(message: string): void;
export declare function fail(message: string): void;
export declare function markdown(message: string): void;

import { PRIssue, PRPull, ExtendedGitHubPRDSL, DangerOptions, GitHubUser } from './types';

// this spell check is used to analyze the PR title and description
import * as SimpleSpellChecker from 'simple-spellchecker';

const dictionary = SimpleSpellChecker.getDictionarySync('en-US');

import settings from '../spellcheck.json';

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

    await this.getListOfCurrentApprovals();
    await this.removeExistingBotComments();

    if (workInProgressTag && this.prLabels.includes(workInProgressTag)) {
      return warn('Detected a work-in-progress label. Skipping DangerJS checks.');
    }

    if (state === 'open' && !locked) {
      if (checkType === 'pr-checks') {
        if (!this.prLabels.includes(noQaTag)) {
          this.addReviewTeamsBasedOnApprovals(['qa'], 2);
        }

        this.checkPRTitle();
        this.checkPRDescription();
        // this.checkChangelog();

        this.addMetaDataAboutPR();
      } else if (checkType === 'automerge') {
        // Return if there are still outstanding reviews requested
        if (requested_reviewers && requested_reviewers.length > 0) return;
        if (requested_teams && requested_teams.length > 0) return;

        if (manualMergeTag && this.prLabels.includes(manualMergeTag)) {
          return warn('Detected a manual merge label. Disabling auto-merge.');
        }

        // if (!this.prLabels.includes(noQaTag) && this.currentApprovals.length < 4) {
        //   return warn('Waiting for a total of 4 approvals. Disabling auto-merge.');
        // }

        if (this.currentApprovals.length < 2) {
          return warn('Waiting for at least two approval. Disabling auto-merge.');
        }

        if (!merged && mergeable && mergeable_state !== 'blocked' && rebaseable) {
          this.mergeCommitBlock = this.parseCodeBlock();

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

  // Rule: "No PR is too small to include a title highlighting the changes you made"
  // https://chris.beams.io/posts/git-commit/
  private checkPRTitle = (): void => {
    const { title } = this.pr;
    const startsWithLowerCase = new RegExp(/^[a-z]{1}/);
    const endsWithSpecialChar = new RegExp(/([./,;:'"])+$/);

    if (title.length < 5) {
      warn('<i>Your PR title seems a bit short. Please provide a bit more context.</i>');
    }

    if (title.length > 50) {
      warn("<i>Your PR title is a bit long. Let's keep it under 50 characters.</i>");
    }

    // we should just capitalize for the user
    if (startsWithLowerCase.test(title)) {
      warn("<i>Let's keep PR titles capitalized for consistency.</i>");
    }

    // check and remove periods
    if (endsWithSpecialChar.test(title)) {
      warn("<i>Let's keep PR titles free of periods or special characters at the end.</i>");
    }

    this.performSpellCheck(title, 'PR title');
  };

  // Rule: "No PR is too small to include a description of why you made a change"
  private checkPRDescription = (): void => {
    const { manualMergeTag } = this.opts;
    const { body } = this.pr;
    const clubhouseTicketRegex = new RegExp(/(\/\/.*app\.clubhouse\.io\/beacon-works[\w/-]*)/);

    if (body.length < 10) {
      warn(
        '<i>Your PR description seems a bit short. Here are some things to consider: describe your changes, include helpful steps for reviewers, link to Clubhouse ticket, and add a commit code block at the end (if auto-merging).</i>',
      );
    }

    if (!clubhouseTicketRegex.test(body)) {
      warn("<i>Is this PR related to a Clubhouse ticket? If so, don't forget to include a reference to it.</i>");
    }

    if (manualMergeTag && this.prLabels.includes(manualMergeTag)) return;

    // extract out into constructor
    const parsedCodeBlock = this.parseCodeBlock();

    if (parsedCodeBlock) {
      this.performSpellCheck(parsedCodeBlock, 'PR description');
    }
  };

  private parseCodeBlock = (): string | undefined => {
    const { body } = this.pr;
    // matches every code block in the description that starts with ```commit
    const codeBlockRegex = new RegExp(/(`{3}commit)[\r\n]([a-z]*[\s\S]*?)[\r\n](`{3})$/, 'gm');
    const codeBlocks: string[] | null = body.match(codeBlockRegex) || null;

    if (codeBlocks) {
      const backTicksWithCommitBlock = new RegExp(/(`{3}commit)(\r\n)/, 'g');
      const backTicks = new RegExp(/(`{3})/, 'g');

      const lastCodeBlock: string = codeBlocks[codeBlocks.length - 1];
      return (
        lastCodeBlock
          .trim()
          .replace(backTicksWithCommitBlock, '')
          .replace(backTicks, '') || undefined
      );
    } else {
      fail(
        "Oops! It looks like you're missing a commit block in the description of your PR. I use this to auto-merge your PR. Simply create a code block starting with <i>```commit</i> at the bottom of your description. Include a longer commit message inside, if necessary—otherwise, leave it as an empty code block.",
      );
    }
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

  // Capture unique users who's approved the PR.
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

  private addMetaDataAboutPR = (): void => {
    const { additions, changed_files, commits, deletions } = this.pr;
    message(
      `This PR contains ${commits} commits affecting ${changed_files} files, for a total of ${additions} additions and ${deletions} deletions.`,
    );
  };

  // Rule: "No PR is too small to include in the changelog"
  private checkChangelog = (): void => {
    const { modified_files, created_files } = danger.git;
    const hasChangelog = modified_files.concat(created_files).includes('CHANGELOG.md');
    if (!hasChangelog) {
      warn(`<i>Warning - You may have forgotten to update the CHANGELOG</i>`);
    }
  };

  // performs spellcheck on PR title and description
  private performSpellCheck = (str: string, location: string): void => {
    if (str === null) return;
    const wordRegex = new RegExp(/\w+/, 'gi');
    const words = str.match(wordRegex);

    if (words) {
      words.forEach(word => {
        // early exit if word is on the ignore list.
        if (settings.ignore.includes(word.toLowerCase())) return;

        const { misspelled, suggestions } = dictionary.checkAndSuggest(word, 6, 3);
        if (misspelled) {
          const idea =
            suggestions.length > 0 ? `<br/>Did you maybe mean one of these: <i>${suggestions.join(', ')}</i>?` : '';
          const message = `Potential typo in ${location}: <b>${word}</b>. ${idea}`;

          warn(message);
        }
      });
    }
  };

  private autoMergePullRequest = (): void => {
    const { title } = this.pr;

    // Append PR hash to the end of the title, like how GitHub does it by default.
    const titleWithPRHash = `${title} (#${this.pr.number})`;

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
