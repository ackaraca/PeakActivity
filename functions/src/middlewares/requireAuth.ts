import * as functions from 'firebase-functions';
import { CallableContext } from 'firebase-functions/v1/https'; // Correct import path for CallableContext

export const requireAuth = (handler: Function) => {
    return async (data: any, context: CallableContext) => {
        if (!context.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'The function must be called while authenticated.'
            );
        }
        return handler(data, context);
    };
}; 