"use strict";
var fs = require("fs");
var path = require("path");
function findProjectDir() {
    var candidateDir = path.join(__dirname, "..");
    while (true) {
        var oldCandidateDir = candidateDir;
        candidateDir = path.dirname(candidateDir);
        if (path.basename(candidateDir) === 'node_modules') {
            continue;
        }
        var packageJsonFile = path.join(candidateDir, 'package.json');
        if (fs.existsSync(packageJsonFile)) {
            return candidateDir;
        }
        if (oldCandidateDir === candidateDir) {
            return;
        }
    }
}
exports.findProjectDir = findProjectDir;
function getHooksDir() {
    return path.join(findProjectDir(), 'hooks');
}
exports.getHooksDir = getHooksDir;
function getAfterPrepareHookDir() {
    return path.join(getHooksDir(), "after-prepare");
}
exports.getAfterPrepareHookDir = getAfterPrepareHookDir;
function getHookFilePath() {
    return path.join(getAfterPrepareHookDir(), "nativescript-unit-test-runner.js");
}
exports.getHookFilePath = getHookFilePath;
