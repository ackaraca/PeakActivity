import hashlib

class Anonymizer:
    def __init__(self, config=None):
        # Anonimleştirme yapılandırması (örneğin, hangi alanların anonimleştirileceği)
        self.config = config if config is not None else {}

    def anonymize_event(self, event_data):
        anonymized_data = event_data.copy()
        
        # Varsayılan olarak başlık ve uygulama adını hash'le
        if 'title' in anonymized_data:
            anonymized_data['title'] = self._hash_data(anonymized_data['title'])
        if 'app' in anonymized_data:
            anonymized_data['app'] = self._hash_data(anonymized_data['app'])

        # Gelecekteki genişletmeler için: yapılandırmaya göre diğer alanları anonimleştir
        # for field, method in self.config.items():
        #     if field in anonymized_data:
        #         if method == 'hash':
        #             anonymized_data[field] = self._hash_data(anonymized_data[field])
        #         elif method == 'mask':
        #             anonymized_data[field] = self._mask_data(anonymized_data[field])
        
        return anonymized_data

    def _hash_data(self, data):
        if isinstance(data, str):
            return hashlib.sha256(data.encode()).hexdigest()
        return data

    # Gelecekteki maskeleme yöntemleri için yer tutucu
    # def _mask_data(self, data):
    #     return "[MASKED]" 