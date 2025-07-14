# Security and Privacy Standards

PeakActivity applies the highest level of measures for user data security and privacy.

## Data Classification
- **Public**: Anonymized summary metrics
- **Internal**: User settings and preferences
- **Confidential**: Raw activity data
- **Restricted**: Authentication tokens

## Security Principles
1. Least Privilege
2. Encryption (TLS for data transfer; AES-256 for storage)
3. Secrets in environment variables
4. Regular security scans (OWASP Top 10)
5. Two-factor authentication (2FA) for all admin accounts

## Privacy Approach
- Privacy-by-design: Local processing by default
- No data sent to the cloud without user consent
- Local edge AI processing for sensitive data
- Data deletion policy: Old data cleaned within 30 days

## Authorization and Authentication
- JWT-based authentication using Firebase Auth
- Role-based access control (RBAC)
- Request validation schema in middleware
