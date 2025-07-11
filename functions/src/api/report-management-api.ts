
import * as functions from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";
import { ReportManagementService } from "../services/report-management-service";

const reportService = new ReportManagementService();

/**
 * Firebase Function to create a new report or dashboard.
 */
export const createReport = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = context.auth.uid;
  const { name, description, type, configuration } = data;

  if (!name || !type || !configuration) {
    throw new HttpsError('invalid-argument', 'Gerekli alanlar eksik: isim, tip, konfigürasyon.');
  }

  try {
    const newReport = await reportService.createReport(userId, {
      name,
      description,
      type,
      configuration,
    });
    return { success: true, report: newReport };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to get a specific report or dashboard.
 */
export const getReport = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = context.auth.uid;
  const { reportId } = data;

  if (!reportId) {
    throw new HttpsError('invalid-argument', 'Rapor kimliği eksik.');
  }

  try {
    const report = await reportService.getReport(userId, reportId);
    if (!report) {
      throw new HttpsError('not-found', 'Rapor veya gösterge tablosu bulunamadı.');
    }
    return { success: true, report };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to update an existing report or dashboard.
 */
export const updateReport = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = context.auth.uid;
  const { reportId, updates } = data;

  if (!reportId || !updates) {
    throw new HttpsError('invalid-argument', 'Rapor kimliği veya güncellemeler eksik.');
  }

  try {
    const updatedReport = await reportService.updateReport(userId, reportId, updates);
    if (!updatedReport) {
      throw new HttpsError('not-found', 'Güncellenecek rapor veya gösterge tablosu bulunamadı.');
    }
    return { success: true, report: updatedReport };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to delete a specific report or dashboard.
 */
export const deleteReport = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = context.auth.uid;
  const { reportId } = data;

  if (!reportId) {
    throw new HttpsError('invalid-argument', 'Rapor kimliği eksik.');
  }

  try {
    const success = await reportService.deleteReport(userId, reportId);
    if (!success) {
      throw new HttpsError('not-found', 'Silinecek rapor veya gösterge tablosu bulunamadı.');
    }
    return { success: true, message: 'Rapor veya gösterge tablosu başarıyla silindi.' };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to list all reports and dashboards for a user.
 */
export const listReports = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = context.auth.uid;

  try {
    const reports = await reportService.listReports(userId);
    return { success: true, reports };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to generate data for a specific report or dashboard.
 */
export const generateReportData = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = context.auth.uid;
  const { reportId } = data;

  if (!reportId) {
    throw new HttpsError('invalid-argument', 'Rapor kimliği eksik.');
  }

  try {
    const updatedReport = await reportService.generateReportData(userId, reportId);
    if (!updatedReport) {
      throw new HttpsError('not-found', 'Veri üretilecek rapor veya gösterge tablosu bulunamadı.');
    }
    return { success: true, report: updatedReport };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
}); 