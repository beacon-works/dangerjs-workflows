## GitHub Actions

GitHub Actions makes it easy to automate all your software workflows, now with world-class CI/CD. Build, test, and deploy your code right from GitHub. Make code reviews, branch management, and issue triaging work the way you want.

All actions are stored inside of the `.github/workflows` folder with each workflow in its own `.yml` file. Below are some resources if you want to create or add a new workflow:

- [GitHub Actions Documentation](https://help.github.com/en/actions/automating-your-workflow-with-github-actions)
- [Curated List of GitHub Actions](https://github.com/sdras/awesome-actions)
- [GitHub Marketplace for Actions](https://github.com/marketplace?type=actions)

## DangerJS

DangerJS is currently being used via GitHub Actions to automate various steps during the Pull Request process. These steps are listed below and its implementation can be found in `dangerfile.ts`. [Learn more about DangerJS](https://danger.systems/js/). You can also find the Danger GitHub workflow in `.github/workflows/danger.yml`.

Active Checks:

- `addReviewTeamsBasedOnLabels` - On creation, if a label corresponding to a team in the org is present, Danger will assign that team as a reviewer.
- `checkPRTitle` - Warns on formatting and length issues based on this [article](https://chris.beams.io/posts/git-commit/). Also runs a spellcheck to catch, and provide corrections to, potential typos.
- `checkPRDescription` - Warns if the description is too short or a corresponding clubhouse ticket isn't detected. Also fails if a `commit code block` is not present (unless the PR is tagged for manual merging). The commit code block is used as the commit body when the PR is merged and all commits are squashed.
- `autoMergePullRequest` - Danger will automatically merge a PR once all checks and approvals have been satisfied, and the manual merge tag isn't present.
  - All PRs are squashed.
  - Danger will use the PR title with the PR number appended to it as the commit title.
  - Danger will use the `commit code block` from the PR description as the commit body.
  - Auto-merge fails if Danger doesn't detect a `commit code block` in the PR description.
  - Upon success, Danger will post a comment to the PR indicating so. If it fails, it was post a comment with the error message.

Inactive Steps:

- `addReviewTeamsBasedOnApprovals` - Danger will assign a team(s) as a reviewer once a specific number of approvals have been met. For example, we can have Danger assign the QA team as a reviewer once there are two approvals.
- `checkChangelog` - Danger will post a warning if it doesn't detect a change in the CHANGELOG.

Considerations for Future Steps:

-

## Testing DangerJS Locally via `danger pr`

When working on extending or improving the dangerjs configuration, you can test your changes against an existing PR locally in your cli. To do this, you'll need to create a [personal access token](https://github.com/settings/tokens) in GitHub. Then you can run the following command, replacing _[PERSONAL_ACCESS_TOKEN]_ with your token and the _[PR_NUMBER]_ with the PR number you want to test against.

`DANGER_GITHUB_API_TOKEN=[PERSONAL_ACCESS_TOKEN] danger pr https://github.com/beacon-works/github-actions-sandbox/pull/[PR_NUMBER]`

_Note: If the danger command is not found, you'll need to install the package globally_
