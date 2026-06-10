# Security Policy

## Supported versions

The currently released version of Mission Control receives security updates.

| Version | Supported |
| ------- | --------- |
| latest  | yes       |
| < 1.0   | no        |

## Reporting a vulnerability

Please report vulnerabilities privately. Do **not** open a public issue.

- Email: security@mission-control.example (replace before launch)
- Or open a private security advisory:
  https://github.com/mattdani21/mission-control/security/advisories/new

Please include:
1. A description of the vulnerability and its impact.
2. Reproduction steps or proof of concept.
3. Affected versions / commit hashes.
4. Your contact for follow-up (we'll credit you if you'd like).

## Response targets

- Acknowledge within 2 business days.
- Triage and severity decision within 5 business days.
- Patch released within 30 days for High/Critical, 90 days for others.

## Scope

In scope:
- Authentication and authorization
- Tenant isolation (workspaces)
- AI proxy (prompt injection that exfiltrates data, leaking another tenant's prompts)
- Channel integrations (sending on behalf of, spoofing)
- Webhooks (signature bypass)

Out of scope (please don't):
- Denial of service / brute force against production
- Findings that require physical access or social engineering of our staff
- Reports from automated scanners with no proof of exploitability
