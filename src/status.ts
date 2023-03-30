import axios from 'axios';

export interface Status {
  status: string;
  numberOfHighSeverityIssues?: number;
  numberOfMediumSeverityIssues?: number;
  numberOfLowSeverityIssues?: number;
  numberOfCriticalSeverityIssues?: number;
}

export const getStatus = async (
  uuid: string,
  options: { baseUrl: string; token: string }
): Promise<Status | never> => {
  const res = await axios.get<Status>(
    `${options.baseUrl}/api/v1/scans/${uuid}`,
    {
      headers: { authorization: `api-key ${options.token}` }
    }
  );

  const { data } = res;

  return data;
};
