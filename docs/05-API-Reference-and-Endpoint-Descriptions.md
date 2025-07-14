# API Reference and Endpoint Descriptions

This document explains all endpoints, parameters, and usages of the PeakActivity backend API.

## Authentication

### POST /api/v1/auth/login
- Description: User authentication
- Request Body:
  ```json
  { "email": "user@example.com", "password": "string" }
  ```
- Success Response (200):
  ```json
  { "token": "<jwt-token>", "expiresIn": 3600 }
  ```

### POST /api/v1/auth/register
- Description: Create a new user
- Request Body:
  ```json
  { "email": "user@example.com", "password": "string", "name": "John Doe" }
  ```
- Success Response (201):
  ```json
  { "userId": "uid_12345" }
  ```

## Events

### GET /api/v1/events
- Description: Retrieves user's activity records
- Query Parameters:
  - `startDate` (ISO string)
  - `endDate` (ISO string)
- Success Response (200): Array of Event objects

### POST /api/v1/events
- Description: Add a new activity record
- Request Body: Event object
- Success Response (201): Created Event object

## Insights

### GET /api/v1/insights
- Description: Retrieves AI insights
- Query Parameters:
  - `type` (focus|productivity)
- Success Response (200): Array of Insight objects

### POST /api/v1/insights/analyze
- Description: Starts analysis for the specified data range
- Request Body:
  ```json
  { "startDate": "2025-01-01T00:00:00Z", "endDate": "2025-01-02T00:00:00Z" }
  ```
- Success Response (202): Analysis started message
