"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable */
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const dangerfile_1 = require("./dangerfile");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // `who-to-greet` input defined in action metadata file
            const nameToGreet = core.getInput('who-to-greet');
            const manualMergeTag = core.getInput('manual-merge-label');
            console.log(`Hello ${nameToGreet}! ---- ${manualMergeTag}`);
            const time = new Date().toTimeString();
            core.setOutput('time', time);
            // Get the JSON webhook payload for the event that triggered the workflow
            const payload = JSON.stringify(github.context.payload, undefined, 2);
            console.log(`The event payload: ${payload}`);
            new dangerfile_1.DangerChecks({ manualMergeTag }).run();
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
