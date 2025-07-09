# ActivityWatch Server Firebase Entegrasyonu

**Oluşturulma Tarihi:** 2025-01-21 05:10:00  
**Modül:** aw-server Firebase Integration  
**Amaç:** aw-server backend'inin Firebase Cloud Functions ve Firestore ile tam entegrasyonu

## 1. Mevcut aw-server Analizi

### 1.1 Ana Bileşenler
```python
# Mevcut aw-server yapısı
- ServerAPI: Core business logic (bucket/event management)
- REST API: Flask-RESTful endpoints (/0/buckets, /0/events, etc.)
- Datastore Interface: Abstract storage layer (memory, peewee)
- Query Engine: Query2 processing system
- WebUI Hosting: Static file serving ve SPA routing
- Settings: Configuration management
```

### 1.2 Temel Endpoint'ler
```python
# api.py - Core Server Operations
class ServerAPI:
    def get_info() -> server_info
    def get_buckets() -> Dict[bucket_id, bucket_metadata]
    def create_bucket(bucket_id, type, client, hostname)
    def get_events(bucket_id, limit, start, end) -> List[Event]
    def create_events(bucket_id, events) -> Event
    def heartbeat(bucket_id, event, pulsetime) -> Event
    def query2(name, query, timeperiods, cache)
    def export_all() / import_all() # Bulk operations
    
# rest.py - HTTP Endpoints
- GET /0/info
- GET/POST /0/buckets/{bucket_id}
- GET/POST /0/buckets/{bucket_id}/events
- POST /0/buckets/{bucket_id}/heartbeat
- POST /0/query/
- GET/POST /0/export, /0/import
```

## 2. Firebase Server Architecture

### 2.1 Cloud Functions Mimarisi
```typescript
// Firebase Cloud Functions Structure
functions/
├── api/
│   ├── info.ts              // GET /api/info
│   ├── buckets.ts           // Bucket CRUD operations
│   ├── events.ts            // Event management
│   ├── heartbeat.ts         // Real-time heartbeat processing
│   ├── query.ts             // Query2 engine
│   └── settings.ts          // User settings
├── triggers/
│   ├── onBucketCreate.ts    // Firestore triggers
│   ├── onEventCreate.ts     // Real-time data processing
│   └── onUserCreate.ts      // User initialization
├── scheduled/
│   ├── aggregation.ts       // Daily/hourly aggregations
│   ├── cleanup.ts           // Data retention policies
│   └── analytics.ts         // Usage analytics
└── utils/
    ├── auth.ts              // Authentication helpers
    ├── firestore.ts         // Database utilities
    └── validation.ts        // Data validation
```

### 2.2 Firebase Services Integration
```typescript
// Firebase Services Configuration
interface FirebaseServerConfig {
  // Authentication
  auth: {
    providers: ['google', 'email', 'anonymous'];
    customClaims: ['admin', 'premium', 'device_limit'];
  };
  
  // Firestore Database
  firestore: {
    collections: {
      users: '/users/{userId}';
      buckets: '/users/{userId}/buckets/{bucketId}';
      events: '/users/{userId}/buckets/{bucketId}/events/{eventId}';
      aggregations: '/users/{userId}/aggregations/{period}';
      settings: '/users/{userId}/settings';
    };
  };
  
  // Cloud Functions
  functions: {
    region: 'us-central1';
    timeout: '540s';
    memory: '2GB';
    maxInstances: 1000;
  };
  
  // Hosting
  hosting: {
    site: 'activitywatch-app';
    customDomain: 'app.activitywatch.net';
    headers: [
      {source: '/api/**', headers: [{key: 'Cache-Control', value: 'no-cache'}]}
    ];
  };
}
```

## 3. Authentication & Authorization

