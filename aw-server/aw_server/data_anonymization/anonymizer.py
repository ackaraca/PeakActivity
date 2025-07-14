import hashlib

class Anonymizer:
    def __init__(self, config=None):
        # Anonimleştirme yapılandırması (örneğin, hangi alanların hangi yöntemle anonimleştirileceği)
        # Örnek config: {'title': 'hash', 'app': 'mask', 'url': 'hash'}
        self.config = config if config is not None else {
            'title': 'hash',
            'app': 'hash'
        }

    def anonymize_event(self, event_data):
        anonymized_data = event_data.copy()
        
        for field, method in self.config.items():
            if field in anonymized_data:
                if method == 'hash':
                    anonymized_data[field] = self._hash_data(anonymized_data[field])
                elif method == 'mask':
                    anonymized_data[field] = self._mask_data(anonymized_data[field])
                # Gelecekteki diğer anonimleştirme yöntemleri buraya eklenebilir
        
        return anonymized_data

    def _hash_data(self, data):
        if isinstance(data, str):
            return hashlib.sha256(data.encode()).hexdigest()
        return data

    def _mask_data(self, data):
        # Basit maskeleme: tüm veriyi [MASKED] ile değiştir
        if isinstance(data, str):
            return "[MASKED]"
        return data 