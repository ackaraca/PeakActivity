# ActivityWatch Firebase Endpoints ve Veri Yapıları Yeniden Tasarım

**Oluşturulma Tarihi:** 2025-01-21 04:19:09  
**Proje:** ActivityWatch Firebase Entegrasyonu  

## 1. Core ActivityWatch Veri Modeli Analizi

### 1.1 Event Model
```typescript
interface AWEvent {
  id?: string | number;           // Optional, auto-generated
  timestamp: string;              // ISO8601 formatted timestamp
  duration: number;               // Duration in seconds
  data: Record<string, any>;      // Flexible data object
}
```

### 1.2 Bucket Model
```typescript
interface AWBucket {
  id: string;                     // Bucket identifier
  type: string;                   // Event type (afk.status, window.title, etc.)
  client: string;                 // Client identifier
  hostname: string;               // Device hostname
  created: string;                // ISO8601 creation timestamp
  name?: string;                  // Optional bucket name
  data?: Record<string, any>;     // Optional metadata
  last_updated?: string;          // Last event timestamp
}
```

## 2. Firebase Veri Yapısı Tasarımı

### 2.1 Firestore Collections Yapısı
```
/buckets/{bucketId}
  - metadata: AWBucket
  - events/{eventId}: AWEvent
  - stats/summary: BucketStats
  
/users/{userId}/buckets/{bucketId}  // Multi-tenant support
  - metadata: AWBucket
  - events/{eventId}: AWEvent
  
/devices/{deviceId}
  - hostname: string
  - device_id: string
  - last_seen: timestamp
  - buckets: string[]             // Bucket references
```

### 2.2 Firebase Event Document
```typescript
interface FirebaseEvent {
  // Core fields
  id: string;                     // Firebase auto-generated ID
  timestamp: FirebaseFirestore.Timestamp;
  duration: number;               // Seconds as number
  data: Record<string, any>;
  
  // Firebase-specific fields
  bucket_id: string;              // Parent bucket reference
  device_id: string;              // Device identifier
  created_at: FirebaseFirestore.Timestamp;
  updated_at?: FirebaseFirestore.Timestamp;
  
  // Indexing fields (for query optimization)
  date_key: string;               // YYYY-MM-DD format for daily queries
  hour_key: string;               // YYYY-MM-DD-HH for hourly queries
  type: string;                   // Event type from bucket
}
```

## 3. Cloud Functions Endpoints

### 3.1 Bucket Management

