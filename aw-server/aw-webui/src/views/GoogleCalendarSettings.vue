<template lang="pug">
div.google-calendar-settings
  h3 Google Takvim Entegrasyonu

  b-alert(variant="info" show)
    | Google Takvim entegrasyonu ile ActivityWatch verilerinizi zenginleştirebilir ve takvim etkinliklerinizi ActivityWatch aktiviteleriyle ilişkilendirebilirsiniz.

  b-card.mt-3
    h5 Google Hesabı Bağla
    p
      | Google Takvim etkinliklerinizi senkronize etmek için Google hesabınızı bağlayın.
    b-button(variant="primary" @click="connectGoogleAccount" :disabled="connecting")
      span(v-if="connecting") Bağlanılıyor...
      span(v-else) Google Hesabını Bağla

    div(v-if="connectionStatus")
      p.mt-3 {{ connectionStatus }}
      b-alert(v-if="connectionError" show variant="danger") {{ connectionError }}

  b-card.mt-3(v-if="isConnected")
    h5 Takvimleri Yönet
    b-form-group(label="Senkronize Edilecek Takvimler" label-for="calendar-select")
      b-form-checkbox-group(id="calendar-select" v-model="selectedCalendars" :options="availableCalendars" stacked)

    b-button(variant="success" @click="saveSettings" :disabled="saving")
      span(v-if="saving") Ayarlar Kaydediliyor...
      span(v-else) Ayarları Kaydet

  b-alert(v-if="error" show variant="danger" class="mt-3")
    | {{ error }}

</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { httpsCallable } from 'firebase/functions';
import { functions } from '~/firebase';

interface Calendar {
  id: string;
  summary: string;
  primary?: boolean;
}

const connecting = ref(false);
const isConnected = ref(false);
const connectionStatus = ref<string | null>(null);
const connectionError = ref<string | null>(null);
const availableCalendars = ref<{ text: string; value: string }[]>([]);
const selectedCalendars = ref<string[]>([]);
const saving = ref(false);
const error = ref<string | null>(null);

// Firebase Cloud Functions çağrıları
const listGoogleCalendarsCallable = httpsCallable(functions, 'listGoogleCalendars');

const connectGoogleAccount = async () => {
  connecting.value = true;
  connectionStatus.value = null;
  connectionError.value = null;
  error.value = null;

  try {
    // TODO: Google OAuth akışını başlatmak için bir backend fonksiyonu çağrısı
    // Geçici olarak, başarılı olduğunu varsayalım ve takvimleri listeleyelim.
    connectionStatus.value = 'Google hesabınız başarıyla bağlandı!';
    isConnected.value = true;
    await fetchCalendars();
  } catch (err: any) {
    console.error('Google hesabını bağlarken hata oluştu:', err);
    connectionError.value = err.message || 'Google hesabını bağlarken bir hata oluştu.';
  } finally {
    connecting.value = false;
  }
};

const fetchCalendars = async () => {
  try {
    const result = await listGoogleCalendarsCallable();
    const calendars = (result.data as any).calendars as Calendar[];
    availableCalendars.value = calendars.map(cal => ({
      text: cal.summary + (cal.primary ? ' (Birincil)' : ''),
      value: cal.id,
    }));
    // Başlangıçta birincil takvimi seç
    const primaryCal = calendars.find(cal => cal.primary);
    if (primaryCal) {
      selectedCalendars.value = [primaryCal.id];
    }
  } catch (err: any) {
    console.error('Takvimler çekilirken hata oluştu:', err);
    error.value = err.message || 'Takvimler yüklenemedi.';
  }
};

const saveSettings = async () => {
  saving.value = true;
  error.value = null;
  try {
    // TODO: Seçilen takvimleri ve senkronizasyon ayarlarını kaydetmek için backend fonksiyonu çağrısı
    // Bu, Firestore'da kullanıcının ayarlarını güncellemek anlamına gelebilir.
    connectionStatus.value = 'Ayarlar başarıyla kaydedildi!';
  } catch (err: any) {
    console.error('Ayarlar kaydedilirken hata oluştu:', err);
    error.value = err.message || 'Ayarlar kaydedilirken bir hata oluştu.';
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  // Sayfa yüklendiğinde bağlantı durumunu kontrol et ve takvimleri çek
  // TODO: Gerçek bir bağlantı durumu kontrolü ekleyin
  isConnected.value = false; // Başlangıçta bağlı değil olarak varsayalım
  // Eğer kullanıcı daha önce bağlandıysa, fetchCalendars() doğrudan çağrılabilir
  // fetchCalendars();
});
</script>

<style scoped lang="scss">
.google-calendar-settings {
  padding: 20px;
}
</style> 