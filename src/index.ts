import { AsyncData, asyncPoll } from './async-poller';
import * as core from '@actions/core';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { pathToFileURL } from 'url';

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
const waitFor = core
  .getInput('wait_for', { trimWhitespace: true })
  .toLowerCase() as Severity;

const interval = 20000;
const timeout = 1000 * Number(core.getInput('timeout'));

const baseUrl = (
  hostname ? `https://${hostname}` : 'https://app.neuralegion.com'
).replace(/\/$/, '');

axiosRetry(axios, { retries: 3 });

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
        await displayResults({ issues: issuesBySeverity, url });

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
    const res = await axios.get<Status>(`${baseUrl}/api/v1/scans/${uuid}`, {
      headers: { authorization: `api-key ${apiToken}` }
    });

    const { data } = res;

    return {
      status: data ? data.status : '',
      issuesBySeverity: data ? data.issuesBySeverity : []
    };
  } catch (err: any) {
    core.debug(err);
    const message = `Failed to retrieve the actual status.`;
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

const displayResults = async ({
  issues,
  url
}: {
  issues: IssuesBySeverity[];
  url: string;
}) => {
  core.setFailed(`Issues were found. See on ${url} `);

  printDescriptionForIssues(issues);

  const options = getSarifOptions();

  try {
    if (options?.codeScanningAlerts && options?.token) {
      await uploadSarif({ ...options, scanId });
    }
  } catch (e: any) {
    core.debug(e);
    core.error('Cannot upload SARIF report.');
  }
};

const uploadSarif = async (params: {
  codeScanningAlerts: boolean;
  ref: string;
  scanId: string;
  commitSha: string;
  token: string;
}) => {
  const res = await axios.get<string>(
    `${baseUrl}/api/v1/scans/${params.scanId}/reports/sarif`,
    {
      responseType: 'arraybuffer',
      headers: { authorization: `api-key ${apiToken}` }
    }
  );

  if (!res.data) {
    throw new Error(
      'Cannot upload a report to GitHub. SARIF report are empty.'
    );
  }

  const sarif = Buffer.from(res.data).toString('base64');

  const githubRepository = process.env['GITHUB_REPOSITORY'];

  if (githubRepository == null) {
    throw new Error(`GITHUB_REPOSITORY environment variable must be set`);
  }

  const [owner, repo]: string[] = githubRepository.split('/');

  core.info('Uploading SARIF results to GitHub.');

  await axios.post(
    `https://api.github.com/repos/${owner}/${repo}/code-scanning/sarifs`,
    {
      sarif,
      ref: params.ref,
      commit_sha: params.commitSha,
      tool_name: 'NeuraLegion’s DAST',
      checkout_uri: pathToFileURL(process.cwd()).toString()
    },
    {
      headers: {
        Authorization: `token ${params.token}`
      }
    }
  );
  core.info('SARIF upload complete.');
};

const getSarifOptions: () => {
  codeScanningAlerts: boolean;
  ref: string;
  commitSha: string;
  token: string;
} = () => {
  const codeScanningAlerts = core.getBooleanInput('code_scanning_alerts');
  const ref = core.getInput('ref') ?? process.env.GITHUB_REF;
  const commitSha = core.getInput('commit_sha') ?? process.env.GITHUB_SHA;
  const token = core.getInput('github_token') ?? process.env.GITHUB_TOKEN;

  return {
    token,
    codeScanningAlerts,
    ref,
    commitSha
  };
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run(scanId);