### 3.1 Firebase Auth Integration
```typescript
// auth.ts - Authentication Middleware
import { auth } from 'firebase-admin';
import { CallableContext, HttpsError } from 'firebase-functions/v2/https';

interface AuthenticatedUser {
  uid: string;
  email?: string;
  customClaims?: {
    admin?: boolean;
    premium?: boolean;
    device_limit?: number;
  };
}

export async function authenticateUser(context: CallableContext): Promise<AuthenticatedUser> {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const user = await auth().getUser(context.auth.uid);
  return {
    uid: user.uid,
    email: user.email,
    customClaims: user.customClaims as any
  };
}

export function requireAuth(handler: Function) {
  return async (data: any, context: CallableContext) => {
    const user = await authenticateUser(context);
    return handler(data, context, user);
  };
}

// Multi-device authorization
export async function checkDeviceLimit(userId: string, deviceId: string): Promise<boolean> {
  const userDoc = await firestore().collection('users').doc(userId).get();
  const userData = userDoc.data();
  
  if (!userData) return false;
  
  const deviceLimit = userData.customClaims?.device_limit || 3;
  const registeredDevices = userData.devices || [];
  
  if (registeredDevices.includes(deviceId)) return true;
  if (registeredDevices.length < deviceLimit) {
    // Register new device
    await userDoc.ref.update({
      devices: [...registeredDevices, deviceId],
      lastSeen: new Date()
    });
    return true;
  }
  
  return false;
}
```

### 3.2 User Management
```typescript
// triggers/onUserCreate.ts - User Initialization
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const defaultSettings = {
    startOfDay: '06:00',
    startOfWeek: 'monday',
    timezone: 'UTC',
    dataRetention: '1year',
    privacyMode: false,
    createdAt: new Date(),
    lastActive: new Date()
  };
  
  await firestore().collection('users').doc(user.uid).set({
    email: user.email,
    devices: [],
    settings: defaultSettings,
    quota: {
      events: 0,
      buckets: 0,
      queries: 0
    },
    customClaims: {
      device_limit: 3,
      premium: false
    }
  });
});
```

## 4. Cloud Functions Endpoints

### 4.1 Server Info Endpoint
```typescript
// api/info.ts
import { onCall } from 'firebase-functions/v2/https';
import { requireAuth } from '../utils/auth';

export const getServerInfo = onCall(requireAuth(async (data, context, user) => {
  const serverInfo = {
    version: '0.13.0-firebase',
    hostname: 'firebase-cloud',
    testing: false,
    device_id: await getOrCreateDeviceId(user.uid, data.deviceId),
    userId: user.uid,
    features: {
      realtime: true,
      multiDevice: true,
      cloudSync: true,
      analytics: true
    },
    limits: {
      events_per_day: user.customClaims?.premium ? 100000 : 10000,
      buckets_per_user: user.customClaims?.premium ? 50 : 10,
      queries_per_day: user.customClaims?.premium ? 1000 : 100
    }
  };
  
  return serverInfo;
}));

async function getOrCreateDeviceId(userId: string, clientDeviceId?: string): Promise<string> {
  if (clientDeviceId) {
    const canUseDevice = await checkDeviceLimit(userId, clientDeviceId);
    if (canUseDevice) return clientDeviceId;
  }
  
  // Generate new device ID
  const newDeviceId = `firebase-${userId}-${Date.now()}`;
  await checkDeviceLimit(userId, newDeviceId);
  return newDeviceId;
}
```

