# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

1. **DO NOT** open a public issue
2. Email security@echo.ai with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

3. We will respond within 48 hours
4. We will provide a timeline for the fix
5. Once fixed, we will credit you (if desired)

## Security Measures

### Authentication & Authorization

- Clerk for authentication with multi-factor support
- Role-based access control (RBAC)
- Organization-level isolation
- JWT validation on all requests

### Data Protection

- Encryption at rest (AWS KMS)
- Encryption in transit (TLS 1.3)
- PII redaction in logs
- Data retention policies

### API Security

- Rate limiting per tenant
- CORS restrictions
- CSP headers
- Input validation with Zod

### Infrastructure

- VPC isolation
- Private subnets for databases
- Security groups with least privilege
- AWS Secrets Manager for credentials
- Regular security updates

### Monitoring

- Sentry for error tracking
- Audit logs for all actions
- Anomaly detection
- Real-time alerts

### Compliance

- GDPR compliant
- Data export/deletion APIs
- Audit trail
- Privacy policy enforcement

## Known Security Considerations

### Secrets Management

All API keys must be stored in AWS Secrets Manager, never in code or environment files committed to git.

### Multi-tenancy

Data isolation is critical. All Convex queries include tenant ID filtering. Never expose cross-tenant data.

### Widget Security

The widget runs in a shadow DOM to prevent CSS injection. CSP headers prevent XSS attacks.

### Voice Security

Vapi webhooks must verify signature. Call recordings are encrypted and have TTL.

## Security Updates

We monitor dependencies for vulnerabilities using:

- GitHub Dependabot
- npm audit
- Snyk

Updates are applied within 7 days for critical vulnerabilities.

## Bug Bounty

We currently do not have a formal bug bounty program, but we recognize and credit security researchers who responsibly disclose vulnerabilities.

## Contact

- Security issues: security@echo.ai
- General questions: support@echo.ai
