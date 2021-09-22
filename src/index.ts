import * as core from "@actions/core";
import * as rm from "typed-rest-client/RestClient";
import * as poll from "./async-poller";

type Severity = "any" | "medium" | "high";

const apiToken = core.getInput("api_token");
const scanId = core.getInput("scan");
const hostname = core.getInput("hostname");

const waitFor__ = core.getInput("wait_for");
const waitFor_ = <Severity>waitFor__;

const interval = 20000;
const timeout = 1000 * Number(core.getInput("timeout"));

const baseUrl = hostname ? `https://$hostname` : "https://nexploit.app";
let restc: rm.RestClient = new rm.RestClient("GitHub Actions", baseUrl);

interface Status {
  status: string;
  issuesBySeverity: IssuesBySeverity[];
}

interface IssuesBySeverity {
  number: number;
  type: string;
}

function printDescriptionForIssues(issues: IssuesBySeverity[]) {
  core.info("Issues were found:");

  for (let issue of issues) {
    core.info(`${issue.number} ${issue.type} issues`);
  }
}

async function getStatus(token: string, uuid: string): Promise<Status | never> {
  try {
    let options = { additionalHeaders: { Authorization: `Api-Key ${token}` } };
    let restRes: rm.IRestResponse<Status> = await restc.get<Status>(
      `api/v1/scans/${uuid}`,
      options
    );
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

async function waitFor(uuid: string) {
  poll
    .asyncPoll(
      async (): Promise<poll.AsyncData<any>> => {
        try {
          const status = await getStatus(apiToken, uuid);
          const stop = issueFound(waitFor_, status.issuesBySeverity);
          const state = status.status;
          const url = `${baseUrl} /scans/${uuid} `;

          if (stop == true) {
            core.setFailed(`Issues were found.See on ${url} `);
            printDescriptionForIssues(status.issuesBySeverity);
            return Promise.resolve({
              done: true,
            });
          } else if (state == "failed") {
            core.setFailed(`Scan failed.See on ${url} `);
            return Promise.resolve({
              done: true,
            });
          } else if (state == "stopped") {
            return Promise.resolve({
              done: true,
            });
          } else {
            return Promise.resolve({
              done: false,
            });
          }
        } catch (err) {
          return Promise.reject(err);
        }
      },
      interval,
      timeout
    )
    .catch(function (e) {
      core.info(e);
    });
}

function issueFound(severity: Severity, issues: IssuesBySeverity[]): boolean {
  var types: string[];

  if (severity == "any") {
    types = ["Low", "Medium", "High"];
  } else if (severity == "medium") {
    types = ["Medium", "High"];
  } else {
    types = ["High"];
  }

  for (let issue of issues) {
    if (issue.number > 0 && types.includes(issue.type)) {
      return true;
    }
  }

  return false;
}

waitFor(scanId).catch(err => console.log(err));
