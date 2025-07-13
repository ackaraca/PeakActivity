
import * as functions from "firebase-functions";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { admin } from "../firebaseAdmin";

// Her gün belirli bir saatte (örneğin gece 03:00) Firestore'u yedekleyen bir fonksiyon.
// Firebase Projenizde Blaze planının etkinleştirilmesi gerekmektedir.
export const firestoreDailyBackup = onSchedule("0 3 * * *", async (event) => {
  const projectId = process.env.GCLOUD_PROJECT;
  const bucketName = `gs://${projectId}-firestore-backups`; // Google Cloud Storage kovasının adı
  const databaseName = `projects/${projectId}/databases/(default)`;

  try {
    console.log(`Firestore yedeklemesi başlatılıyor. Proje: ${projectId}, Kova: ${bucketName}, Veritabanı: ${databaseName}`);
    
    const client = new admin.firestore.v1.FirestoreAdminClient();

    const response = await client.exportDocuments({
      name: databaseName,
      outputUriPrefix: bucketName,
      // Koleksiyon kimliklerini belirtebilirsiniz. Belirtilmezse tüm veritabanı yedeklenir.
      // collectionIds: ['users', 'activities', 'goals', 'reports'], 
    });
    console.log(`Firestore yedekleme işlemi başarıyla tetiklendi: ${response[0].name}`);
  } catch (err: any) {
    console.error('Firestore yedeklenirken hata oluştu:', err);
    // Hatanın daha detaylı loglanması
    if (err.details) {
      console.error('Hata Detayları:', err.details);
    }
    if (err.metadata) {
      console.error('Hata Meta Verileri:', err.metadata);
    }
    throw new functions.https.HttpsError('internal', 'Firestore yedeklenirken bir hata oluştu.', err.message);
  }
}); 