<template>
  <div class="reports-container">
    <h2>Raporlama ve Analiz Gösterge Tablosu</h2>

    <!-- Yeni Rapor Ekle Formu -->
    <div class="add-report-section">
      <h3>Yeni Rapor/Gösterge Tablosu Ekle</h3>
      <form @submit.prevent="addReport">
        <div class="form-group">
          <label for="reportName">Rapor Adı:</label>
          <input type="text" id="reportName" v-model="newReport.name" required>
        </div>
        <div class="form-group">
          <label for="reportDescription">Açıklama:</label>
          <textarea id="reportDescription" v-model="newReport.description"></textarea>
        </div>
        <div class="form-group">
          <label for="reportType">Rapor Türü:</label>
          <select id="reportType" v-model="newReport.type" required>
            <option value="">Seçiniz</option>
            <option value="daily_summary">Günlük Özet</option>
            <option value="weekly_activity">Haftalık Aktivite</option>
            <option value="category_breakdown">Kategori Dağılımı</option>
            <option value="custom">Özel</option>
          </select>
        </div>
        <div class="form-group">
          <label for="reportConfig">Konfigürasyon (JSON):</label>
          <textarea id="reportConfig" v-model="newReport.configuration" required rows="10"></textarea>
          <small>Örn: `{"chart_type": "bar", "data_source": "activities", "filters": {"date_range": "last_7_days"}}`</small>
        </div>
        <button type="submit" class="btn btn-primary">Rapor Ekle</button>
      </form>
    </div>

    <!-- Mevcut Raporlar Listesi -->
    <div class="reports-list-section">
      <h3>Mevcut Raporlar ve Gösterge Tabloları</h3>
      <p v-if="loading">Raporlar yükleniyor...</p>
      <p v-if="error" class="error-message">{{ error }}</p>
      <ul v-if="reports.length">
        <li v-for="report in reports" :key="report.id" class="report-item">
          <div v-if="editingReportId !== report.id">
            <h4>{{ report.name }}</h4>
            <p><strong>Açıklama:</strong> {{ report.description || 'Yok' }}</p>
            <p><strong>Tür:</strong> {{ report.type }}</p>
            <p><strong>Konfigürasyon:</strong> <pre>{{ JSON.stringify(report.configuration, null, 2) }}</pre></p>
            <div v-if="report.generated_data" class="generated-data-preview">
              <h5>Oluşturulan Veri Önizlemesi:</h5>
              <pre>{{ JSON.stringify(report.generated_data, null, 2) }}</pre>
            </div>
            <button @click="startEdit(report)" class="btn btn-secondary">Düzenle</button>
            <button @click="generateData(report.id)" class="btn btn-info">Veri Oluştur</button>
            <button @click="deleteReport(report.id)" class="btn btn-danger">Sil</button>
          </div>
          <div v-else class="edit-form">
            <h4>Raporu Düzenle: {{ editingReport.name }}</h4>
            <div class="form-group">
              <label for="editReportName">Ad:</label>
              <input type="text" id="editReportName" v-model="editingReport.name" required>
            </div>
            <div class="form-group">
              <label for="editReportDescription">Açıklama:</label>
              <textarea id="editReportDescription" v-model="editingReport.description"></textarea>
            </div>
            <div class="form-group">
              <label for="editReportType">Tür:</label>
              <select id="editReportType" v-model="editingReport.type" required>
                <option value="">Seçiniz</option>
                <option value="daily_summary">Günlük Özet</option>
                <option value="weekly_activity">Haftalık Aktivite</option>
                <option value="category_breakdown">Kategori Dağılımı</option>
                <option value="custom">Özel</option>
              </select>
            </div>
            <div class="form-group">
              <label for="editReportConfig">Konfigürasyon (JSON):</label>
              <textarea id="editReportConfig" v-model="editingReport.configuration" required rows="10"></textarea>
            </div>
            <button @click="updateReport" class="btn btn-primary">Güncelle</button>
            <button @click="cancelEdit" class="btn btn-secondary">İptal</button>
          </div>
        </li>
      </ul>
      <p v-else-if="!loading && !error">Henüz hiç rapor veya gösterge tablonuz yok.</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { useAuthStore } from '../stores/auth';

