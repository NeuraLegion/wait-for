import { AsyncData, asyncPoll } from './async-poller';
import { SeverityThreshold } from './severity';
import { Status, getStatus } from './status';
import {
  getIssuesCounters,
  getSeverityForCounter,
  satisfyThreshold,
  IssuesCounter
} from './issues';
import * as core from '@actions/core';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { pathToFileURL } from 'url';

const apiToken = core.getInput('api_token');
const scanId = core.getInput('scan');
const hostname = core.getInput('hostname');
const threshold = core
  .getInput('wait_for', { trimWhitespace: true })
  .toLowerCase() as SeverityThreshold;

const interval = 20000;
const timeout = 1000 * Number(core.getInput('timeout'));

const baseUrl = (
  hostname ? `https://${hostname}` : 'https://app.neuralegion.com'
).replace(/\/$/, '');

axiosRetry(axios, { retries: 3 });

const getScanStatus = async (uuid: string): Promise<Status | never> => {
  try {
    return await getStatus(uuid, {
      baseUrl,
      token: apiToken
    });
  } catch (err: any) {
    core.debug(err);
    const message = `Failed to retrieve the actual status.`;
    core.setFailed(message);
    throw new Error(message);
  }
};

const printDescriptionForIssues = (status: Status) => {
  const issuesCounters = getIssuesCounters(status);

  core.info('Issues were found:');

  Object.entries(issuesCounters).forEach(
    ([key, value]: [string, number | undefined]) => {
      const severity = getSeverityForCounter(key as IssuesCounter);
      core.info(`${value} ${severity} issues`);
    }
  );
};

const displayResults = async ({
  state,
  url
}: {
  state: Status;
  url: string;
}) => {
  core.setFailed(`Issues were found. See on ${url} `);

  printDescriptionForIssues(state);

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

  if (!githubRepository) {
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

asyncPoll(
  async (): Promise<AsyncData<any>> => {
    const state = await getScanStatus(scanId);

    const satisfied = satisfyThreshold(threshold, state);

    const url = `${baseUrl}/scans/${scanId} `;
    const result: AsyncData<string> = {
      done: true,
      data: state.status
    };

    if (satisfied) {
      await displayResults({ state, url });

      return result;
    }

    switch (state.status) {
      case 'failed':
      case 'disrupted':
        core.setFailed(`Scan ${state.status}. See on ${url} `);

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
).catch((e: any) => {
  core.debug(e);
  core.setFailed(e);
});
