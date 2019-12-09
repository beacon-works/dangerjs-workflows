/* eslint-disable */
import shell from 'shelljs';
import core from '@actions/core';
import github from '@actions/github';
import { DangerChecks } from './dangerfile';

async function run() {
  try {
    // `who-to-greet` input defined in action metadata file
    const nameToGreet = core.getInput('who-to-greet');
    const manualMergeTag = core.getInput('manual-merge-label');

    const path = '/usr/src/danger';
    shell.mkdir(path);
    shell.cd(path);
    shell.exec('git clone https://github.com/danger/danger-js.git .');

    console.log(`Hello ${nameToGreet}! ---- ${manualMergeTag}`);
    const time = new Date().toTimeString();
    core.setOutput('time', time);
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2);
    console.log(`The event payload: ${payload}`);

    // new DangerChecks({ manualMergeTag }).run();
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
