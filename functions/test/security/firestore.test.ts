import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  getDocs,
  deleteDoc,
  updateDoc
} from "firebase/firestore";
import fs from "fs";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "peakactivity-test", // Use a test project ID
    firestore: {
      rules: fs.readFileSync("firestore.rules", "utf8"),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore(); // Clear data between tests
});

describe("Firestore Security Rules Tests", () => {
  const aliceId = "alice";
  const bobId = "bob";
  const adminId = "admin";

  const aliceAuth = { uid: aliceId };
  const bobAuth = { uid: bobId };
  const adminAuth = { uid: adminId, token: { admin: true } };

  // Helper function to get a Firestore instance for a specific user
  const getFirestore = (auth: any) => testEnv.authenticatedContext(auth).firestore();
  const getUnauthenticatedFirestore = () => testEnv.unauthenticatedContext().firestore();
  const getAdminFirestore = () => testEnv.authenticatedContext(adminAuth).firestore();

  describe("users collection", () => {
    it("should allow a user to read and write their own profile", async () => {
      const db = getFirestore(aliceAuth);
      const userRef = doc(db, "users", aliceId);
      await assertSucceeds(setDoc(userRef, { name: "Alice" }));
      await assertSucceeds(getDoc(userRef));
      await assertSucceeds(updateDoc(userRef, { name: "Alice Updated" }));
    });

    it("should not allow a user to read another user's profile", async () => {
      const db = getFirestore(aliceAuth);
      const userRef = doc(db, "users", bobId);
      await assertFails(getDoc(userRef));
    });

    it("should not allow a user to write another user's profile", async () => {
      const db = getFirestore(aliceAuth);
      const userRef = doc(db, "users", bobId);
      await assertFails(setDoc(userRef, { name: "Bob" }));
    });

    it("should not allow an unauthenticated user to read any profile", async () => {
      const db = getUnauthenticatedFirestore();
      const userRef = doc(db, "users", aliceId);
      await assertFails(getDoc(userRef));
    });

    it("should not allow an unauthenticated user to write any profile", async () => {
      const db = getUnauthenticatedFirestore();
      const userRef = doc(db, "users", aliceId);
      await assertFails(setDoc(userRef, { name: "Alice" }));
    });

    it("should allow admin to read and write any user profile", async () => {
      const adminDb = getAdminFirestore();
      const aliceUserRef = doc(adminDb, "users", aliceId);
      await assertSucceeds(setDoc(aliceUserRef, { name: "Alice as Admin" }));
      await assertSucceeds(getDoc(aliceUserRef));
      await assertSucceeds(updateDoc(aliceUserRef, { name: "Alice Updated by Admin" }));
    });
  });

  describe("subcollections under users/{userId}", () => {
    const bucketId = "testBucket";
    const eventId = "testEvent";
    const goalId = "testGoal";
    const insightId = "testInsight";
    const dailyReportId = "testDailyReport";
    const weeklyReportId = "testWeeklyReport";
    const automationRuleId = "testAutomationRule";
    const settingId = "testSetting";

    async function setupUserData(userId: string) {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await setDoc(doc(db, "users", userId), { name: userId });
        await setDoc(doc(db, `users/${userId}/buckets`, bucketId), { name: "My Bucket" });
        await setDoc(doc(db, `users/${userId}/buckets/${bucketId}/events`, eventId), { type: "app_usage" });
        await setDoc(doc(db, `users/${userId}/buckets/${bucketId}/goals`, goalId), { name: "My Goal" });
        await setDoc(doc(db, `users/${userId}/buckets/${bucketId}/insights`, insightId), { type: "productivity" });
        await setDoc(doc(db, `users/${userId}/buckets/${bucketId}/daily_reports`, dailyReportId), { date: "2025-07-13" });
        await setDoc(doc(db, `users/${userId}/buckets/${bucketId}/weekly_reports`, weeklyReportId), { week: "28" });
        await setDoc(doc(db, `users/${userId}/buckets/${bucketId}/automation_rules`, automationRuleId), { rule: "block_social_media" });
        await setDoc(doc(db, `users/${userId}/buckets/${bucketId}/settings`, settingId), { theme: "dark" });
      });
    }

    it("should allow a user to read and write their own bucket data", async () => {
      await setupUserData(aliceId);
      const db = getFirestore(aliceAuth);
      const bucketRef = doc(db, `users/${aliceId}/buckets`, bucketId);
      await assertSucceeds(getDoc(bucketRef));
      await assertSucceeds(updateDoc(bucketRef, { name: "Updated Bucket" }));
    });

    it("should not allow a user to read another user's bucket data", async () => {
      await setupUserData(bobId);
      const db = getFirestore(aliceAuth);
      const bucketRef = doc(db, `users/${bobId}/buckets`, bucketId);
      await assertFails(getDoc(bucketRef));
    });

    it("should allow a user to read and write their own events", async () => {
      await setupUserData(aliceId);
      const db = getFirestore(aliceAuth);
      const eventRef = doc(db, `users/${aliceId}/buckets/${bucketId}/events`, eventId);
      await assertSucceeds(getDoc(eventRef));
      await assertSucceeds(updateDoc(eventRef, { type: "website_visit" }));
    });

    it("should not allow a user to read another user's events", async () => {
      await setupUserData(bobId);
      const db = getFirestore(aliceAuth);
      const eventRef = doc(db, `users/${bobId}/buckets/${bucketId}/events`, eventId);
      await assertFails(getDoc(eventRef));
    });

    it("should allow a user to list their own events", async () => {
      await setupUserData(aliceId);
      const db = getFirestore(aliceAuth);
      const eventsCollectionRef = collection(db, `users/${aliceId}/buckets/${bucketId}/events`);
      const q = query(eventsCollectionRef);
      await assertSucceeds(getDocs(q));
    });

    it("should not allow a user to list another user's events", async () => {
      await setupUserData(bobId);
      const db = getFirestore(aliceAuth);
      const eventsCollectionRef = collection(db, `users/${bobId}/buckets/${bucketId}/events`);
      const q = query(eventsCollectionRef);
      await assertFails(getDocs(q));
    });

    it("should allow admin to read and write any subcollection data", async () => {
      await setupUserData(aliceId);
      const adminDb = getAdminFirestore();
      const eventRef = doc(adminDb, `users/${aliceId}/buckets/${bucketId}/events`, eventId);
      await assertSucceeds(getDoc(eventRef));
      await assertSucceeds(updateDoc(eventRef, { type: "admin_update" }));
    });

    it("should allow admin to list any subcollection data", async () => {
      await setupUserData(aliceId);
      const adminDb = getAdminFirestore();
      const eventsCollectionRef = collection(adminDb, `users/${aliceId}/buckets/${bucketId}/events`);
      const q = query(eventsCollectionRef);
      await assertSucceeds(getDocs(q));
    });

    it("should allow admin to delete any subcollection data", async () => {
        await setupUserData(aliceId);
        const adminDb = getAdminFirestore();
        const eventRef = doc(adminDb, `users/${aliceId}/buckets/${bucketId}/events`, eventId);
        await assertSucceeds(deleteDoc(eventRef));
    });
  });

  describe("teams collection (Pro tier)", () => {
    const teamId = "testTeam";
    const memberId = aliceId;
    const adminMemberId = adminId;
    const reportId = "testReport";

    async function setupTeamData() {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await setDoc(doc(db, "teams", teamId), { name: "My Team" });
        await setDoc(doc(db, `teams/${teamId}/members`, memberId), { role: "member" });
        await setDoc(doc(db, `teams/${teamId}/members`, adminMemberId), { role: "admin" });
        await setDoc(doc(db, `teams/${teamId}/reports`, reportId), { title: "Team Report" });
      });
    }

    it("should allow a team member to read team data", async () => {
      await setupTeamData();
      const db = getFirestore(aliceAuth);
      const teamRef = doc(db, "teams", teamId);
      await assertSucceeds(getDoc(teamRef));
    });

    it("should not allow a non-team member to read team data", async () => {
      await setupTeamData();
      const db = getFirestore(bobAuth); // Bob is not a member
      const teamRef = doc(db, "teams", teamId);
      await assertFails(getDoc(teamRef));
    });

    it("should allow a team admin to write team data", async () => {
      await setupTeamData();
      const db = getFirestore(adminAuth);
      const teamRef = doc(db, "teams", teamId);
      await assertSucceeds(updateDoc(teamRef, { name: "Updated Team" }));
    });

    it("should not allow a non-admin team member to write team data", async () => {
      await setupTeamData();
      const db = getFirestore(aliceAuth);
      const teamRef = doc(db, "teams", teamId);
      await assertFails(updateDoc(teamRef, { name: "Updated Team by Member" }));
    });

    it("should allow a team member to read team members", async () => {
      await setupTeamData();
      const db = getFirestore(aliceAuth);
      const memberRef = doc(db, `teams/${teamId}/members`, memberId);
      await assertSucceeds(getDoc(memberRef));
    });

    it("should allow a team admin to write team members", async () => {
      await setupTeamData();
      const db = getFirestore(adminAuth);
      const memberRef = doc(db, `teams/${teamId}/members`, memberId);
      await assertSucceeds(updateDoc(memberRef, { role: "new_role" }));
    });

    it("should allow a team member to read team reports", async () => {
      await setupTeamData();
      const db = getFirestore(aliceAuth);
      const reportRef = doc(db, `teams/${teamId}/reports`, reportId);
      await assertSucceeds(getDoc(reportRef));
    });

    it("should allow a team admin to create/update team reports", async () => {
      await setupTeamData();
      const db = getFirestore(adminAuth);
      const newReportId = "newReport";
      await assertSucceeds(setDoc(doc(db, `teams/${teamId}/reports`, newReportId), { title: "New Report" }));
      await assertSucceeds(updateDoc(doc(db, `teams/${teamId}/reports`, reportId), { title: "Updated Report" }));
    });

    it("should not allow a non-admin team member to create/update team reports", async () => {
      await setupTeamData();
      const db = getFirestore(aliceAuth);
      const newReportId = "newReport";
      await assertFails(setDoc(doc(db, `teams/${teamId}/reports`, newReportId), { title: "New Report" }));
      await assertFails(updateDoc(doc(db, `teams/${teamId}/reports`, reportId), { title: "Updated Report" }));
    });
  });

  describe("system collections (admin access only)", () => {
    const categoryId = "testCategory";
    const insightId = "testSystemInsight";
    const metricId = "testMetric";
    const logId = "testErrorLog";
    const eventId = "testAnalyticsEvent";

    async function setupSystemData() {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await setDoc(doc(db, "app_categories", categoryId), { name: "Development" });
        await setDoc(doc(db, "system_insights", insightId), { type: "overall_health" });
        await setDoc(doc(db, "performance_metrics", metricId), { value: 100 });
        await setDoc(doc(db, "error_logs", logId), { message: "Error" });
        await setDoc(doc(db, "analytics_events", eventId), { name: "PageView" });
      });
    }

    it("should allow any authenticated user to read app_categories, but only admin to write", async () => {
      await setupSystemData();
      const db = getFirestore(aliceAuth);
      const categoryRef = doc(db, "app_categories", categoryId);
      await assertSucceeds(getDoc(categoryRef));
      await assertFails(setDoc(categoryRef, { name: "Updated Category" }));

      const adminDb = getAdminFirestore();
      await assertSucceeds(setDoc(categoryRef, { name: "Updated Category by Admin" }));
    });

    it("should allow only admin to read and write system_insights", async () => {
      await setupSystemData();
      const db = getFirestore(aliceAuth);
      const insightRef = doc(db, "system_insights", insightId);
      await assertFails(getDoc(insightRef));
      await assertFails(setDoc(insightRef, { type: "new_type" }));

      const adminDb = getAdminFirestore();
      await assertSucceeds(getDoc(insightRef));
      await assertSucceeds(setDoc(insightRef, { type: "new_type_by_admin" }));
    });

    it("should allow only admin to read and write performance_metrics", async () => {
      await setupSystemData();
      const db = getFirestore(aliceAuth);
      const metricRef = doc(db, "performance_metrics", metricId);
      await assertFails(getDoc(metricRef));
      await assertFails(setDoc(metricRef, { value: 200 }));

      const adminDb = getAdminFirestore();
      await assertSucceeds(getDoc(metricRef));
      await assertSucceeds(setDoc(metricRef, { value: 200 }));
    });

    it("should allow any authenticated user to write error_logs, but only admin to read", async () => {
      await setupSystemData();
      const db = getFirestore(aliceAuth);
      const newLogRef = doc(db, "error_logs", "newLog");
      await assertSucceeds(setDoc(newLogRef, { message: "User Error" }));
      await assertFails(getDoc(doc(db, "error_logs", logId))); // Cannot read existing log

      const adminDb = getAdminFirestore();
      await assertSucceeds(getDoc(doc(adminDb, "error_logs", logId)));
    });

    it("should allow any authenticated user to create analytics_events, but only admin to read/update/delete", async () => {
      await setupSystemData();
      const db = getFirestore(aliceAuth);
      const newEventRef = doc(db, "analytics_events", "newEvent");
      await assertSucceeds(setDoc(newEventRef, { name: "User Click" }));
      await assertFails(getDoc(doc(db, "analytics_events", eventId))); // Cannot read existing event
      await assertFails(updateDoc(doc(db, "analytics_events", eventId), { name: "Updated Event" }));
      await assertFails(deleteDoc(doc(db, "analytics_events", eventId)));

      const adminDb = getAdminFirestore();
      await assertSucceeds(getDoc(doc(adminDb, "analytics_events", eventId)));
      await assertSucceeds(updateDoc(doc(adminDb, "analytics_events", eventId), { name: "Updated Event by Admin" }));
      await assertSucceeds(deleteDoc(doc(adminDb, "analytics_events", eventId)));
    });
  });

  describe("subscriptions collection", () => {
    const subscriptionId = "testSubscription";

    async function setupSubscriptionData(userId: string) {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await setDoc(doc(db, "subscriptions", subscriptionId), { userId: userId, status: "active" });
      });
    }

    it("should allow a user to read their own subscription", async () => {
      await setupSubscriptionData(aliceId);
      const db = getFirestore(aliceAuth);
      const subscriptionRef = doc(db, "subscriptions", subscriptionId);
      await assertSucceeds(getDoc(subscriptionRef));
    });

    it("should not allow a user to read another user's subscription", async () => {
      await setupSubscriptionData(bobId);
      const db = getFirestore(aliceAuth);
      const subscriptionRef = doc(db, "subscriptions", subscriptionId);
      await assertFails(getDoc(subscriptionRef));
    });

    it("should allow admin to read and write any subscription", async () => {
      await setupSubscriptionData(aliceId);
      const adminDb = getAdminFirestore();
      const subscriptionRef = doc(adminDb, "subscriptions", subscriptionId);
      await assertSucceeds(getDoc(subscriptionRef));
      await assertSucceeds(updateDoc(subscriptionRef, { status: "inactive" }));
    });
  });
}); 