export default defineComponent({
  name: 'Reports',
  data() {
    return {
      reports: [] as any[],
      loading: true,
      error: null as string | null,
      newReport: {
        name: '',
        description: '',
        type: '',
        configuration: '',
      } as any,
      editingReportId: null as string | null,
      editingReport: {
        id: '',
        name: '',
        description: '',
        type: '',
        configuration: '',
        generated_data: null,
      } as any,
      functionsInstance: functions,
      authStore: useAuthStore(),
    };
  },
  methods: {
    async fetchReports() {
      if (!this.authStore.user) {
        this.reports = [];
        this.loading = false;
        return;
      }

      this.loading = true;
      this.error = null;
      try {
        const listReportsCallable = httpsCallable(this.functionsInstance, 'listReports');
        const response = await listReportsCallable();
        if (response.data.success) {
          this.reports = response.data.reports;
        } else {
          this.error = response.data.message || 'Raporlar yüklenirken bir hata oluştu.';
        }
      } catch (err: any) {
        console.error('Raporlar getirilirken hata:', err);
        this.error = `Raporlar yüklenirken bir hata oluştu: ${err.message}`;
      } finally {
        this.loading = false;
      }
    },
    async addReport() {
      if (!this.authStore.user) {
        alert('Rapor eklemek için giriş yapmalısınız.');
        return;
      }
      if (!this.newReport.name || !this.newReport.type || !this.newReport.configuration) {
        alert('Lütfen tüm zorunlu alanları doldurun: Ad, Tür, Konfigürasyon.');
        return;
      }

      try {
        const createReportCallable = httpsCallable(this.functionsInstance, 'createReport');
        const reportDataToSend = {
          ...this.newReport,
          configuration: JSON.parse(this.newReport.configuration), // JSON stringini objeye çevir
        };
        const response = await createReportCallable(reportDataToSend);
        if (response.data.success) {
          alert('Rapor başarıyla eklendi!');
          // Formu temizle
          this.newReport.name = '';
          this.newReport.description = '';
          this.newReport.type = '';
          this.newReport.configuration = '';
          this.fetchReports(); // Raporları yeniden yükle
        } else {
          alert(`Rapor eklenirken hata oluştu: ${response.data.message}`);
        }
      } catch (err: any) {
        console.error('Rapor eklenirken hata:', err);
        alert(`Rapor eklenirken hata oluştu: ${err.message}`);
      }
    },
    startEdit(report: any) {
      this.editingReportId = report.id;
      this.editingReport = { ...report }; // Tüm rapor özelliklerini kopyala
      this.editingReport.configuration = JSON.stringify(report.configuration, null, 2); // JSON string olarak göster
    },
    async updateReport() {
      if (!this.authStore.user) {
        alert('Raporu güncellemek için giriş yapmalısınız.');
        return;
      }
      if (!this.editingReport.name || !this.editingReport.type || !this.editingReport.configuration) {
        alert('Lütfen tüm zorunlu alanları doldurun: Ad, Tür, Konfigürasyon.');
        return;
      }

      try {
        const updateReportCallable = httpsCallable(this.functionsInstance, 'updateReport');
        const updatesToSend = {
          ...this.editingReport,
          configuration: JSON.parse(this.editingReport.configuration), // JSON stringini objeye çevir
        };
        const response = await updateReportCallable({ reportId: this.editingReport.id, updates: updatesToSend });
        if (response.data.success) {
          alert('Rapor başarıyla güncellendi!');
          this.cancelEdit();
          this.fetchReports();
        } else {
          alert(`Rapor güncellenirken hata oluştu: ${response.data.message}`);
        }
      } catch (err: any) {
        console.error('Rapor güncellenirken hata:', err);
        alert(`Rapor güncellenirken hata oluştu: ${err.message}`);
      }
    },
    cancelEdit() {
      this.editingReportId = null;
      // Düzenleme formunu temizle
      this.editingReport = {
        id: '',
        name: '',
        description: '',
        type: '',
        configuration: '',
        generated_data: null,
      };
    },
    async deleteReport(reportId: string) {
      if (!this.authStore.user) {
        alert('Raporu silmek için giriş yapmalısınız.');
        return;
      }
      if (confirm('Bu raporu silmek istediğinizden emin misiniz?')) {
        try {
          const deleteReportCallable = httpsCallable(this.functionsInstance, 'deleteReport');
          const response = await deleteReportCallable({ reportId });
          if (response.data.success) {
            alert('Rapor başarıyla silindi!');
            this.fetchReports();
          } else {
            alert(`Rapor silinirken hata oluştu: ${response.data.message}`);
          }
        } catch (err: any) {
          console.error('Rapor silinirken hata:', err);
          alert(`Rapor silinirken hata oluştu: ${err.message}`);
        }
      }
    },
    async generateData(reportId: string) {
      if (!this.authStore.user) {
        alert('Rapor verisi oluşturmak için giriş yapmalısınız.');
        return;
      }
      try {
        const generateReportDataCallable = httpsCallable(this.functionsInstance, 'generateReportData');
        const response = await generateReportDataCallable({ reportId });
        if (response.data.success) {
          alert('Rapor verisi başarıyla oluşturuldu!');
          this.fetchReports(); // Güncellenmiş raporu getirmek için listeyi yeniden yükle
        } else {
          alert(`Rapor verisi oluşturulurken hata oluştu: ${response.data.message}`);
        }
      } catch (err: any) {
        console.error('Rapor verisi oluşturulurken hata:', err);
        alert(`Rapor verisi oluşturulurken hata oluştu: ${err.message}`);
      }
    },
  },
  created() {
    this.authStore.initAuthService();
  },
  mounted() {
    this.fetchReports();
  },
});
</script>

<style scoped lang="scss">
.reports-container {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
  font-family: 'Arial', sans-serif;
  color: #333;
}

h2 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 30px;
}

h3 {
  color: #34495e;
  margin-top: 25px;
  margin-bottom: 15px;
}

.add-report-section, .reports-list-section {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input[type="text"],
.form-group textarea,
.form-group select {
  width: calc(100% - 22px);
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
  margin-left: 10px;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
  margin-left: 10px;
}

.btn-danger:hover {
  background-color: #c82333;
}

.btn-info {
  background-color: #17a2b8;
  color: white;
  margin-left: 10px;
}

.btn-info:hover {
  background-color: #138496;
}

.error-message {
  color: #dc3545;
  margin-top: 10px;
  text-align: center;
}

.report-item {
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.report-item h4 {
  margin-top: 0;
  color: #2c3e50;
}

.report-item p {
  margin-bottom: 5px;
}

.report-item button {
  margin-right: 10px;
}

.edit-form {
  border-top: 1px solid #eee;
  padding-top: 15px;
  margin-top: 10px;
}

.generated-data-preview {
  background-color: #eee;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  margin-top: 10px;
}

.generated-data-preview h5 {
  margin-top: 0;
  margin-bottom: 5px;
  color: #34495e;
}

.generated-data-preview pre {
  white-space: pre-wrap;
  word-break: break-all;
}
</style> 