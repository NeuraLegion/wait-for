import { ranges, severities, Severity, SeverityThreshold } from './severity';
import { Scan } from './scan';

type StatusEntry = [keyof Scan, Scan[keyof Scan]];

export type IssuesCounter = `numberOf${Severity}SeverityIssues`;
export type IssuesCounters = Record<IssuesCounter, number | undefined>;

const counterFromSeverity = (severity: Severity): IssuesCounter =>
  `numberOf${severity}SeverityIssues`;

export const getIssuesCounters = (
  status: Scan,
  severitiesToFilter: readonly Severity[] = severities
): IssuesCounters => {
  const fields = severitiesToFilter.map<string>(counterFromSeverity);
  const entries = Object.entries(status) as StatusEntry[];

  return Object.fromEntries(
    entries.filter((entry): entry is [IssuesCounter, number | undefined] => {
      const [key]: StatusEntry = entry;

      return fields.includes(key);
    })
  ) as IssuesCounters;
};

export const getSeverityForCounter = (
  key: IssuesCounter
): Severity | undefined => severities.find(x => key === counterFromSeverity(x));

export const satisfyThreshold = (
  severity: SeverityThreshold,
  status: Scan
): boolean => {
  const issuesCounters = getIssuesCounters(status, ranges.get(severity));

  return Object.entries(issuesCounters).some(
    ([, value = 0]: [string, number | undefined]) => value > 0
  );
};