### 4.2 Bucket Management
```typescript
// api/buckets.ts
import { onCall } from 'firebase-functions/v2/https';
import { firestore } from 'firebase-admin';

export const getBuckets = onCall(requireAuth(async (data, context, user) => {
  const bucketsRef = firestore().collection(`users/${user.uid}/buckets`);
  const snapshot = await bucketsRef.get();
  
  const buckets: Record<string, any> = {};
  
  for (const doc of snapshot.docs) {
    const bucketData = doc.data();
    
    // Get last event for last_updated calculation
    const lastEventQuery = await firestore()
      .collection(`users/${user.uid}/buckets/${doc.id}/events`)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();
    
    if (!lastEventQuery.empty) {
      const lastEvent = lastEventQuery.docs[0].data();
      bucketData.last_updated = new Date(
        new Date(lastEvent.timestamp).getTime() + (lastEvent.duration * 1000)
      ).toISOString();
    }
    
    buckets[doc.id] = bucketData;
  }
  
  return buckets;
}));

export const createBucket = onCall(requireAuth(async (data, context, user) => {
  const { bucketId, type, client, hostname, data: bucketData } = data;
  
  // Check bucket limit
  const bucketsSnapshot = await firestore()
    .collection(`users/${user.uid}/buckets`)
    .get();
  
  const bucketLimit = user.customClaims?.premium ? 50 : 10;
  if (bucketsSnapshot.size >= bucketLimit) {
    throw new HttpsError('resource-exhausted', 'Bucket limit reached');
  }
  
  // Handle !local hostname
  const resolvedHostname = hostname === '!local' ? 'firebase-cloud' : hostname;
  const deviceId = bucketData?.device_id || await getOrCreateDeviceId(user.uid);
  
  const bucketDoc = {
    id: bucketId,
    type,
    client,
    hostname: resolvedHostname,
    device_id: deviceId,
    created: new Date(),
    data: bucketData || {},
    eventCount: 0
  };
  
  await firestore()
    .collection(`users/${user.uid}/buckets`)
    .doc(bucketId)
    .set(bucketDoc);
  
  return { success: true };
}));

export const deleteBucket = onCall(requireAuth(async (data, context, user) => {
  const { bucketId, force } = data;
  
  // Security check - only allow in testing mode or with force flag
  if (!force) {
    throw new HttpsError('permission-denied', 'Bucket deletion requires force flag');
  }
  
  const batch = firestore().batch();
  
  // Delete all events in bucket
  const eventsSnapshot = await firestore()
    .collection(`users/${user.uid}/buckets/${bucketId}/events`)
    .get();
  
  eventsSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  // Delete bucket
  batch.delete(firestore().collection(`users/${user.uid}/buckets`).doc(bucketId));
  
  await batch.commit();
  return { success: true };
}));
```

### 4.3 Event Management
```typescript
// api/events.ts
export const getEvents = onCall(requireAuth(async (data, context, user) => {
  const { bucketId, limit = -1, start, end } = data;
  
  let query = firestore()
    .collection(`users/${user.uid}/buckets/${bucketId}/events`)
    .orderBy('timestamp', 'desc');
  
  if (start) query = query.where('timestamp', '>=', new Date(start));
  if (end) query = query.where('timestamp', '<=', new Date(end));
  if (limit > 0) query = query.limit(limit);
  
  const snapshot = await query.get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp.toDate().toISOString()
  }));
}));

export const createEvents = onCall(requireAuth(async (data, context, user) => {
  const { bucketId, events } = data;
  
  // Validate events array
  const eventsArray = Array.isArray(events) ? events : [events];
  
  // Check daily event limit
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayEventsCount = await firestore()
    .collection(`users/${user.uid}/buckets/${bucketId}/events`)
    .where('timestamp', '>=', today)
    .get()
    .then(snapshot => snapshot.size);
  
  const eventLimit = user.customClaims?.premium ? 100000 : 10000;
  if (todayEventsCount + eventsArray.length > eventLimit) {
    throw new HttpsError('resource-exhausted', 'Daily event limit reached');
  }
  
  const batch = firestore().batch();
  const results = [];
  
  for (const eventData of eventsArray) {
    const eventDoc = {
      timestamp: new Date(eventData.timestamp),
      duration: eventData.duration,
      data: eventData.data || {},
      created: new Date()
    };
    
    const eventRef = firestore()
      .collection(`users/${user.uid}/buckets/${bucketId}/events`)
      .doc();
    
    batch.set(eventRef, eventDoc);
    results.push({ id: eventRef.id, ...eventDoc });
  }
  
  // Update bucket event count
  const bucketRef = firestore()
    .collection(`users/${user.uid}/buckets`)
    .doc(bucketId);
  
  batch.update(bucketRef, {
    eventCount: firestore.FieldValue.increment(eventsArray.length),
    lastUpdated: new Date()
  });
  
  await batch.commit();
  
  return results.length === 1 ? results[0] : results;
}));
```

