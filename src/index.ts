import { asyncPoll, AsyncData } from './async-poller';
import * as core from '@actions/core';
import { RestClient } from 'typed-rest-client/RestClient';

type Severity = 'any' | 'medium' | 'high';

interface Status {
  status: string;
  issuesBySeverity: IssuesBySeverity[];
}

interface IssuesBySeverity {
  number: number;
  type: string;
}

const apiToken = core.getInput('api_token');
const scanId = core.getInput('scan');
const hostname = core.getInput('hostname');
const waitFor = core.getInput('wait_for') as Severity;

const interval = 20000;
const timeout = 1000 * Number(core.getInput('timeout'));

const baseUrl = hostname ? `https://${hostname}` : 'https://nexploit.app';
const restc = new RestClient('GitHub Actions', baseUrl);
const options = { additionalHeaders: { Authorization: `Api-Key ${apiToken}` } };

const run = (uuid: string) =>
  asyncPoll(
    async (): Promise<AsyncData<any>> => {
      const status = await getStatus(uuid);
      const { issuesBySeverity, status: data } = status;

      const stop = issueFound(waitFor, issuesBySeverity);

      const url = `${baseUrl}/scans/${uuid} `;
      const result: AsyncData<any> = {
        data,
        done: true
      };

      if (stop) {
        core.setFailed(`Issues were found. See on ${url} `);
        printDescriptionForIssues(issuesBySeverity);

        return result;
      }

      switch (data) {
        case 'failed':
          core.setFailed(`Scan failed. See on ${url} `);

          return result;
        case 'stopped':
          return result;
        default:
          result.done = false;

          return result;
      }
    },
    interval,
    timeout
  ).catch(e => core.info(e));

const getStatus = async (uuid: string): Promise<Status | never> => {
  try {
    const restRes = await restc.get<Status>(`api/v1/scans/${uuid}`, options);

    return {
      status: restRes.result ? restRes.result.status : '',
      issuesBySeverity: restRes.result ? restRes.result.issuesBySeverity : []
    };
  } catch (err: any) {
    const message = `Failed (${err.statusCode}) ${err.message}`;
    core.setFailed(message);
    throw new Error(message);
  }
};

const issueFound = (
  severity: Severity,
  issues: IssuesBySeverity[]
): boolean => {
  let types: string[];

  if (severity === 'any') {
    types = ['Low', 'Medium', 'High'];
  } else if (severity === 'medium') {
    types = ['Medium', 'High'];
  } else {
    types = ['High'];
  }

  return issues.some(issue => issue.number > 0 && types.includes(issue.type));
};

const printDescriptionForIssues = (issues: IssuesBySeverity[]) => {
  core.info('Issues were found:');

  for (const issue of issues) {
    core.info(`${issue.number} ${issue.type} issues`);
  }
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run(scanId);
