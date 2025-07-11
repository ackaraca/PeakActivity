import * as functions from 'firebase-functions';
import { ProjectPredictionService } from '../services/project-prediction-service';

const projectPredictionService = new ProjectPredictionService();

// Create Project API
export const createProject = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  const userId = context.auth.uid;
  const { title, description, status, start_date, due_date, associated_goals, associated_tasks } = data;

  if (typeof title !== 'string' || title.trim() === '') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Project title is required.'
    );
  }

  try {
    const newProject = await projectPredictionService.createProject(userId, {
      title,
      description,
      status,
      start_date,
      due_date,
      associated_goals,
      associated_tasks,
    });
    return { status: 'success', data: newProject };
  } catch (error: any) {
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to create project.'
    );
  }
});

// Get Project API
export const getProject = functions.https.onCall(async (data, context) => {
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
    const project = await projectPredictionService.getProject(userId, projectId);
    if (!project) {
      throw new functions.https.HttpsError(
        'not-found',
        'Project not found.'
      );
    }
    return { status: 'success', data: project };
  } catch (error: any) {
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to get project.'
    );
  }
});

// Update Project API
export const updateProject = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  const userId = context.auth.uid;
  const { projectId, updates } = data;

  if (typeof projectId !== 'string' || projectId.trim() === '') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Project ID is required.'
    );
  }
  if (typeof updates !== 'object' || updates === null) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Updates object is required.'
    );
  }

  try {
    const updatedProject = await projectPredictionService.updateProject(userId, projectId, updates);
    if (!updatedProject) {
      throw new functions.https.HttpsError(
        'not-found',
        'Project not found.'
      );
    }
    return { status: 'success', data: updatedProject };
  } catch (error: any) {
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to update project.'
    );
  }
});

// Get All Projects API
export const getAllProjects = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  const userId = context.auth.uid;

  try {
    const projects = await projectPredictionService.getAllProjects(userId);
    return { status: 'success', data: projects };
  } catch (error: any) {
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to get all projects.'
    );
  }
});

// Delete Project API
export const deleteProject = functions.https.onCall(async (data, context) => {
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
    await projectPredictionService.deleteProject(userId, projectId);
    return { status: 'success' };
  } catch (error: any) {
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to delete project.'
    );
  }
}); 