# ADR-002: PeakActivity Encryption Architecture

**Status:** Proposed  
**Date:** 2024-12-28  
**Authors:** Development Team  
**Supersedes:** None  

## Context

PeakActivity v0.4.0 requires comprehensive encryption and security implementation to protect user data both locally and in the cloud. Current implementation has security gaps including hardcoded encryption keys, unencrypted external service credentials, and lack of user key management.

## Decision

We will implement a multi-layered encryption architecture with the following components:

### 1. Key Management Architecture
- **Master Password System:** User-provided master password using Argon2id key derivation
- **User-Specific Keys:** Per-user encryption keys derived from master password
- **Key Storage:** OS keychain integration (Windows Credential Store, macOS Keychain, Linux Secret Service)
- **Key Rotation:** Automatic quarterly key rotation with migration

### 2. Data Classification System
Three distinct data transmission types:

**Raw Data (Level 1):**
- Unencrypted data transmission
- Enhanced AI capabilities and analytics
- Explicit user consent required
- Used for application improvement

**Encrypted + AI Enabled (Level 2):**
- Client-side encryption with local AI processing
- Edge computing for AI features
- Malicious code protection
- Strict API rate limiting

**Encrypted + AI Disabled (Level 3):**
- Maximum privacy level
- Storage-only purpose
- Zero-knowledge architecture
- No server-side processing

### 3. Encryption Standards
- **Algorithm:** AES-256-GCM (primary), ChaCha20-Poly1305 (fallback)
- **Key Derivation:** Argon2id (3 passes, 64MB memory minimum)
- **Random Generation:** Cryptographically secure randomness for all IVs/nonces
- **Hash Function:** SHA-256 for integrity, bcrypt for passwords

### 4. Platform-Specific Implementation

**Web Client:**
- Web Crypto API for native encryption
- CryptoJS fallback for older browsers
- IndexedDB for encrypted local storage
- Web Workers for performance-intensive encryption

**Desktop (Tauri/Rust):**
- Native Rust encryption libraries
- SQLCipher for database encryption
- System keychain integration
- Memory protection and zeroization

**Cloud (Firebase Functions):**
- Server-side encryption for stored data
- Encrypted external service credentials
- Google Secret Manager for service keys
- End-to-end encryption validation

### 5. Recovery Mechanisms
- **Security Questions:** Minimum 3 questions, bcrypt hashed
- **2FA Backup Codes:** One-time use codes, encrypted storage
- **Email Recovery:** Secure token-based recovery
- **WebAuthn/FIDO2:** Biometric authentication support

## Consequences

### Positive
- **Enhanced Security:** Industry-standard encryption across all platforms
- **User Control:** Users maintain full control over their encryption keys
- **Compliance:** GDPR, CCPA, and other privacy regulation compliance
- **Flexibility:** Multiple data sharing levels based on user preference
- **Recovery Options:** Multiple secure recovery mechanisms

### Negative
- **Complexity:** Increased codebase complexity and maintenance overhead
- **Performance:** Encryption overhead may impact application performance
- **Development Time:** Significant development effort required (110+ tasks)
- **User Experience:** Additional setup steps for users
- **Support Burden:** More complex troubleshooting for encryption issues

### Risks
- **Key Loss:** If users lose master password and recovery options, data is irrecoverable
- **Implementation Bugs:** Encryption vulnerabilities could compromise security
- **Performance Impact:** Heavy encryption might slow down application
- **Migration Complexity:** Existing user data requires careful migration

## Implementation Strategy

### Phase 1: Core Infrastructure (Tasks 1-35)
- Set up encryption libraries and folder structure
- Implement base encryption services
- Create key management system
- Build web client-side encryption

### Phase 2: Data Processing (Tasks 36-65)
- Implement three-tier data transmission system
- Build API endpoints for each data type
- Create analytics and consent management
- Add recovery mechanisms

### Phase 3: External Services (Tasks 66-75)
- Encrypt external service credentials
- Update existing service integrations
- Build migration tools

### Phase 4: User Interface (Tasks 76-85)
- Create privacy and encryption settings UI
- Build setup wizards
- Implement security question management

### Phase 5: Testing & Documentation (Tasks 86-110)
- Comprehensive testing strategy
- Security audits
- Documentation creation
- Production deployment

## Compliance and Standards

- **OWASP Top 10:** Full compliance with security guidelines
- **NIST Cybersecurity Framework:** Alignment with industry standards
- **GDPR Article 25:** Privacy by design implementation
- **SOC 2 Type II:** Planned compliance (future)
- **ISO 27001:** Planned certification (future)

## Security Considerations

- **Threat Model:** Protection against data breaches, unauthorized access, and state-level surveillance
- **Attack Vectors:** Man-in-the-middle, local storage attacks, cloud provider breaches
- **Zero-Knowledge:** Server cannot decrypt user data without user's master password
- **Forward Secrecy:** Regular key rotation ensures past data remains secure

## Migration Plan

1. **Gradual Rollout:** Feature flags for controlled deployment
2. **Existing Users:** Optional migration with clear communication
3. **Data Backup:** Full backup before any encryption migration
4. **Rollback Plan:** Ability to rollback to previous version if issues arise

## Success Metrics

- **Security:** Zero data breaches, successful security audits
- **Performance:** <10% performance overhead from encryption
- **Adoption:** >70% of users adopt encryption features within 6 months
- **Recovery:** <1% of users require support for key recovery

## Related Documents

- [PRIVACY.md](../../PRIVACY.md) - Privacy policy implementation
- [Project Standards](../../.cursor/rules/Project-Standards-and-Guidelines.mdc) - Security guidelines
- [TODO List](../../chatcontext/todo04.md) - Implementation tasks

---

**Review Required:** Security team, legal team, development team  
**Next Review Date:** 2025-01-28  
**Status Update:** To be updated as implementation progresses 