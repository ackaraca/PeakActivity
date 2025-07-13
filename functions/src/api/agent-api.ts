import * as functions from 'firebase-functions';
import axios from 'axios';
import { requireAuth } from '../middlewares/requireAuth';

interface AgentGenerationRequest {
  agent_config_data: string;
  topic: string;
}

export const generateAgent = functions.https.onCall(requireAuth(async (data: AgentGenerationRequest, context) => {
  const geminiApiKey = functions.config().gemini?.api_key;
  const awServerUrl = functions.config().aw_server?.url || 'http://localhost:5000'; // Varsayılan olarak localhost veya yapılandırılan URL

  if (!geminiApiKey) {
    throw new functions.https.HttpsError('unauthenticated', 'Gemini API key is not configured.');
  }

  if (!data.agent_config_data || !data.topic) {
    throw new functions.https.HttpsError('invalid-argument', 'Agent configuration data and topic are required.');
  }

  try {
    const response = await axios.post(
      `${awServerUrl}/api/0/agents/generate`,
      {
        agent_config_data: data.agent_config_data,
        topic: data.topic,
      },
      {
        headers: {
          'X-Gemini-Api-Key': geminiApiKey,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error: any) {
    functions.logger.error('Error calling aw-server agent generation endpoint:', error.message);
    if (error.response) {
      functions.logger.error('aw-server response data:', error.response.data);
      throw new functions.https.HttpsError(
        'internal',
        `Failed to generate agent: ${error.response.data.message || error.message}`
      );
    } else {
      throw new functions.https.HttpsError('internal', `Failed to generate agent: ${error.message}`);
    }
  }
})); 