### 4.4 Heartbeat Processing
```typescript
// api/heartbeat.ts
export const heartbeat = onCall(requireAuth(async (data, context, user) => {
  const { bucketId, event, pulsetime } = data;
  
  if (!pulsetime) {
    throw new HttpsError('invalid-argument', 'pulsetime parameter required');
  }
  
  // Get last event from bucket
  const lastEventQuery = await firestore()
    .collection(`users/${user.uid}/buckets/${bucketId}/events`)
    .orderBy('timestamp', 'desc')
    .limit(1)
    .get();
  
  if (lastEventQuery.empty) {
    // No previous events, create new one
    return await createEvents({ bucketId, events: [event] }, context, user);
  }
  
  const lastEvent = lastEventQuery.docs[0];
  const lastEventData = lastEvent.data();
  const lastEventEnd = new Date(
    lastEventData.timestamp.toDate().getTime() + (lastEventData.duration * 1000)
  );
  
  const newEventStart = new Date(event.timestamp);
  const timeDiff = (newEventStart.getTime() - lastEventEnd.getTime()) / 1000;
  
  // Check if events can be merged
  const canMerge = timeDiff <= pulsetime && 
                   JSON.stringify(lastEventData.data) === JSON.stringify(event.data);
  
  if (canMerge) {
    // Merge events by extending duration
    const newDuration = lastEventData.duration + event.duration + timeDiff;
    
    await lastEvent.ref.update({
      duration: newDuration,
      lastHeartbeat: new Date()
    });
    
    return {
      id: lastEvent.id,
      timestamp: lastEventData.timestamp.toDate().toISOString(),
      duration: newDuration,
      data: lastEventData.data
    };
  } else {
    // Create new event
    return await createEvents({ bucketId, events: [event] }, context, user);
  }
}));
```

### 4.5 Query Engine
```typescript
// api/query.ts - Firebase Query2 Implementation
import { Query2Functions } from '../utils/query2';

export const executeQuery = onCall(requireAuth(async (data, context, user) => {
  const { name, query, timeperiods, cache = true } = data;
  
  // Check daily query limit
  const queryLimit = user.customClaims?.premium ? 1000 : 100;
  const todayQueries = await getUserQueryCount(user.uid);
  
  if (todayQueries >= queryLimit) {
    throw new HttpsError('resource-exhausted', 'Daily query limit reached');
  }
  
  // Check cache first
  if (cache && name) {
    const cached = await getCachedQuery(user.uid, name, query, timeperiods);
    if (cached) return cached;
  }
  
  // Execute query
  const queryEngine = new Query2Functions(user.uid);
  const result = await queryEngine.execute(query, timeperiods);
  
  // Cache result
  if (cache && name) {
    await cacheQuery(user.uid, name, query, timeperiods, result);
  }
  
  // Update query count
  await incrementUserQueryCount(user.uid);
  
  return result;
}));

class Query2Functions {
  constructor(private userId: string) {}
  
  async execute(query: string, timeperiods: any[]): Promise<any> {
    // Parse and execute ActivityWatch query language
    const functions = {
      'query_bucket': this.queryBucket.bind(this),
      'filter_keyvals': this.filterKeyvals.bind(this),
      'merge_events_by_keys': this.mergeEventsByKeys.bind(this),
      'chunk_events_by_key': this.chunkEventsByKey.bind(this),
      'categorize': this.categorize.bind(this),
      'sort_by_duration': this.sortByDuration.bind(this),
      'limit_events': this.limitEvents.bind(this),
      'sum_durations': this.sumDurations.bind(this)
    };
    
    // Execute query (simplified implementation)
    return await this.parseAndExecute(query, timeperiods, functions);
  }
  
  private async queryBucket(bucketId: string, timeperiod?: any): Promise<any[]> {
    let query = firestore()
      .collection(`users/${this.userId}/buckets/${bucketId}/events`)
      .orderBy('timestamp', 'desc');
    
    if (timeperiod) {
      const start = new Date(timeperiod.start);
      const end = new Date(timeperiod.end || timeperiod.start);
      query = query.where('timestamp', '>=', start).where('timestamp', '<=', end);
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      timestamp: doc.data().timestamp.toDate().toISOString(),
      duration: doc.data().duration,
      data: doc.data().data
    }));
  }
  
  // Implement other query functions...
}
```

