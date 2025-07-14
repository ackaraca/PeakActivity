# Data Flow and Synchronization

Data flow is the heart of PeakActivity. User activities are collected by ActivityWatch watchers, processed at the server layer, and synchronized to Firebase. Below is a step-by-step explanation of the data journey.

## 1. Data Collection (ActivityWatch)
- Watcher modules (afk, input, window) actively listen for events
- Each event is locally recorded in `Bucket` and `Event` structures (SQLite or memory)

## 2. Local Processing (aw-server)
- The `aw-server` application processes, anonymizes, and temporarily stores events
- Data anonymization rules (removing personal info from window titles)

## 3. Cloud Synchronization (Firebase)
- With user consent, batch or real-time synchronization
- Adding to Firestore's `aw_events` collection
- Synchronization status tracking (started, success, error)

## 4. AI Analysis (Cloud Functions)
- The `ai-insight-api` function is called
- Data is sent to the AI workflow (Edge or Cloud AI)

## 5. Storing and Notifying Results
- Generated insights are stored in Firestore's `insights` collection
- Notification sent to the user (`aw-notify`)

## 6. Bidirectional Synchronization
- When user settings change, the local structure is also updated
- Conflict resolution strategy: Most recent update takes precedence
