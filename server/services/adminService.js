// this file directly talks to the Models we built earlier and fetches the exact data according to the admin's requirements (filtering meetings and generating alerts).

import Meeting from "../models/meeting.js";
import User from "../models/user.js";

// how many hours after the meeting time are we waiting before automatically setting NO_SHOW.
// can be adjusted to whatever makes sense in the business (e.g. 2 hours, 24 hours, etc.).
const NO_SHOW_GRACE_PERIOD_HOURS = 2;

/**
 * Finds meetings with status ATTENDANCE_CONFIRMED where the meeting time 
 * has passed by NO_SHOW_GRACE_PERIOD_HOURS hours and nobody updated them, 
 * and automatically updates them to NO_SHOW status.
 *
 * Important: This does not check if anyone actually missed the meeting. 
 * It checks if nobody updated the status after the scheduled time. 
 * This matches the agreed definition: scheduled meeting, no cancellation, 
 * and no feedback filled = NO_SHOW.
 */


async function sweepStaleMeetingsToNoShow() {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - NO_SHOW_GRACE_PERIOD_HOURS);

  const result = await Meeting.updateMany(
    {
      status: "ATTENDANCE_CONFIRMED",
      "scheduledTime.startTime": { $lt: cutoff },
    },
    { $set: { status: "NO_SHOW" } }
  );

  return result.modifiedCount || 0;
}

// function 1: fetch meetings with filtering options
export const getMeetingsReport = async (filters) => {
  const query = {};
  
  // build the filter object only with what was sent to us from the client
  if (filters.status) query.status = filters.status;
  if (filters.mentorId) query.mentorId = filters.mentorId;
  if (filters.menteeId) query.menteeId = filters.menteeId;

  // fetch the meetings and populate the participants' details
  const meetings = await Meeting.find(query)
    .populate("mentorId", "firstName lastName email roles profilePicture")
    .populate("menteeId", "firstName lastName email roles profilePicture")
    .sort({ "scheduledTime.startTime": -1 }); // sort from newest to oldest

  return meetings;
};

// function 2: generate smart alerts system
export const generateAlerts = async () => {
    // before calculating alerts, automatically update meetings that are "stuck" to NO_SHOW.
  // so the badge in the table will show the correct status, and the relevant alert
  // (Alert A below) will ignore meetings that have already been processed.
  await sweepStaleMeetingsToNoShow();

  const alerts = [];
  const now = new Date();
  
  // alert A: meeting that has status "ATTENDANCE_CONFIRMED" but the time has passed (not updated)
  // after the sweep above, it will only catch meetings that are still within the grace period -
  // meaning the time has passed, but nobody has updated the status yet.
  const missedMeetings = await Meeting.find({
    status: "ATTENDANCE_CONFIRMED",
    "scheduledTime.startTime": { $lt: now }
  }).populate("mentorId menteeId", "firstName lastName");

  missedMeetings.forEach(meeting => {
    alerts.push({
      id: `missed_${meeting._id}`,
      type: "warning",
      title: "Meeting missed without status update",
      message: `The meeting between ${meeting.menteeId.firstName} and ${meeting.mentorId.firstName} has passed and the status has not been updated.`,
      meetingId: meeting._id
    });
  });

  // alert B: meeting that has ended more than a week ago and is missing feedback from one of the participants
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const missingFeedbackMeetings = await Meeting.find({
    status: "COMPLETED",
    "scheduledTime.endTime": { $lt: oneWeekAgo },
    $or: [
      { "menteeFeedback.isFilled": false },
      { "mentorFeedback.isFilled": false }
    ]
  }).populate("mentorId menteeId", "firstName lastName");

  missingFeedbackMeetings.forEach(meeting => {
    alerts.push({
      id: `feedback_${meeting._id}`,
      type: "error",
      title: "Missing feedback more than a week ago",
      message: `Missing feedback for the meeting between ${meeting.menteeId.firstName} and ${meeting.mentorId.firstName}.`,
      meetingId: meeting._id
    });
  });

  // alert C: mentors who have completed more than 10 meetings (for promotion)
  const stellarMentors = await User.find({
    roles: "mentor",
    "mentorProfile.completedMeetings": { $gte: 10 }
  });

  stellarMentors.forEach(mentor => {
    alerts.push({
      id: `stellar_${mentor._id}`,
      type: "success",
      title: "Stellar mentor",
      message: `${mentor.firstName} ${mentor.lastName} has completed ${mentor.mentorProfile.completedMeetings} meetings! Time to promote them.`,
      userId: mentor._id
    });
  });

  return alerts;
};