## 5. Real-time Features

### 5.1 Firestore Triggers
```typescript
// triggers/onEventCreate.ts - Real-time Data Processing
export const onEventCreate = functions.firestore
  .document('users/{userId}/buckets/{bucketId}/events/{eventId}')
  .onCreate(async (snapshot, context) => {
    const { userId, bucketId, eventId } = context.params;
    const eventData = snapshot.data();
    
    // Real-time aggregation
    await updateRealTimeAggregations(userId, bucketId, eventData);
    
    // Trigger notifications if needed
    await checkNotificationTriggers(userId, bucketId, eventData);
    
    // Update bucket statistics
    await updateBucketStats(userId, bucketId);
  });

async function updateRealTimeAggregations(userId: string, bucketId: string, eventData: any) {
  const today = new Date().toISOString().split('T')[0];
  const hour = new Date().getHours();
  
  const aggregationRef = firestore()
    .collection(`users/${userId}/aggregations`)
    .doc(`${today}-hourly`);
  
  await aggregationRef.set({
    [`buckets.${bucketId}.hours.${hour}.duration`]: firestore.FieldValue.increment(eventData.duration),
    [`buckets.${bucketId}.hours.${hour}.count`]: firestore.FieldValue.increment(1),
    lastUpdated: new Date()
  }, { merge: true });
}
```

### 5.2 WebSocket Alternative
```typescript
// Real-time subscriptions using Firestore listeners
// Client-side implementation

class FirebaseRealtimeClient {
  private unsubscribers: Array<() => void> = [];
  
  subscribeToEvents(bucketId: string, callback: (events: any[]) => void) {
    const unsubscribe = firestore()
      .collection(`users/${currentUser.uid}/buckets/${bucketId}/events`)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .onSnapshot(snapshot => {
        const events = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(events);
      });
    
    this.unsubscribers.push(unsubscribe);
    return unsubscribe;
  }
  
  subscribeToAggregations(callback: (data: any) => void) {
    const today = new Date().toISOString().split('T')[0];
    
    const unsubscribe = firestore()
      .collection(`users/${currentUser.uid}/aggregations`)
      .doc(`${today}-hourly`)
      .onSnapshot(doc => {
        if (doc.exists) {
          callback(doc.data());
        }
      });
    
    this.unsubscribers.push(unsubscribe);
    return unsubscribe;
  }
  
  cleanup() {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }
}
```

## 6. Performance Optimization

