# Firebase Development Documentation

## Project Structure

### Recommended Directory Organization
- **cloud-functions/**
  - **src/**
    - **index.ts**: Main export file
    - **triggers/**: Trigger functions
      - **auth-triggers.ts**: Auth triggers
      - **firestore-triggers.ts**
      - **scheduled-triggers.ts**
    - **api/**: HTTP endpoints
      - **activity-api.ts**
      - **analytics-api.ts**
      - **user-api.ts**
    - **services/**: Business logic services
      - **activity-service.ts**
      - **ai-service.ts**
      - **notification-service.ts**
    - **utils/**: Helper functions
      - **validation.ts**
      - **analytics.ts**
      - **date-utils.ts**
    - **types/**: TypeScript types

## Cloud Functions Standards
- **HTTP Triggers**: Used for RESTful APIs.
- **Callable Functions**: For client SDK usage.

## Firestore Triggers
- **Document Creation and Updates**: Interact with services like analytics and notifications. 