import { onRequest } from 'firebase-functions/v2/https';
import { GoalService } from '../services/goal-service';
import { AppError, ValidationError, AuthenticationError, AuthorizationError, NotFoundError } from '../utils/error-handler';
import { admin } from '../config/firebase-admin';

// Hedef oluşturma
export const createGoal = onRequest({
  cors: true,
}, async (req, res) => {
  try {
    if (req.method !== 'POST') {
      throw new AppError('Yöntem izin verilmiyor', 'METHOD_NOT_ALLOWED', 405);
    }

    const { userId, ...goalData } = req.body;

    if (!userId) {
      throw new ValidationError('Kullanıcı ID'si gerekli');
    }
    // TODO: Kullanıcı kimlik doğrulamasını burada yap
    // Örneğin: const decodedToken = await admin.auth.verifyIdToken(req.headers.authorization); if(decodedToken.uid !== userId) throw new AuthorizationError();

    const newGoal = await GoalService.createGoal(goalData, userId);
    res.status(201).json({ success: true, data: newGoal });
  } catch (error) {
    const { statusCode, error: errorMessage, code } = AppError.fromError(error);
    res.status(statusCode).json({ error: errorMessage, code });
  }
});

// Hedefleri listeleme
export const getGoals = onRequest({
  cors: true,
}, async (req, res) => {
  try {
    if (req.method !== 'GET') {
      throw new AppError('Yöntem izin verilmiyor', 'METHOD_NOT_ALLOWED', 405);
    }

    const { userId } = req.query;
    if (!userId) {
      throw new ValidationError('Kullanıcı ID'si gerekli');
    }
    // TODO: Kullanıcı kimlik doğrulamasını burada yap

    // Bu API, tüm hedefleri listelemek için GoalService'de bir metod gerektirecektir.
    // Şimdilik sadece örnek bir dönüş yapıyorum.
    res.status(200).json({ success: true, data: [] });
  } catch (error) {
    const { statusCode, error: errorMessage, code } = AppError.fromError(error);
    res.status(statusCode).json({ error: errorMessage, code });
  }
});

// Hedef güncelleme
export const updateGoal = onRequest({
  cors: true,
}, async (req, res) => {
  try {
    if (req.method !== 'PUT') {
      throw new AppError('Yöntem izin verilmiyor', 'METHOD_NOT_ALLOWED', 405);
    }

    const { goalId, userId, ...updates } = req.body;

    if (!goalId || !userId) {
      throw new ValidationError('Hedef ID ve Kullanıcı ID'si gerekli');
    }
    // TODO: Kullanıcı kimlik doğrulamasını burada yap

    await GoalService.updateGoal(goalId, updates, userId);
    res.status(200).json({ success: true, message: 'Hedef başarıyla güncellendi' });
  } catch (error) {
    const { statusCode, error: errorMessage, code } = AppError.fromError(error);
    res.status(statusCode).json({ error: errorMessage, code });
  }
});

// Hedef silme
export const deleteGoal = onRequest({
  cors: true,
}, async (req, res) => {
  try {
    if (req.method !== 'DELETE') {
      throw new AppError('Yöntem izin verilmiyor', 'METHOD_NOT_ALLOWED', 405);
    }

    const { goalId, userId } = req.body;

    if (!goalId || !userId) {
      throw new ValidationError('Hedef ID ve Kullanıcı ID'si gerekli');
    }
    // TODO: Kullanıcı kimlik doğrulamasını burada yap

    await GoalService.deleteGoal(goalId, userId);
    res.status(200).json({ success: true, message: 'Hedef başarıyla silindi' });
  } catch (error) {
    const { statusCode, error: errorMessage, code } = AppError.fromError(error);
    res.status(statusCode).json({ error: errorMessage, code });
  }
}); 