import { DangerCheck } from './DangerCheck';

// the tags passed here should match the corresponding tags in your repository
// TODO: allow users to enter these values through their github actions workflow as arguments?
new DangerCheck({
  checkType: 'automerge',
  manualMergeTag: 'manual merge',
  noQaTag: 'no-qa',
  workInProgressTag: 'wip',
}).run();
