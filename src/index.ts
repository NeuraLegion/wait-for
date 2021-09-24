import * as core from '@actions/core';
import * as rm from 'typed-rest-client/RestClient';
import { asyncPoll, AsyncData } from './async-poller';

type Severity = 'any' | 'medium' | 'high';

const apiToken = core.getInput('api_token');
const scanId = core.getInput('scan');
const hostname = core.getInput('hostname');

const waitFor = core.getInput('wait_for') as Severity;

const interval = 20000;
const timeout = 1000 * Number(core.getInput('timeout'));

const baseUrl = hostname ? `https://$hostname` : 'https://nexploit.app';
const restc: rm.RestClient = new rm.RestClient('GitHub Actions', baseUrl);

interface Status {
  status: string;
  issuesBySeverity: IssuesBySeverity[];
}

interface IssuesBySeverity {
  number: number;
  type: string;
}

function printDescriptionForIssues(issues: IssuesBySeverity[]) {
  core.info('Issues were found:');

  for (const issue of issues) {
    core.info(`${issue.number} ${issue.type} issues`);
  }
}

async function getStatus(token: string, uuid: string): Promise<Status | never> {
  try {
    const options = { additionalHeaders: { Authorization: `Api-Key ${token}` } };
    const restRes: rm.IRestResponse<Status> = await restc.get<Status>(`api/v1/scans/${uuid}`, options);
    return {
      status: restRes.result!.status,
      issuesBySeverity: restRes.result!.issuesBySeverity,
    };
  } catch (err: any) {
    const message = `Failed (${err.statusCode}) ${err.message}`;
    core.setFailed(message);
    throw new Error(message);
  }
}

function run(uuid: string) {
  asyncPoll(
    async (): Promise<AsyncData<any>> => {
      const status = await getStatus(apiToken, uuid);
      const stop = issueFound(waitFor, status.issuesBySeverity);
      const state = status.status;
      const url = `${baseUrl}/scans/${uuid} `;
      const result: AsyncData<any> = {
        done: true,
        data: state,
      };

      if (stop === true) {
        core.setFailed(`Issues were found.See on ${url} `);
        printDescriptionForIssues(status.issuesBySeverity);
        return result;
      } else if (state === 'failed') {
        core.setFailed(`Scan failed.See on ${url} `);
        return result;
      } else if (state === 'stopped') {
        return result;
      } else {
        result.done = false;
        return result;
      }
    },
    interval,
    timeout
  ).catch(e => core.info(e));
}

function issueFound(severity: Severity, issues: IssuesBySeverity[]): boolean {
  let types: string[];

  if (severity === 'any') {
    types = ['Low', 'Medium', 'High'];
  } else if (severity === 'medium') {
    types = ['Medium', 'High'];
  } else {
    types = ['High'];
  }

  for (const issue of issues) {
    if (issue.number > 0 && types.includes(issue.type)) {
      return true;
    }
  }

  return false;
}

run(scanId);
