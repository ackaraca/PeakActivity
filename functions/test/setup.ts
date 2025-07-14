import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';

// Global test setup
beforeAll(async () => {
  // Initialize test environment
  global.testEnv = await initializeTestEnvironment({
    projectId: 'peakactivity-test',
    firestore: {
      rules: `
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /{document=**} {
              allow read, write: if true;
            }
          }
        }
      `,
    },
  });
});

afterAll(async () => {
  if (global.testEnv) {
    await global.testEnv.cleanup();
  }
});

declare global {
  var testEnv: RulesTestEnvironment;
}
