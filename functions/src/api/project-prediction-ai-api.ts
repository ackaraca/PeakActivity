import * as functions from 'firebase-functions';
import { ProjectPredictionAIService } from '../services/project-prediction-ai-service';

const projectPredictionAIService = new ProjectPredictionAIService();

export const predictProjectCompletion = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  const userId = context.auth.uid;
  const { projectId } = data;

  if (typeof projectId !== 'string' || projectId.trim() === '') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Project ID is required.'
    );
  }

  try {
    const prediction = await projectPredictionAIService.predictProjectCompletion(userId, projectId);
    return { status: 'success', data: prediction };
  } catch (error: any) {
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to predict project completion.'
    );
  }
}); 