# ActivityWatch Core Integration with Firebase

Tarih: 2025-07-09 15:18:57

## Genel Bakış

Bu doküman ActivityWatch core yapısının Firebase ile entegrasyonu için endpoint tasarımı, veri modelleri ve mimari yaklaşımı tanımlar. Mevcut ActivityWatch altyapısıyla uyumlu, gelecekteki geliştirmeler için esnek bir yapı sunar.

## ActivityWatch Core Yapısı Analizi

### Ana Bileşenler

1. **Event Model** (`aw_core.models.Event`)
   - `id`: Olay benzersiz kimliği
   - `timestamp`: Zaman damgası (UTC)
   - `duration`: Süre (timedelta)
   - `data`: Olay verisi (dict)

2. **Datastore** (`aw_datastore.Datastore`)
   - Bucket yönetimi
   - Event CRUD işlemleri
   - Zaman tabanlı sorgular

3. **Query Engine** (`aw_query`)
   - Query fonksiyonları
   - Transform işlemleri
   - Analitik hesaplamalar

4. **Transform Operations** (`aw_transform`)
   - Veri dönüşümleri
   - Filtreleme işlemleri
   - Gruplama ve birleştirme

## Firebase Entegrasyon Stratejisi

### 1. Veri Modeli Uyumluluk

#### ActivityWatch Event → Firebase Document
```typescript
interface FirebaseEvent {
  // ActivityWatch Core uyumlu
  id: string;                    // Event.id
  timestamp: number;             // Event.timestamp (milliseconds)
  duration: number;              // Event.duration (seconds)
  data: Record<string, any>;     // Event.data
  
  // Firebase özel alanlar
  user_id: string;               // Kullanıcı kimliği
  bucket_id: string;             // Bucket kimliği
  device_id: string;             // Cihaz kimliği
  
  // Metadata
  created_at: number;            // Firestore creation time
  updated_at: number;            // Last update time
  version: number;               // Version control
}
```

### 2. Bucket Structure

ActivityWatch bucket yapısı Firebase collection yapısına dönüştürülür:

```
users/{userId}/buckets/{bucketId}/events/{eventId}
```

#### Bucket Metadata
```typescript
interface BucketMetadata {
  id: string;                    // Bucket ID
  name: string;                  // Bucket name
  type: string;                  // Bucket type (aw-watcher-window, aw-watcher-afk, etc.)
  client: string;                // Client name
  hostname: string;              // Device hostname
  created: string;               // Creation timestamp (ISO string)
  data: Record<string, any>;     // Additional metadata
  
  // Firebase extensions
  user_id: string;
  device_info: {
    platform: string;
    version: string;
  };
  sync_status: 'active' | 'paused' | 'disabled';
  last_sync: number;
}
```

## API Endpoint Tasarımı

### 1. Core CRUD Operations

#### Bucket Management
```typescript
// GET /api/v1/buckets
// POST /api/v1/buckets
// PUT /api/v1/buckets/{bucketId}
// DELETE /api/v1/buckets/{bucketId}
```

#### Event Management
```typescript
// GET /api/v1/buckets/{bucketId}/events
// POST /api/v1/buckets/{bucketId}/events
// PUT /api/v1/buckets/{bucketId}/events/{eventId}
// DELETE /api/v1/buckets/{bucketId}/events/{eventId}
```

### 2. Query Engine Endpoints

#### Query Execution
```typescript
// POST /api/v1/query
{
  "name": "query_name",
  "query": "events = query_bucket('bucket_id'); RETURN = events;",
  "starttime": "2025-07-09T00:00:00Z",
  "endtime": "2025-07-09T23:59:59Z"
}
```

#### Transform Operations
```typescript
// POST /api/v1/transform/filter_keyvals
// POST /api/v1/transform/merge_events_by_keys
// POST /api/v1/transform/categorize
// POST /api/v1/transform/flood
```

### 3. Analytics Endpoints

#### Focus Score Calculation
```typescript
// POST /api/v1/analytics/focus_score
{
  "activities": ActivityEvent[],
  "timeWindow": {
    "start": "2025-07-09T09:00:00Z",
    "end": "2025-07-09T17:00:00Z"
  }
}
```

#### Daily Summary
```typescript
// GET /api/v1/analytics/daily_summary
// Query parameters: date, timezone
```

## Cloud Functions Architecture

### 1. HTTP Triggers (RESTful API)

```typescript
// src/api/buckets-api.ts
export const bucketsApi = onRequest({
  cors: { origin: true },
  rateLimits: { maxConcurrentRequests: 100 }
}, async (req, res) => {
  // Bucket CRUD operations
});

// src/api/events-api.ts
export const eventsApi = onRequest({
  cors: { origin: true },
  rateLimits: { maxConcurrentRequests: 200 }
}, async (req, res) => {
  // Event CRUD operations
});

// src/api/query-api.ts
export const queryApi = onRequest({
  cors: { origin: true },
  memory: '1GiB',
  timeoutSeconds: 300
}, async (req, res) => {
  // Query execution
});
```

### 2. Callable Functions

