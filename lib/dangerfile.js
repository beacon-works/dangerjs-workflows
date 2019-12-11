"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/camelcase */
const danger_1 = require("danger");
// this plugin spell checks the code changes in the PR.
const danger_plugin_spellcheck_1 = __importDefault(require("danger-plugin-spellcheck"));
// this spell check is used to analyze the PR title and description
const SimpleSpellChecker = __importStar(require("simple-spellchecker"));
const dictionary = SimpleSpellChecker.getDictionarySync('en-US');
class DangerChecks {
    constructor(opts) {
        // GitHub API: https://octokit.github.io/rest.js
        this.run = () => {
            if (this.pr.state === 'open') {
                // -- do stuff the first time a PR is created.
                if (this.pr.created_at === this.pr.updated_at) {
                    this.addReviewTeamsBasedOnLabels(['api', 'ui']);
                }
                danger_plugin_spellcheck_1.default({
                    codeSpellCheck: ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js'],
                    ignore: ['camelcase', 'dangerfile', 'dangerjs', 'github', 'mergeable', 'prdsl', 'rebaseable', 'workflow'],
                    whitelistFiles: ['README.md', 'dangerfile.ts', '.github/pull_request_template.md'],
                });
                this.checkPRTitle();
                this.checkPRDescription();
                // this.checkChangelog();
                this.addReviewTeamsBasedOnApprovals(['qa'], 2);
                this.addMetaDataAboutPR();
                this.autoMergePullRequest(this.opts.manualMergeTag);
            }
        };
        // Rule: "PR with specified labels matching teams should assign those teams for reviewers"
        this.addReviewTeamsBasedOnLabels = (labels) => {
            const requiredTeams = this.prLabels.filter(label => labels.includes(label));
            // TODO: add a check to verify a label does have a matching team before adding it to the api call.
            if (requiredTeams.length > 0) {
                danger_1.danger.github.api.pulls.createReviewRequest(Object.assign(Object.assign({}, this.prPull), { reviewers: [], team_reviewers: requiredTeams }));
            }
        };
        // Rule: "No PR is too small to include a title highlighting the changes you made"
        // https://chris.beams.io/posts/git-commit/
        this.checkPRTitle = () => {
            const { title } = this.pr;
            const startsWithLowerCase = new RegExp(/^[a-z]{1}/);
            const endsWithSpecialChar = new RegExp(/([./,;:'"])+$/);
            // console.log(this.pr);
            if (title.length < 5) {
                danger_1.warn('<i>Your PR title seems a bit short. Please provide a bit more context.</i>');
            }
            if (title.length > 50) {
                danger_1.warn("<i>Your PR title is a bit long. Let's keep it under 50 characters.</i>");
            }
            if (startsWithLowerCase.test(title)) {
                danger_1.warn("<i>Let's keep PR titles capitalized for consistency.</i>");
            }
            if (endsWithSpecialChar.test(title)) {
                danger_1.warn("<i>Let's keep PR titles free of periods or special characters at the end.</i>");
            }
            this.performSpellCheck(title, 'PR title');
        };
        // Rule: "No PR is too small to include a description of why you made a change"
        this.checkPRDescription = () => {
            const { manualMergeTag } = this.opts;
            const { body } = this.pr;
            const clubhouseTicketRegex = new RegExp(/(\/\/.*app\.clubhouse\.io\/beacon-works[\w/-]*)/);
            if (body.length < 10) {
                danger_1.warn('<i>Your PR description seems a bit short. Here are some things to consider: describe your changes, include helpful steps for reviewers, link to Clubhouse ticket, and add a commit code block at the end (if auto-merging).</i>');
            }
            if (!clubhouseTicketRegex.test(body)) {
                danger_1.warn("<i>Is this PR related to a Clubhouse ticket? If so, don't forget to include a reference to it.</i>");
            }
            if (this.prLabels.includes(manualMergeTag || ''))
                return;
            // console.log(body);
            // matches every code block in the description that starts with ```commit
            const codeBlockRegex = new RegExp(/(`{3}commit)[\r\n]([a-z]*[\s\S]*?)[\r\n](`{3})$/, 'gm');
            const codeBlocks = body.match(codeBlockRegex) || [];
            if (codeBlocks) {
                const backTicksWithCommitBlock = new RegExp(/(`{3}commit)(\r\n)/, 'g');
                const backTicks = new RegExp(/(`{3})/, 'g');
                const lastCodeBlock = codeBlocks[codeBlocks.length - 1];
                const strippedCodeBlock = lastCodeBlock
                    .trim()
                    .replace(backTicksWithCommitBlock, '')
                    .replace(backTicks, '');
                if (strippedCodeBlock) {
                    this.performSpellCheck(strippedCodeBlock, 'PR description');
                }
                this.mergeCommitBlock = strippedCodeBlock || null;
            }
            else {
                danger_1.fail('It looks like you forgot to include a commit code block at the end of your PR description. Simply create a code block that starts with <i>```commit</i> containing your commit body. I use this as your commit body once your PR is ready to be merged.');
            }
        };
        // Rule: "PR with [noOfApprovals] approvals should then be assigned to [teams]"
        this.addReviewTeamsBasedOnApprovals = (teams, noOfApprovals) => {
            const { listReviews, createReviewRequest } = danger_1.danger.github.api.pulls;
            const { requested_teams } = this.pr;
            // Return if the team has already been requested
            if (requested_teams && requested_teams.some(team => teams.includes[team.slug]))
                return;
            listReviews(this.prPull).then(resp => {
                const { data } = resp;
                if (data && data.length > 0) {
                    const currentApprovals = data.filter(review => review.state === 'APPROVED').length;
                    // console.log(currentApprovals);
                    if (currentApprovals >= noOfApprovals) {
                        createReviewRequest(Object.assign(Object.assign({}, this.prPull), { reviewers: [], team_reviewers: teams }));
                    }
                }
            });
        };
        // Rule: "PR is merged automatically when all checks and approvals are met, unless it has the manual merge tag/label"
        this.autoMergePullRequest = (manualMergeTag) => {
            const { locked, merged, mergeable, mergeable_state, rebaseable, requested_reviewers, requested_teams, title, } = this.pr;
            if (manualMergeTag && this.prLabels.includes(manualMergeTag))
                return;
            if (this.prLabels.includes('wip'))
                return;
            // Return if there are still outstanding reviews requested
            if (requested_reviewers && requested_reviewers.length >= 1)
                return;
            // console.log(this.pr);
            if (!locked && !merged && mergeable && mergeable_state !== 'blocked' && rebaseable) {
                // TODO: Ensure there is a commit code block we can use for the commit.
                if (!this.mergeCommitBlock) {
                    danger_1.fail("Oops! It looks like you're missing a commit block in the description of your PR. Simply create a code block at the bottom of your description with your commit message. I use this when I auto-merge your PR.");
                    return;
                }
                // Append PR hash to the end of the title
                const titleWithPRHash = `${title} (#${this.pr.number})`;
                danger_1.danger.github.api.pulls
                    .merge(Object.assign(Object.assign({}, this.prPull), { commit_title: titleWithPRHash, commit_message: this.mergeCommitBlock, merge_method: 'squash' }))
                    .then(resp => {
                    danger_1.danger.github.api.issues.createComment(Object.assign(Object.assign({}, this.prIssue), { body: resp.data.message }));
                })
                    .catch(err => danger_1.danger.github.api.issues.createComment(Object.assign(Object.assign({}, this.prIssue), { body: err })));
            }
        };
        this.addMetaDataAboutPR = () => {
            const { additions, changed_files, commits, deletions } = this.pr;
            danger_1.message(`This PR contains ${commits} commits affecting ${changed_files} files, for a total of ${additions} additions and ${deletions} deletions.`);
        };
        // Rule: "No PR is too small to include in the changelog"
        this.checkChangelog = () => {
            const { modified_files, created_files } = danger_1.danger.git;
            const hasChangelog = modified_files.concat(created_files).includes('CHANGELOG.md');
            if (!hasChangelog) {
                danger_1.warn(`<i>Warning - You may have forgotten to update the CHANGELOG</i>`);
            }
        };
        this.performSpellCheck = (str, location) => {
            if (!str || str === ' ')
                return;
            return str.split(' ').forEach(word => {
                const { misspelled, suggestions } = dictionary.checkAndSuggest(word, 6, 3);
                if (misspelled) {
                    danger_1.warn(`Potential typo in ${location}: <b>${word}</b>.<br/> Did you maybe mean one of these: <i>${suggestions.join(', ')}</i>?`);
                }
            });
        };
        // tslint:disable-next-line
        const { repo, owner, number } = danger_1.danger.github.thisPR;
        this.opts = opts;
        this.pr = danger_1.danger.github.pr;
        this.prPull = { repo, owner, pull_number: number };
        this.prIssue = { repo, owner, issue_number: number };
        this.prLabels = this.pr.labels ? this.pr.labels.map(label => label.name.toLowerCase()) : [];
        this.mergeCommitBlock = null;
    }
}
exports.DangerChecks = DangerChecks;
new DangerChecks({ manualMergeTag: 'manual merge' }).run();
