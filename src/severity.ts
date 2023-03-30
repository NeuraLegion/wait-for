export enum Severity {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum SeverityThreshold {
  ANY = 'any',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export const severities: readonly Severity[] = [...Object.values(Severity)];

export const ranges: ReadonlyMap<SeverityThreshold, readonly Severity[]> =
  new Map<SeverityThreshold, readonly Severity[]>([
    [SeverityThreshold.ANY, severities],
    [SeverityThreshold.MEDIUM, severities.filter(x => x !== Severity.LOW)],
    [SeverityThreshold.HIGH, [Severity.HIGH, Severity.CRITICAL]],
    [SeverityThreshold.CRITICAL, [Severity.CRITICAL]]
  ]);
