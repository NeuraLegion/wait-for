import { ranges, severities, Severity, SeverityThreshold } from './severity';
import { Status } from './status';

type StatusEntry = [keyof Status, Status[keyof Status]];

export type IssuesCounter = `numberOf${Severity}SeverityIssues`;
export type IssuesCounters = Record<IssuesCounter, number | undefined>;

const counterFromSeverity = (severity: Severity): IssuesCounter =>
  `numberOf${severity}SeverityIssues`;

export const getIssuesCounters = (
  status: Status,
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
  status: Status
): boolean => {
  const issuesCounters = getIssuesCounters(status, ranges.get(severity));

  return Object.entries(issuesCounters).some(
    ([, value = 0]: [string, number | undefined]) => value > 0
  );
};
