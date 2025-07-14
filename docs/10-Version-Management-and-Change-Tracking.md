# Version Management and Change Tracking

Comprehensive version management strategy and change tracking system for the PeakActivity project.

## Semantic Versioning (SemVer)

### Version Numbering System
PeakActivity uses the **MAJOR.MINOR.PATCH** format:

- **MAJOR**: Breaking changes in the API (backward incompatible)
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Pre-release Versions
```
1.0.0-alpha.1    // Alpha version
1.0.0-beta.2     // Beta version  
1.0.0-rc.1       // Release candidate
```

### Version Tagging Examples
```bash
# Major release - ActivityWatch 2.0 integration
v2.0.0

# Minor release - PraisonAI agents added
v1.1.0

# Patch release - Firebase connection bug fix
v1.0.1

# Pre-release - Beta testing
v1.2.0-beta.1
```

## Git Workflow and Branching Strategy

### Branch Structure
```
main (production)
├── dev01 (development)
├── feature/ai-insights
├── feature/firebase-sync
├── hotfix/auth-security
└── release/v1.1.0
```

### Branch Rules
- **main**: Production-ready, stable code
- **dev01**: Development branch, new features are merged here
- **feature/***: New feature development
- **hotfix/***: Critical bug fixes
- **release/***: Release preparation branches

### Commit Message Standards
```bash
# Format: <type>(<scope>): <description>
feat(auth): add Firebase Authentication integration
fix(ui): resolve dark mode toggle issue
docs(api): update endpoint documentation
```
