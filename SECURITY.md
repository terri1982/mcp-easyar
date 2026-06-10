# Security Policy

This MCP server is designed for official, authorized EasyAR workflows.

## Supported Use

- Use EasyAR account tokens, license keys, SDK downloads, and cloud service credentials only as permitted by EasyAR.
- Do not use this server to bypass login, license checks, enterprise download gates, rate limits, or access controls.
- Do not commit `EASYAR_API_TOKEN`, EasyAR license keys, cloud recognition credentials, Unity signing keys, or mobile provisioning secrets.

## Reporting Vulnerabilities

Please report vulnerabilities through GitHub private vulnerability reporting when the repository is published, or contact the repository owner privately.

Include:

- affected version or commit
- reproduction steps
- expected and actual behavior
- whether credentials, license data, or project source may be exposed

## Local Filesystem Scope

Tools that write files are constrained to the requested Unity project path. Keep MCP client permissions scoped to trusted local projects.
