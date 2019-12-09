"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable */
const shelljs_1 = require("shelljs");
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
try {
    // `who-to-greet` input defined in action metadata file
    const nameToGreet = core.getInput('who-to-greet');
    const manualMergeTag = core.getInput('manual-merge-label');
    const path = '/usr/src/danger';
    shelljs_1.mkdir(path);
    shelljs_1.cd(path);
    shelljs_1.exec('git clone https://github.com/danger/danger-js.git .');
    shelljs_1.exec('yarn && yarn run build:fast');
    shelljs_1.chmod('+x', 'distribution/commands/danger.js');
    shelljs_1.ln('-s', '$(pwd)/distribution/commands/danger.js', path);
    console.log(`Hello ${nameToGreet}! ---- ${manualMergeTag}`);
    const time = new Date().toTimeString();
    core.setOutput('time', time);
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2);
    console.log(`The event payload: ${payload}`);
    // new DangerChecks({ manualMergeTag }).run();
}
catch (error) {
    core.setFailed(error.message);
}
