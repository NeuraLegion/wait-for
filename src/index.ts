import * as core from "@actions/core";
import * as rm from "typed-rest-client/RestClient";
import * as poll from "./async-poller";

type Severity = "any" | "medium" | "high";

const apiToken = core.getInput("api_token");
const scanId = core.getInput("scan");
const hostname = core.getInput("hostname");

const waitFor__ = core.getInput("wait_for");
const waitFor_ = <Severity>waitFor__;
const interval = 10000;
const timeout = 60 * 60 * 1000;

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

async function getStatus(token: string, uuid: string): Promise<Status> {
  try {
    let options = { additionalHeaders: { Authorization: `Api-Key ${token}` } };
    let restRes: rm.IRestResponse<Status> = await restc.get<Status>(
      `api/v1/scans/${uuid}`,
      options
    );
    const status: Status = {
      status: restRes.result!.status,
      issuesBySeverity: restRes.result!.issuesBySeverity,
    };

    switch (restRes.statusCode) {
      case 200: {
        return Promise.resolve(status);
      }
      case 401: {
        core.setFailed("Failed to log in with provided credentials");
        break;
      }
      case 403: {
        core.setFailed(
          "The account doesn't have any permissions for a resource"
        );
        break;
      }
    }
  } catch (err) {
    console.debug("Timeout reached");
  }

  return Promise.reject();
}

waitFor(scanId);

async function waitFor(uuid: string) {
  console.log("Scan was created " + uuid);

  poll
    .asyncPoll(
      async (): Promise<poll.AsyncData<any>> => {
        try {
          const status = await getStatus(apiToken, uuid);
          const stop = issueFound(waitFor_, status.issuesBySeverity);
          const state = status.status;
          const url = `https://nexploit.app/scans/${uuid}`;

          if (stop == true) {
            core.setFailed(`Issues were found. See on ${url}`);
            return Promise.resolve({
              done: true,
            });
          } else if (state == "failed") {
            core.setFailed(`Scan failed. See on ${url}`);
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
      core.info("===== Timeout ====");
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