#### GET /api/0/buckets
```typescript
export const getBuckets = functions.https.onRequest(async (req, res) => {
  try {
    const bucketsRef = db.collection('buckets');
    const snapshot = await bucketsRef.get();
    
    const buckets: Record<string, AWBucket> = {};
    for (const doc of snapshot.docs) {
      const bucketData = doc.data() as AWBucket;
      
      // Get last event for last_updated calculation
      const lastEventSnapshot = await db
        .collection(`buckets/${doc.id}/events`)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();
      
      if (!lastEventSnapshot.empty) {
        const lastEvent = lastEventSnapshot.docs[0].data();
        buckets[doc.id] = {
          ...bucketData,
          last_updated: new Date(
            lastEvent.timestamp.toDate().getTime() + (lastEvent.duration * 1000)
          ).toISOString()
        };
      } else {
        buckets[doc.id] = bucketData;
      }
    }
    
    res.json(buckets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### POST /api/0/buckets/{bucketId}
```typescript
export const createBucket = functions.https.onRequest(async (req, res) => {
  try {
    const { bucketId } = req.params;
    const { type, client, hostname, created, name, data } = req.body;
    
    // Handle "!local" hostname
    let finalHostname = hostname;
    let finalData = data || {};
    
    if (hostname === "!local") {
      finalHostname = process.env.HOSTNAME || os.hostname();
      finalData.device_id = await getDeviceId();
    }
    
    const bucket: AWBucket = {
      id: bucketId,
      type,
      client,
      hostname: finalHostname,
      created: created || new Date().toISOString(),
      name,
      data: finalData
    };
    
    // Check if bucket exists
    const bucketRef = db.collection('buckets').doc(bucketId);
    const bucketDoc = await bucketRef.get();
    
    if (bucketDoc.exists) {
      return res.status(409).json({ error: "Bucket already exists" });
    }
    
    await bucketRef.set(bucket);
    res.status(201).json({ success: true });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 3.2 Event Management

#### GET /api/0/buckets/{bucketId}/events
```typescript
export const getEvents = functions.https.onRequest(async (req, res) => {
  try {
    const { bucketId } = req.params;
    const { limit = -1, start, end } = req.query;
    
    // Verify bucket exists
    const bucketRef = db.collection('buckets').doc(bucketId);
    const bucketDoc = await bucketRef.get();
    
    if (!bucketDoc.exists) {
      return res.status(404).json({ error: "Bucket not found" });
    }
    
    let query = db.collection(`buckets/${bucketId}/events`)
      .orderBy('timestamp', 'desc');
    
    // Apply time filters
    if (start) {
      const startTime = Timestamp.fromDate(new Date(start));
      query = query.where('timestamp', '>=', startTime);
    }
    
    if (end) {
      const endTime = Timestamp.fromDate(new Date(end));
      query = query.where('timestamp', '<=', endTime);
    }
    
    // Apply limit
    if (limit > 0) {
      query = query.limit(limit);
    }
    
    const snapshot = await query.get();
    const events = snapshot.docs.map(doc => convertFirebaseEventToAW(doc.data()));
    
    res.json(events);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### POST /api/0/buckets/{bucketId}/events
```typescript
export const createEvents = functions.https.onRequest(async (req, res) => {
  try {
    const { bucketId } = req.params;
    const events: AWEvent[] = Array.isArray(req.body) ? req.body : [req.body];
    
    // Verify bucket exists
    const bucketRef = db.collection('buckets').doc(bucketId);
    const bucketDoc = await bucketRef.get();
    
    if (!bucketDoc.exists) {
      return res.status(404).json({ error: "Bucket not found" });
    }
    
    const bucket = bucketDoc.data() as AWBucket;
    const batch = db.batch();
    
    const convertedEvents = events.map(event => {
      const eventId = event.id?.toString() || db.collection('temp').doc().id;
      const timestamp = Timestamp.fromDate(new Date(event.timestamp));
      const dateKey = timestamp.toDate().toISOString().split('T')[0];
      const hourKey = timestamp.toDate().toISOString().substr(0, 13);
      
      const firebaseEvent: FirebaseEvent = {
        id: eventId,
        timestamp,
        duration: event.duration,
        data: event.data,
        bucket_id: bucketId,
        device_id: bucket.data?.device_id || bucket.hostname,
        type: bucket.type,
        date_key: dateKey,
        hour_key: hourKey,
        created_at: Timestamp.now()
      };
      
      const eventRef = db.collection(`buckets/${bucketId}/events`).doc(eventId);
      batch.set(eventRef, firebaseEvent);
      
      return { ...event, id: eventId };
    });
    
    await batch.commit();
    
    // Return single event if only one was created
    if (convertedEvents.length === 1) {
      res.json(convertedEvents[0]);
    } else {
      res.json({ success: true, count: convertedEvents.length });
    }
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 3.3 Heartbeat Endpoint
```typescript
export const heartbeat = functions.https.onRequest(async (req, res) => {
  try {
    const { bucketId } = req.params;
    const { event, pulsetime } = req.body;
    
    const eventsRef = db.collection(`buckets/${bucketId}/events`);
    
    // Get last event
    const lastEventSnapshot = await eventsRef
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();
    
    if (lastEventSnapshot.empty) {
      // No previous events, create new one
      const newEvent = await createEventInBucket(bucketId, event);
      return res.json(newEvent);
    }
    
    const lastEventDoc = lastEventSnapshot.docs[0];
    const lastEvent = convertFirebaseEventToAW(lastEventDoc.data());
    
    // Check if events can be merged (heartbeat logic)
    const lastEventEnd = new Date(lastEvent.timestamp).getTime() + (lastEvent.duration * 1000);
    const newEventStart = new Date(event.timestamp).getTime();
    const timeDiff = (newEventStart - lastEventEnd) / 1000;
    
    if (timeDiff <= pulsetime && deepEqual(lastEvent.data, event.data)) {
      // Merge with last event - extend duration
      const newDuration = (newEventStart + (event.duration * 1000) - new Date(lastEvent.timestamp).getTime()) / 1000;
      
      await lastEventDoc.ref.update({
        duration: newDuration,
        updated_at: Timestamp.now()
      });
      
      const updatedEvent = { ...lastEvent, duration: newDuration };
      return res.json(updatedEvent);
    } else {
      // Create new event
      const newEvent = await createEventInBucket(bucketId, event);
      return res.json(newEvent);
    }
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 4. Query System Firebase Adaptasyonu

### 4.1 Query2 Functions Port

#### query_bucket implementasyonu
```typescript
async function queryBucket(
  bucketName: string, 
  starttime: string, 
  endtime: string
): Promise<AWEvent[]> {
  const start = Timestamp.fromDate(new Date(starttime));
  const end = Timestamp.fromDate(new Date(endtime));
  
  const snapshot = await db
    .collection(`buckets/${bucketName}/events`)
    .where('timestamp', '>=', start)
    .where('timestamp', '<=', end)
    .orderBy('timestamp', 'desc')
    .get();
  
  return snapshot.docs.map(doc => convertFirebaseEventToAW(doc.data()));
}
```

#### find_bucket implementasyonu
```typescript
async function findBucket(
  filterStr: string, 
  hostname?: string
): Promise<string> {
  let query = db.collection('buckets')
    .where('id', '>=', filterStr)
    .where('id', '<', filterStr + '\uf8ff');
  
  if (hostname) {
    query = query.where('hostname', '==', hostname);
  }
  
  const snapshot = await query.limit(1).get();
  
  if (snapshot.empty) {
    throw new Error(`Unable to find bucket matching '${filterStr}'`);
  }
  
  return snapshot.docs[0].id;
}
```

### 4.2 Transform Functions

#### filter_keyvals Firebase implementasyonu
```typescript
function filterKeyvals(
  events: AWEvent[], 
  key: string, 
  vals: any[], 
  exclude = false
): AWEvent[] {
  return events.filter(event => {
    const eventValue = getNestedValue(event.data, key);
    const matches = vals.includes(eventValue);
    return exclude ? !matches : matches;
  });
}
```

#### merge_events_by_keys implementasyonu
```typescript
function mergeEventsByKeys(events: AWEvent[], keys: string[]): AWEvent[] {
  const merged: AWEvent[] = [];
  let currentEvent: AWEvent | null = null;
  
  for (const event of events) {
    if (!currentEvent) {
      currentEvent = { ...event };
      continue;
    }
    
    // Check if events can be merged
    const canMerge = keys.every(key => 
      getNestedValue(currentEvent!.data, key) === getNestedValue(event.data, key)
    );
    
    if (canMerge) {
      // Extend duration
      const currentEnd = new Date(currentEvent.timestamp).getTime() + (currentEvent.duration * 1000);
      const eventEnd = new Date(event.timestamp).getTime() + (event.duration * 1000);
      const newDuration = (Math.max(currentEnd, eventEnd) - new Date(currentEvent.timestamp).getTime()) / 1000;
      currentEvent.duration = newDuration;
    } else {
      merged.push(currentEvent);
      currentEvent = { ...event };
    }
  }
  
  if (currentEvent) {
    merged.push(currentEvent);
  }
  
  return merged;
}
```

## 5. Performans Optimizasyonları

### 5.1 Composite Indexes
```typescript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "bucket_id", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "events", 
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "date_key", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION_GROUP", 
      "fields": [
        { "fieldPath": "device_id", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### 5.2 Caching Strategy
```typescript
import { NodeCache } from 'node-cache';

const queryCache = new NodeCache({ 
  stdTTL: 300,        // 5 minutes
  checkperiod: 60     // Check for expired keys every minute
});

export const cachedQuery = functions.https.onRequest(async (req, res) => {
  const { name, query, timeperiods } = req.body;
  const cacheKey = `${name}_${hashObject({ query, timeperiods })}`;
  
  // Check cache first
  const cached = queryCache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }
  
  // Execute query
  const result = await executeQuery(name, query, timeperiods);
  
  // Cache result
  queryCache.set(cacheKey, result);
  
  res.json(result);
});
```

## 6. Security Rules

### 6.1 Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Buckets collection
    match /buckets/{bucketId} {
      allow read, write: if request.auth != null 
        && (resource == null || resource.data.device_id == request.auth.token.device_id);
      
      // Events subcollection
      match /events/{eventId} {
        allow read, write: if request.auth != null
          && get(/databases/$(database)/documents/buckets/$(bucketId)).data.device_id == request.auth.token.device_id;
      }
    }
    
    // User-specific buckets (multi-tenant)
    match /users/{userId}/buckets/{bucketId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /events/{eventId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Device information
    match /devices/{deviceId} {
      allow read, write: if request.auth != null 
        && request.auth.token.device_id == deviceId;
    }
  }
}
```

## 7. Migration ve Deployment

### 7.1 Existing Data Migration
```typescript
export const migrateFromLocal = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const { exportData } = data;
  const batch = db.batch();
  
  // Migrate buckets
  for (const [bucketId, bucketData] of Object.entries(exportData.buckets)) {
    const bucketRef = db.collection('buckets').doc(bucketId);
    batch.set(bucketRef, bucketData.metadata);
    
    // Migrate events
    for (const event of bucketData.events) {
      const eventRef = db.collection(`buckets/${bucketId}/events`).doc();
      batch.set(eventRef, convertAWEventToFirebase(event, bucketId));
    }
  }
  
  await batch.commit();
  return { success: true };
});
```

### 7.2 Deployment Config
```yaml
# firebase.json
{
  "functions": {
    "runtime": "nodejs18",
    "source": "functions",
    "predeploy": ["npm --prefix \"$RESOURCE_DIR\" run build"]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      }
    ]
  }
}
```

## 8. Monitoring ve Debugging

### 8.1 Logging Strategy
```typescript
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

export function logEvent(
  level: 'info' | 'warn' | 'error',
  message: string,
  metadata?: any
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    metadata: metadata || {}
  };
  
  // Log to Cloud Logging
  logger[level](message, metadata);
  
  // Store in Firestore for historical analysis
  db.collection('logs').add(logEntry);
}
```

### 8.2 Health Check Endpoint
```typescript
export const health = functions.https.onRequest(async (req, res) => {
  try {
    // Test database connection
    await db.collection('health').doc('test').set({ timestamp: new Date() });
    
    // Test authentication
    const authCheck = req.headers.authorization ? true : false;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      auth: authCheck ? 'configured' : 'not_configured'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

## 9. Gelecek Özellikler için Hazırlık

### 9.1 Schema Versioning
```typescript
interface AWEventV2 extends AWEvent {
  schema_version: number;
  tags?: string[];
  categories?: string[];
  confidence_score?: number;
}

// Migration function for schema updates
export const migrateSchema = functions.firestore
  .document('buckets/{bucketId}/events/{eventId}')
  .onWrite(async (change, context) => {
    if (!change.after.exists) return;
    
    const event = change.after.data();
    if (!event.schema_version || event.schema_version < CURRENT_SCHEMA_VERSION) {
      // Apply schema migration
      const updatedEvent = migrateEventSchema(event);
      return change.after.ref.update(updatedEvent);
    }
  });
```

### 9.2 Plugin Architecture
```typescript
interface ActivityWatchPlugin {
  name: string;
  version: string;
  endpoints: PluginEndpoint[];
  eventProcessors?: EventProcessor[];
  queryFunctions?: QueryFunction[];
}

// Plugin registration
export const registerPlugin = functions.https.onCall(async (data, context) => {
  const plugin: ActivityWatchPlugin = data.plugin;
  
  await db.collection('plugins').doc(plugin.name).set({
    ...plugin,
    registered_at: new Date(),
    registered_by: context.auth?.uid
  });
  
  return { success: true };
});
```

Bu yeniden tasarım, ActivityWatch'un mevcut core yapısına tam uyumlu, performanslı ve gelecekteki geliştirmeler için esnek bir Firebase entegrasyonu sunuyor. 