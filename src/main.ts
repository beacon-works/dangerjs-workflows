/* eslint-disable */
import * as core from '@actions/core';
import * as github from '@actions/github';
import danger from 'danger';
import { DangerChecks } from './dangerfile';

try {
  // `who-to-greet` input defined in action metadata file
  const nameToGreet = core.getInput('who-to-greet');
  const manualMergeTag = core.getInput('manual-merge-label');

  console.log(`Hello ${nameToGreet}! ---- ${manualMergeTag}`, danger);
  const time = new Date().toTimeString();
  core.setOutput('time', time);
  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2);
  console.log(`The event payload: ${payload}`);

  new DangerChecks({ manualMergeTag }).run();
} catch (error) {
  core.setFailed(error.message);
}
