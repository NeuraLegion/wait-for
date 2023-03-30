"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ranges = exports.severities = exports.SeverityThreshold = exports.Severity = void 0;
var Severity;
(function (Severity) {
    Severity["LOW"] = "Low";
    Severity["MEDIUM"] = "Medium";
    Severity["HIGH"] = "High";
    Severity["CRITICAL"] = "Critical";
})(Severity = exports.Severity || (exports.Severity = {}));
var SeverityThreshold;
(function (SeverityThreshold) {
    SeverityThreshold["ANY"] = "any";
    SeverityThreshold["MEDIUM"] = "medium";
    SeverityThreshold["HIGH"] = "high";
    SeverityThreshold["CRITICAL"] = "critical";
})(SeverityThreshold = exports.SeverityThreshold || (exports.SeverityThreshold = {}));
exports.severities = [...Object.values(Severity)];
exports.ranges = new Map([
    [SeverityThreshold.ANY, exports.severities],
    [SeverityThreshold.MEDIUM, exports.severities.filter(x => x !== Severity.LOW)],
    [SeverityThreshold.HIGH, [Severity.HIGH, Severity.CRITICAL]],
    [SeverityThreshold.CRITICAL, [Severity.CRITICAL]]
]);
