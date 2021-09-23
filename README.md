# Poll Results of a Nexploit Scan

This action polls a Nexploit scan until it returns a detected issue, or its time runs out. 

## About NeuraLegion's Nexploit 

NeuraLegion’s NexPloit is a Dynamic Application Security Testing (DAST) solution powered by Artificial Intelligence (AI) and modern scanning technologies. With its effective automation and integration capabilities, Nexploit allows developers to scan multiple targets, uncover security vulnerabilities without false positives, get detailed reports on every finding,  and quickly fix security issues by following the remediation guidelines. 

Nexploit is built to solve the core security tasks of your applications and APIs:
* 👾 Finding Vulnerabilities (Issues) – As well as finding OWASP Top 10  technical issues (and much more) in your applications, NexPloit’s AI Engine automatically detects unknown Zero-Day and Business-Logic Flow issues, reducing lengthy and costly manual testing, as well as providing False Positive Free reporting and remediation guidelines. 
* 🚀 Security Testing Automation – Nexploit enables seamless integration into your Software Development Life Cycle (SDLC). As the only solution that has automated Zero-Day detection, our False Positive Free reports are generated in real-time, with pinpoint code instrumentation, empowering your DevOps to the highest security standards, without losing development speed or agility. 
* 🔐 Security Standard Compliance – Nexploit provides you with a comprehensive scanning flow which simplifies your compliance validation process and provides instant reports on identified issues that accelerate your confirmation process. Nexploit enables you to firmly comply with the standards of OWASP Top 10 technical issues, ISO/IEC 27001, PCI DSS, CWE/SANS, and more.

More information is available on NeuraLegion’s:
* [Website](https://www.neuralegion.com/)
* [Knowledge base](https://kb.neuralegion.com/#/guide/np-web-ui/scanning)
* [YouTube channel](https://www.youtube.com/channel/UCoIC0T1pmozq3eKLsUR2uUw)
* [GitHub Actions](https://github.com/marketplace?query=neuralegion+)

## Inputs

### `api_token`

**Required**. Your Nexploit API authorization token (key). You can generate it in the **Organization** section on [nexploit.app](https://nexploit.app/login). Find more information [here](https://kb.neuralegion.com/#/guide/np-web-ui/advanced-set-up/managing-org?id=managing-organization-apicli-authentication-tokens).

_Example:_ `--token ${{ secrets.NEXPLOIT_TOKEN }})`

### `scan`

**Required**. ID of an existing scan to be restarted. You can get the scan ID in the Scans section on [nexploit.app](https://nexploit.app/login).

_Example:_ `--restart_scan: ai3LG8DmVn9Rn1YeqCNRGQ`

### `wait_for`

**Required**. Set the severity of the first issue to wait for: *any*, *medium*, *high*.

_Example:_ `wait_for: any`

### `timeout`

**Required**. Time for polling in seconds.

_Example:_  ` timeout: 55`

## Outputs

### `url`

URL of the resulting scan.

## Usage Example

### Poll the results of a previously started scan

```yml
start_and_wait_scan:
  runs-on: ubuntu-latest
  name: A job to run a Nexploit scan
  steps:
  - name: Start Nexploit Scan 🏁
    id: start
    uses: NeuraLegion/run-scan@master
    with:
      api_token: ${{ secrets.NEXPLOIT_TOKEN }}
      name: GitHub scan ${{ github.sha }}
      discovery_types: |
        [ "crawler", "archive" ]
      crawler_urls: |
        [ "https://juice-shop.herokuapp.com" ]
      file_id: LiYknMYSdbSZbqgMaC9Sj
      hosts_filter: |
        [ ]
      wait_for: on_high
  - name: Get the output scan url
    run: echo "The scan was started on ${{ steps.start.outputs.url }}"
  - name: Wait for any issues ⏳
    id: wait
    uses: NeuraLegion/wait-for@master
    with:
      api_token: ${{ secrets.NEXPLOIT_TOKEN }}
      scan: ${{ steps.start.outputs.id }}
      wait_for: any
      timeout: 55
```