```typescript
// src/functions/analytics.ts
export const calculateFocusScore = onCall({
  memory: '512MiB',
  timeoutSeconds: 120
}, async (request) => {
  // ActivityWatch transform operations
});

export const processActivityBatch = onCall({
  memory: '1GiB',
  timeoutSeconds: 300
}, async (request) => {
  // Batch activity processing
});
```

### 3. Firestore Triggers

```typescript
// src/triggers/event-triggers.ts
export const onEventCreated = onDocumentCreated(
  'users/{userId}/buckets/{bucketId}/events/{eventId}',
  async (event) => {
    // Real-time analytics update
    // Category analysis
    // Focus score calculation
  }
);
```

## Query Engine Port

### 1. Query Functions Implementation

ActivityWatch query fonksiyonları Firebase Cloud Functions olarak port edilir:

```typescript
// src/services/query-service.ts
export class QueryService {
  static async executeQuery(
    userId: string,
    query: string,
    starttime: string,
    endtime: string
  ) {
    const namespace = {
      STARTTIME: starttime,
      ENDTIME: endtime,
      userId: userId
    };
    
    // Parse and execute query
    return await this.interpretQuery(query, namespace);
  }
  
  static async queryBucket(
    userId: string, 
    bucketId: string, 
    starttime?: Date, 
    endtime?: Date
  ): Promise<ActivityEvent[]> {
    // Firestore query implementation
  }
}
```

### 2. Transform Operations

```typescript
// src/services/transform-service.ts
export class TransformService {
  static filterKeyvals(
    events: ActivityEvent[], 
    key: string, 
    vals: string[]
  ): ActivityEvent[] {
    // ActivityWatch filter_keyvals implementation
  }
  
  static mergeEventsByKeys(
    events: ActivityEvent[], 
    keys: string[]
  ): ActivityEvent[] {
    // ActivityWatch merge_events_by_keys implementation
  }
  
  static flood(
    events: ActivityEvent[], 
    pulsetime: number = 5
  ): ActivityEvent[] {
    // ActivityWatch flood implementation
  }
}
```

## Veri Senkronizasyonu

### 1. Real-time Sync

```typescript
// Client-side real-time listeners
const unsubscribe = onSnapshot(
  collection(db, `users/${userId}/buckets/${bucketId}/events`),
  (snapshot) => {
    // Handle real-time updates
  }
);
```

### 2. Offline Support

```typescript
// Enable offline persistence
enableNetwork(db);
```

### 3. Conflict Resolution

```typescript
interface EventConflictResolution {
  strategy: 'latest_wins' | 'merge' | 'manual';
  timestamp: number;
  source: 'client' | 'server';
}
```

## Security Rules

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User data access
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Bucket access
      match /buckets/{bucketId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        // Event access
        match /events/{eventId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
  }
}
```

## Performans Optimizasyonları

### 1. Indexing Strategy

```typescript
// Composite indexes for common queries
// users/{userId}/buckets/{bucketId}/events
// - timestamp (descending)
// - data.app_name, timestamp (descending)
// - data.category, timestamp (descending)
```

### 2. Caching Strategy

```typescript
// Redis cache for frequent queries
const cacheKey = `user:${userId}:events:${date}`;
const cachedEvents = await redis.get(cacheKey);
```

### 3. Pagination

```typescript
interface PaginationParams {
  limit: number;
  cursor?: string;
  startAfter?: FirestoreTimestamp;
}
```

## Migration Strategy

### 1. Existing Data Migration

```typescript
// Migration script for existing ActivityWatch data
export const migrateActivityWatchData = async (
  sqliteDbPath: string,
  userId: string
) => {
  // Read SQLite data
  // Transform to Firebase format
  // Batch write to Firestore
};
```

### 2. Gradual Migration

```typescript
// Hybrid approach: Read from both sources
export const getEvents = async (
  userId: string,
  bucketId: string,
  starttime: Date,
  endtime: Date
) => {
  const firebaseEvents = await getFirebaseEvents(...);
  const sqliteEvents = await getSqliteEvents(...);
  
  return mergeEventLists(firebaseEvents, sqliteEvents);
};
```

## Monitoring ve Debugging

### 1. Performance Metrics

```typescript
// Performance tracking for all operations
export const trackPerformance = (
  operation: string,
  duration: number,
  success: boolean
) => {
  // Log to Firebase Analytics
};
```

### 2. Error Handling

```typescript
// Structured error handling
export class ActivityWatchError extends Error {
  constructor(
    message: string,
    public code: string,
    public operation: string
  ) {
    super(message);
  }
}
```

## Gelecek Özellikler için Hazırlık

### 1. Schema Versioning

```typescript
interface DocumentVersion {
  version: number;
  migrations: Migration[];
}
```

### 2. Plugin Architecture

```typescript
interface PluginInterface {
  name: string;
  version: string;
  endpoints: EndpointDefinition[];
  transforms: TransformDefinition[];
}
```

### 3. Multi-tenant Support

```typescript
interface TenantContext {
  userId: string;
  organizationId?: string;
  permissions: Permission[];
}
```

Bu integration dokümanı ActivityWatch core yapısıyla tam uyumlu, gelecekteki geliştirmeler için esnek bir Firebase mimarisi sunmaktadır. 