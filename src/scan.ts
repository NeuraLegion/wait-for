import axios from 'axios';

export interface Scan {
  status: string;
  numberOfHighSeverityIssues?: number;
  numberOfMediumSeverityIssues?: number;
  numberOfLowSeverityIssues?: number;
  numberOfCriticalSeverityIssues?: number;
}

export const getStatus = async (
  uuid: string,
  options: { baseUrl: string; token: string }
): Promise<Scan | never> => {
  const res = await axios.get<Scan>(`${options.baseUrl}/api/v1/scans/${uuid}`, {
    headers: { authorization: `api-key ${options.token}` }
  });

  const { data } = res;

  return data;
};

export const stopScan = async (
  uuid: string,
  options: { baseUrl: string; token: string }
): Promise<void> => {
  try {
    await axios.get<void>(`${options.baseUrl}/api/v1/scans/${uuid}/stop`, {
      headers: { authorization: `api-key ${options.token}` }
    });
  } catch {
    // noop
  }
};
