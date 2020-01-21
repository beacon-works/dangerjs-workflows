import { DangerCheck } from './DangerCheck';

new DangerCheck({
  checkType: 'pr-checks',
  manualMergeTag: 'manual merge',
  noQaTag: 'no-qa',
  workInProgressTag: 'wip',
}).run();
