from datetime import datetime
from typing import Any, Dict, List, Optional

from aw_core.models import Event
from aw_datastore.storages.abstract import Storage, EventDB
from aw_server.data_anonymization.anonymizer import Anonymizer # Anonymizer sınıfını içe aktar

from .__init__ import db as firestore_db
# import hashlib # Yeni eklenen import kaldırıldı

class FirestoreEventDB(EventDB):
    def __init__(self, user_id: str, bucket_id: str, anonymize_data: bool = False):
        self.user_id = user_id
        self.bucket_id = bucket_id
        self.collection_ref = firestore_db.collection(u'users').document(user_id).collection(u'buckets').document(bucket_id).collection(u'events')
        self.anonymize_data = anonymize_data # anonymize_data eklendi
        self.anonymizer = Anonymizer() # Anonymizer örneği oluşturuldu

    def get(self, limit: int = -1, start: Optional[datetime] = None, end: Optional[datetime] = None) -> List[Event]:
        query = self.collection_ref.order_by(u'timestamp')
        if start:
            query = query.where(u'timestamp', u'>=', start)
        if end:
            query = query.where(u'timestamp', u'<', end)
        if limit != -1:
            query = query.limit(limit)
        
        docs = query.stream()
        events = []
        for doc in docs:
            data = doc.to_dict()
            # Firestore'dan gelen timestamp'i datetime objesine çevir
            if 'timestamp' in data and hasattr(data['timestamp'], 'replace'):
                data['timestamp'] = data['timestamp'].replace(tzinfo=None) # remove timezone info
            events.append(Event(**data))
        return events

    def get_by_id(self, event_id: int) -> Optional[Event]:
        doc_ref = self.collection_ref.document(str(event_id))
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            if 'timestamp' in data and hasattr(data['timestamp'], 'replace'):
                data['timestamp'] = data['timestamp'].replace(tzinfo=None)
            return Event(**data)
        return None

    def insert(self, events: List[Event]) -> Optional[Event]:
        batch = firestore_db.batch()
        inserted_event = None
        for event in events:
            doc_ref = self.collection_ref.document(str(event.id))
            event_dict = event.to_json_dict()
            # Firestore'a kaydetmeden önce datetime objesini timestamp'e çevir
            if 'timestamp' in event_dict and isinstance(event_dict['timestamp'], datetime):
                event_dict['timestamp'] = event_dict['timestamp'].isoformat()

            # İsteğe bağlı veri anonimleştirme
            if self.anonymize_data:
                event_dict = self.anonymizer.anonymize_event(event_dict)
                # Eski anonimleştirme mantığı kaldırıldı
                # if 'title' in event_dict:
                #     event_dict['title'] = '[Anonimleştirilmiş Başlık]'
                # if 'app' in event_dict:
                #     event_dict['app'] = '[Anonimleştirilmiş Uygulama]'
                # Daha gelişmiş anonimleştirme (örn. hashleme)
                # if 'title' in event_dict:
                #     event_dict['title'] = hashlib.sha256(event_dict['title'].encode()).hexdigest()
                # if 'app' in event_dict:
                #     event_dict['app'] = hashlib.sha256(event_dict['app'].encode()).hexdigest()

            batch.set(doc_ref, event_dict)
            inserted_event = event
        batch.commit()
        return inserted_event

    def delete(self, event_id: int) -> bool:
        doc_ref = self.collection_ref.document(str(event_id))
        doc_ref.delete()
        return True

    def replace_last(self, event: Event) -> None:
        # Firestore'da 'last' kavramı yok, bu yüzden mevcut belgeyi güncelleyeceğiz
        # Bunun için son olayı alıp onun ID'sini kullanmamız gerekir.
        # Daha sağlam bir çözüm için event.id'yi kullanabiliriz.
        doc_ref = self.collection_ref.document(str(event.id))
        event_dict = event.to_json_dict()
        if 'timestamp' in event_dict and isinstance(event_dict['timestamp'], datetime):
            event_dict['timestamp'] = event_dict['timestamp'].isoformat()

        # İsteğe bağlı veri anonimleştirme
        if self.anonymize_data:
            event_dict = self.anonymizer.anonymize_event(event_dict)
            # Eski anonimleştirme mantığı kaldırıldı
            # if 'title' in event_dict:
            #     event_dict['title'] = '[Anonimleştirilmiş Başlık]'
            # if 'app' in event_dict:
            #     event_dict['app'] = '[Anonimleştirilmiş Uygulama]'
            # Daha gelişmiş anonimleştirme (örn. hashleme)
            # if 'title' in event_dict:
            #     event_dict['title'] = hashlib.sha256(event_dict['title'].encode()).hexdigest()
            # if 'app' in event_dict:
            #     event_dict['app'] = hashlib.sha256(event_dict['app'].encode()).hexdigest()

        doc_ref.set(event_dict)

    def get_eventcount(self, start: Optional[datetime] = None, end: Optional[datetime] = None) -> int:
        # Firestore'un yerel aggregation sorgusunu kullanarak event sayısını al
        query = self.collection_ref
        if start:
            query = query.where(u'timestamp', u'>=', start)
        if end:
            query = query.where(u'timestamp', u'<', end)
        
        # aggregation modülünü import et
        from google.cloud.firestore_v1 import aggregation

        aggregate_query = aggregation.AggregationQuery(query)
        aggregate_query.count(alias="total_events")

        results = aggregate_query.get()
        for result in results:
            if result[0].alias == "total_events":
                return result[0].value
        return 0

class FirestoreStorage(Storage):
    def __init__(self, user_id: str, testing: bool = False, anonymize_data: bool = False):
        super().__init__(testing)
        self.user_id = user_id
        self.buckets_collection_ref = firestore_db.collection(u'users').document(user_id).collection(u'buckets')
        self.anonymize_data = anonymize_data # anonymize_data eklendi

    def buckets(self) -> Dict[str, Dict[str, Any]]:
        docs = self.buckets_collection_ref.stream()
        _buckets = {}
        for doc in docs:
            _buckets[doc.id] = doc.to_dict()
        return _buckets

    def create_bucket(self, bucket_id: str, type: str, client: str, hostname: str, created: datetime, data: Optional[Dict[str, Any]] = None) -> None:
        bucket_data = {
            u'type': type,
            u'client': client,
            u'hostname': hostname,
            u'created': created,
            u'data': data if data is not None else {},
            u'last_updated': datetime.now() # Yeni eklenen alan
        }
        self.buckets_collection_ref.document(bucket_id).set(bucket_data)

    def update_bucket(self, bucket_id: str, type: Optional[str] = None, client: Optional[str] = None, hostname: Optional[str] = None, data: Optional[Dict[str, Any]] = None) -> None:
        updates = {}
        if type is not None:
            updates[u'type'] = type
        if client is not None:
            updates[u'client'] = client
        if hostname is not None:
            updates[u'hostname'] = hostname
        if data is not None:
            updates[u'data'] = data
        updates[u'last_updated'] = datetime.now() # Güncelleme zamanı
        self.buckets_collection_ref.document(bucket_id).update(updates)

    def delete_bucket(self, bucket_id: str) -> None:
        self.buckets_collection_ref.document(bucket_id).delete()

    def __getitem__(self, bucket_id: str) -> FirestoreEventDB:
        return FirestoreEventDB(self.user_id, bucket_id, self.anonymize_data) 