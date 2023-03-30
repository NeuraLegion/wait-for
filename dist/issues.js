"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.satisfyThreshold = exports.getSeverityForCounter = exports.getIssuesCounters = void 0;
const severity_1 = require("./severity");
const counterFromSeverity = (severity) => `numberOf${severity}SeverityIssues`;
const getIssuesCounters = (status, severitiesToFilter = severity_1.severities) => {
    const fields = severitiesToFilter.map(counterFromSeverity);
    const entries = Object.entries(status);
    return Object.fromEntries(entries.filter((entry) => {
        const [key] = entry;
        return fields.includes(key);
    }));
};
exports.getIssuesCounters = getIssuesCounters;
const getSeverityForCounter = (key) => severity_1.severities.find(x => key === counterFromSeverity(x));
exports.getSeverityForCounter = getSeverityForCounter;
const satisfyThreshold = (severity, status) => {
    const issuesCounters = (0, exports.getIssuesCounters)(status, severity_1.ranges.get(severity));
    return Object.entries(issuesCounters).some(([, value = 0]) => value > 0);
};
exports.satisfyThreshold = satisfyThreshold;