### 6.1 Caching Strategy
```typescript
// utils/cache.ts - Multi-level Caching
import { createHash } from 'crypto';

class FirebaseCache {
  // Memory cache for function instances
  private memoryCache = new Map<string, { data: any; expiry: number }>();
  
  // Firestore cache for persistent storage
  async get(key: string): Promise<any | null> {
    // Check memory cache first
    const memoryResult = this.memoryCache.get(key);
    if (memoryResult && memoryResult.expiry > Date.now()) {
      return memoryResult.data;
    }
    
    // Check Firestore cache
    const cacheDoc = await firestore()
      .collection('cache')
      .doc(this.hashKey(key))
      .get();
    
    if (cacheDoc.exists) {
      const cacheData = cacheDoc.data()!;
      if (cacheData.expiry > Date.now()) {
        // Update memory cache
        this.memoryCache.set(key, cacheData);
        return cacheData.data;
      }
    }
    
    return null;
  }
  
  async set(key: string, data: any, ttlSeconds: number = 3600): Promise<void> {
    const expiry = Date.now() + (ttlSeconds * 1000);
    const cacheItem = { data, expiry };
    
    // Set memory cache
    this.memoryCache.set(key, cacheItem);
    
    // Set Firestore cache
    await firestore()
      .collection('cache')
      .doc(this.hashKey(key))
      .set(cacheItem);
  }
  
  private hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }
}

// Query result caching
async function getCachedQuery(userId: string, name: string, query: string, timeperiods: any[]): Promise<any | null> {
  const cache = new FirebaseCache();
  const cacheKey = `query:${userId}:${name}:${createHash('md5').update(JSON.stringify({ query, timeperiods })).digest('hex')}`;
  return cache.get(cacheKey);
}
```

### 6.2 Database Optimization
```typescript
// Firestore Indexes & Composite Queries
const firestoreIndexes = {
  // User events with timestamp filtering
  'users/{userId}/buckets/{bucketId}/events': [
    { fields: ['timestamp', 'duration'], mode: 'DESCENDING' },
    { fields: ['timestamp', 'data.app'], mode: 'DESCENDING' },
    { fields: ['timestamp', 'data.title'], mode: 'DESCENDING' }
  ],
  
  // Aggregations for analytics
  'users/{userId}/aggregations': [
    { fields: ['date', 'type'], mode: 'ASCENDING' }
  ],
  
  // Query cache
  'cache': [
    { fields: ['expiry'], mode: 'ASCENDING' }
  ]
};

// Batch operations for better performance
async function batchInsertEvents(userId: string, bucketId: string, events: any[]) {
  const batchSize = 500; // Firestore batch limit
  const batches = [];
  
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = firestore().batch();
    const batchEvents = events.slice(i, i + batchSize);
    
    batchEvents.forEach(event => {
      const eventRef = firestore()
        .collection(`users/${userId}/buckets/${bucketId}/events`)
        .doc();
      batch.set(eventRef, event);
    });
    
    batches.push(batch.commit());
  }
  
  await Promise.all(batches);
}
```

## 7. WebUI Integration

### 7.1 Firebase Hosting Configuration
```json
// firebase.json - Hosting Configuration
{
  "hosting": {
    "public": "aw-webui/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/api/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### 7.2 WebUI Firebase Integration
```typescript
// src/util/firebase-client.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  // Firebase configuration
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const functions = getFunctions(app);

// ActivityWatch Client Firebase Adapter
export class FirebaseAWClient {
  private auth = auth;
  private functions = functions;
  
  async getServerInfo() {
    const callable = httpsCallable(this.functions, 'getServerInfo');
    const result = await callable({ deviceId: this.getDeviceId() });
    return result.data;
  }
  
  async getBuckets() {
    const callable = httpsCallable(this.functions, 'getBuckets');
    const result = await callable({});
    return result.data;
  }
  
  async createBucket(bucketId: string, type: string, client: string, hostname: string = 'firebase-web') {
    const callable = httpsCallable(this.functions, 'createBucket');
    return callable({ bucketId, type, client, hostname });
  }
  
  async heartbeat(bucketId: string, event: any, pulsetime: number) {
    const callable = httpsCallable(this.functions, 'heartbeat');
    return callable({ bucketId, event, pulsetime });
  }
  
  async query(query: string, timeperiods: any[], name?: string) {
    const callable = httpsCallable(this.functions, 'executeQuery');
    return callable({ query, timeperiods, name, cache: true });
  }
  
