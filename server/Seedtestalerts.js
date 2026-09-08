/**
 * Mock seed script to test all 4 types of Admin Alerts without waiting
 * for real time to pass.
 *
 * Run (from the server directory): node seedTestAlerts.js
 *
 * The script automatically finds an existing mentor and mentee in the DB
 * (no need to copy IDs manually) - and makes sure they are two DIFFERENT
 * users, even if some users hold both roles (every mentor is also a mentee
 * in this app, but not vice versa).
 */

import "dotenv/config";
import mongoose from "mongoose";
import Meeting from "./models/meeting.js";
import User from "./models/user.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/queenb";

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to DB");

  const mentor = await User.findOne({ roles: "mentor" });
  const mentee = await User.findOne({
    roles: "mentee",
    _id: { $ne: mentor?._id }, // must be a different person than the mentor,
    // not the same dual-role account
  });

  if (!mentor || !mentee) {
    console.error(
      "Could not find two different matching users in the DB (need at least one user with roles including 'mentor' and a DIFFERENT user with 'mentee'). Check your DB before running again."
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`Using mentor: ${mentor.firstName} ${mentor.lastName} (${mentor._id})`);
  console.log(`Using mentee: ${mentee.firstName} ${mentee.lastName} (${mentee._id})`);

  // ===== Requirement #2: "Attendance confirmed" but the time has passed (still within grace window) =====
  // 30 minutes after the meeting time - still before the 2-hour grace window
  // (NO_SHOW_GRACE_PERIOD_HOURS in adminService.js), so you can see the
  // "Meeting missed without status update" alert *before* it auto-flips to NO_SHOW.
  const thirtyMinAgo = new Date();
  thirtyMinAgo.setMinutes(thirtyMinAgo.getMinutes() - 30);

  const attendanceConfirmedMeeting = await Meeting.create({
    mentorId: mentor._id,
    menteeId: mentee._id,
    status: "ATTENDANCE_CONFIRMED",
    scheduledTime: {
      startTime: thirtyMinAgo,
      endTime: new Date(thirtyMinAgo.getTime() + 45 * 60000),
    },
  });
  console.log(
    "✅ [Requirement 2] Created ATTENDANCE_CONFIRMED meeting (30 min ago, still in grace window):",
    attendanceConfirmedMeeting._id.toString()
  );

  // ===== Requirement #1: meeting that didn't take place (past grace window -> auto-flips to NO_SHOW) =====
  const threeHoursAgo = new Date();
  threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);

  const noShowMeeting = await Meeting.create({
    mentorId: mentor._id,
    menteeId: mentee._id,
    status: "ATTENDANCE_CONFIRMED",
    scheduledTime: {
      startTime: threeHoursAgo,
      endTime: new Date(threeHoursAgo.getTime() + 45 * 60000),
    },
  });
  console.log(
    "✅ [Requirement 1] Created meeting that will auto-flip to NO_SHOW on next admin alerts load:",
    noShowMeeting._id.toString()
  );

  // ===== Requirement #3: missing feedback more than a week after the meeting =====
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

  const missingFeedbackMeeting = await Meeting.create({
    mentorId: mentor._id,
    menteeId: mentee._id,
    status: "COMPLETED",
    scheduledTime: {
      startTime: tenDaysAgo,
      endTime: new Date(tenDaysAgo.getTime() + 45 * 60000),
    },
    // menteeFeedback/mentorFeedback intentionally left unfilled
  });
  console.log(
    "✅ [Requirement 3] Created COMPLETED meeting from 10 days ago with no feedback:",
    missingFeedbackMeeting._id.toString()
  );

  // ===== Requirement #4: stellar mentor (more than 10 completed meetings) =====
  await User.findByIdAndUpdate(mentor._id, {
    $set: { "mentorProfile.completedMeetings": 11 },
  });
  console.log(
    `✅ [Requirement 4] Updated ${mentor.firstName} ${mentor.lastName}'s completedMeetings to 11.`
  );

  console.log("\nDone! Now check the Admin page:");
  console.log("1. Refresh the Admin page (this sends GET /api/v1/admin/alerts).");
  console.log(
    "2. You should see 3 alerts: 'Meeting missed...' (req. 2), 'Missing feedback...' (req. 3), 'Stellar mentor' (req. 4)."
  );
  console.log(
    "3. Refresh again after a few seconds/minutes, then check the Meetings Report table - the meeting from requirement 1 (3 hours ago) should have flipped to NO_SHOW status."
  );

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});