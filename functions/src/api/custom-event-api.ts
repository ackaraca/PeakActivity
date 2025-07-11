
import * as functions from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";
import { CustomEventService } from "../services/custom-event-service";

const customEventService = new CustomEventService();

/**
 * Firebase Function to create a new custom event.
 */
export const createCustomEvent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = context.auth.uid;
  const { name, description, type, details } = data;

  if (!name || !type || !details) {
    throw new HttpsError('invalid-argument', 'Gerekli alanlar eksik: isim, tip, detaylar.');
  }

  try {
    const newEvent = await customEventService.createCustomEvent(userId, {
      name,
      description,
      type,
      details,
    });
    return { success: true, event: newEvent };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to get a specific custom event.
 */
export const getCustomEvent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = context.auth.uid;
  const { eventId } = data;

  if (!eventId) {
    throw new HttpsError('invalid-argument', 'Etkinlik kimliği eksik.');
  }

  try {
    const event = await customEventService.getCustomEvent(userId, eventId);
    if (!event) {
      throw new HttpsError('not-found', 'Özel etkinlik bulunamadı.');
    }
    return { success: true, event };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to update an existing custom event.
 */
export const updateCustomEvent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = context.auth.uid;
  const { eventId, updates } = data;

  if (!eventId || !updates) {
    throw new HttpsError('invalid-argument', 'Etkinlik kimliği veya güncellemeler eksik.');
  }

  try {
    const updatedEvent = await customEventService.updateCustomEvent(userId, eventId, updates);
    if (!updatedEvent) {
      throw new HttpsError('not-found', 'Güncellenecek özel etkinlik bulunamadı.');
    }
    return { success: true, event: updatedEvent };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to delete a specific custom event.
 */
export const deleteCustomEvent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = context.auth.uid;
  const { eventId } = data;

  if (!eventId) {
    throw new HttpsError('invalid-argument', 'Etkinlik kimliği eksik.');
  }

  try {
    const success = await customEventService.deleteCustomEvent(userId, eventId);
    if (!success) {
      throw new HttpsError('not-found', 'Silinecek özel etkinlik bulunamadı.');
    }
    return { success: true, message: 'Özel etkinlik başarıyla silindi.' };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to list all custom events for a user.
 */
export const listCustomEvents = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = context.auth.uid;

  try {
    const events = await customEventService.listCustomEvents(userId);
    return { success: true, events };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
}); 