  private getDeviceId(): string {
    let deviceId = localStorage.getItem('aw-device-id');
    if (!deviceId) {
      deviceId = `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('aw-device-id', deviceId);
    }
    return deviceId;
  }
}
```

## 8. Migration Strategy

### 8.1 Local to Firebase Migration Tool
```python
# migration/migrate_to_firebase.py
import json
import requests
from datetime import datetime
from firebase_admin import initialize_app, firestore, auth

class AWFirebaseMigrator:
    def __init__(self, local_server_url='http://localhost:5600', firebase_creds_path='serviceAccount.json'):
        self.local_url = local_server_url
        
        # Initialize Firebase
        initialize_app(credential=firebase_creds_path)
        self.db = firestore.client()
        
    def migrate_user_data(self, local_data_path: str, firebase_user_id: str):
        """Migrate exported ActivityWatch data to Firebase"""
        
        # Load local export
        with open(local_data_path, 'r') as f:
            local_data = json.load(f)
        
        print(f"Migrating {len(local_data)} buckets for user {firebase_user_id}")
        
        for bucket_id, bucket_data in local_data.items():
            print(f"Migrating bucket: {bucket_id}")
            
            # Create bucket in Firebase
            bucket_ref = self.db.collection(f'users/{firebase_user_id}/buckets').document(bucket_id)
            bucket_ref.set({
                'id': bucket_id,
                'type': bucket_data['type'],
                'client': bucket_data['client'],
                'hostname': bucket_data['hostname'],
                'created': bucket_data['created'],
                'data': bucket_data.get('data', {}),
                'migrated': True,
                'migration_date': datetime.now()
            })
            
            # Migrate events in batches
            events = bucket_data.get('events', [])
            batch_size = 500
            
            for i in range(0, len(events), batch_size):
                batch = self.db.batch()
                batch_events = events[i:i + batch_size]
                
                for event in batch_events:
                    event_ref = self.db.collection(f'users/{firebase_user_id}/buckets/{bucket_id}/events').document()
                    
                    # Convert timestamp to Firebase Timestamp
                    if isinstance(event['timestamp'], str):
                        event['timestamp'] = datetime.fromisoformat(event['timestamp'].replace('Z', '+00:00'))
                    
                    batch.set(event_ref, {
                        'timestamp': event['timestamp'],
                        'duration': event['duration'],
                        'data': event.get('data', {}),
                        'migrated': True
                    })
                
                batch.commit()
                print(f"  Migrated batch {i//batch_size + 1}/{(len(events) + batch_size - 1)//batch_size}")
        
        print("Migration completed successfully!")
    
    def create_firebase_user(self, email: str, password: str = None) -> str:
        """Create Firebase user account for migration"""
        user_record = auth.create_user(
            email=email,
            password=password or f"temp_{datetime.now().strftime('%Y%m%d')}",
            email_verified=True
        )
        
        print(f"Created Firebase user: {user_record.uid}")
        return user_record.uid
```

### 8.2 Gradual Migration Approach
```typescript
// Hybrid client supporting both local and Firebase backends
class HybridAWClient {
  constructor(
    private localUrl: string = 'http://localhost:5600',
    private useFirebase: boolean = false
  ) {}
  
  async migrate() {
    // Export data from local server
    const localData = await this.exportFromLocal();
    
    // Import to Firebase
    await this.importToFirebase(localData);
    
    // Switch to Firebase mode
    this.useFirebase = true;
  }
  
  async getBuckets() {
    if (this.useFirebase) {
      return this.firebaseClient.getBuckets();
    } else {
      return this.localClient.getBuckets();
    }
  }
  
  // Implement other methods with fallback logic...
}
```

## 9. Monitoring & Analytics

### 9.1 Firebase Analytics Integration
```typescript
// analytics/usage-tracking.ts
import { getAnalytics, logEvent } from 'firebase/analytics';

const analytics = getAnalytics();

export function trackAPIUsage(endpoint: string, userId: string, duration: number) {
  logEvent(analytics, 'api_call', {
    endpoint,
    user_id: userId,
    duration_ms: duration
  });
}

export function trackQueryExecution(queryType: string, complexity: number, duration: number) {
  logEvent(analytics, 'query_execution', {
    query_type: queryType,
    complexity_score: complexity,
    execution_time_ms: duration
  });
}

// Firebase Functions analytics
export const analyticsProcessor = functions.analytics.event('api_call').onLog(async (event) => {
  const { user_id, endpoint, duration_ms } = event.params;
  
  // Store usage statistics
  await firestore()
    .collection('analytics')
    .doc('daily_usage')
    .set({
      [`${new Date().toISOString().split('T')[0]}.${endpoint}.calls`]: firestore.FieldValue.increment(1),
      [`${new Date().toISOString().split('T')[0]}.${endpoint}.total_duration`]: firestore.FieldValue.increment(duration_ms)
    }, { merge: true });
});
```

### 9.2 Performance Monitoring
```typescript
// monitoring/performance.ts
export function monitorFunctionPerformance(functionName: string) {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      
      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - startTime;
        
        // Log performance metrics
        await firestore()
          .collection('monitoring')
          .doc('performance')
          .set({
            [`${functionName}.${propertyName}.last_duration`]: duration,
            [`${functionName}.${propertyName}.avg_duration`]: firestore.FieldValue.increment(duration / 100), // Simple moving average
            [`${functionName}.${propertyName}.call_count`]: firestore.FieldValue.increment(1),
            [`${functionName}.${propertyName}.last_call`]: new Date()
          }, { merge: true });
        
        return result;
      } catch (error) {
        // Log errors
        await firestore()
          .collection('monitoring')
          .doc('errors')
          .set({
            [`${functionName}.${propertyName}.error_count`]: firestore.FieldValue.increment(1),
            [`${functionName}.${propertyName}.last_error`]: {
              message: error.message,
              timestamp: new Date()
            }
          }, { merge: true });
        
        throw error;
      }
    };
  };
}
```

## 10. Deployment & DevOps

### 10.1 Firebase Project Configuration
```bash
# deployment/setup-firebase.sh
#!/bin/bash

# Initialize Firebase project
firebase init functions hosting firestore

# Set up environment variables
firebase functions:config:set \
  app.environment="production" \
  app.version="0.13.0-firebase" \
  limits.premium_events_per_day="100000" \
  limits.free_events_per_day="10000"

# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Deploy Cloud Functions
firebase deploy --only functions

# Deploy Hosting
firebase deploy --only hosting

# Set up custom domain
firebase hosting:channel:create live
firebase hosting:channel:deploy live --expires 30d
```

### 10.2 CI/CD Pipeline
```yaml
# .github/workflows/firebase-deploy.yml
name: Deploy to Firebase

on:
  push:
    branches: [firebase-integration]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd functions && npm ci
          cd ../aw-webui && npm ci
          
      - name: Build WebUI
        run: |
          cd aw-webui
          npm run build
          
      - name: Run tests
        run: |
          cd functions && npm test
          
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: activitywatch-firebase
          channelId: live
```

## 11. Sonuç

Bu Firebase entegrasyonu ile aw-server:

1. **Scalable Cloud Architecture**: Firebase Cloud Functions ile otomatik ölçeklendirme
2. **Real-time Capabilities**: Firestore listeners ile gerçek zamanlı veri senkronizasyonu  
3. **Authentication & Security**: Firebase Auth ile güvenli kullanıcı yönetimi
4. **Multi-device Support**: Cross-device data synchronization
5. **Performance Optimization**: Multi-level caching ve database indexing
6. **Analytics & Monitoring**: Built-in usage tracking ve performance monitoring
7. **Global CDN**: Firebase Hosting ile dünya çapında hızlı erişim
8. **Cost Optimization**: Pay-per-use pricing model

Firebase entegrasyonu ActivityWatch'u modern, scalable, real-time bir platform haline getirir. 