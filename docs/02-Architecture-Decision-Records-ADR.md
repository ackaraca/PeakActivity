# Architecture Decision Records (ADRs)

This document lists important architectural decisions taken in the PeakActivity project, explaining the context, alternatives, and outcomes for each decision.

## ADR-001: Firestore Usage
### Context
- Need for a scalable, real-time database
- User data will be synchronized across different devices

### Decision
Firestore is adopted as the primary data store.

### Alternatives
- Traditional SQL (PostgreSQL, MySQL)
- Self-hosted NoSQL (MongoDB)

### Outcome
- Real-time synchronization capability
- Automatic scalability
- Potential increase in cloud costs

---

## ADR-002: Hybrid AI Architecture
### Context
- Privacy priority, sometimes local classification is sufficient
- Complex analyses require cloud AI

### Decision
TensorFlow.js for local classification, OpenAI/Gemini for advanced analysis.

### Alternatives
- Fully local ML models (TensorFlow Python)
- Fully cloud-based ML

### Outcome
- Balance between privacy and performance
- Cloud connection for model updates

---

## ADR-003: PraisonAI Agent Integration
### Context
- Automation and suggestion layer

### Decision
PraisonAI agent framework is used.

### Alternatives
- Develop own agent infrastructure
- Use another open-source agent

### Outcome
- Rapid prototyping
- Community support
