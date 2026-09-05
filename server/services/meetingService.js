import MeetingModel from "../models/meeting.js";

// 1. create a new meeting (mentor requests a meeting)
export async function createMeeting(menteeId, mentorId) {
  if (String(menteeId) === String(mentorId)) {
    throw Object.assign(new Error("You cannot book a meeting with yourself"), { status: 400 });
  }

    // optional: check if there is an active meeting between them
  const existingMeeting = await MeetingModel.findOne({
    menteeId,
    mentorId,
    status: { $in: ["PENDING_MENTOR_TIMES", "PENDING_MENTEE_SELECTION", "MATCHED"] }
  });

  if (existingMeeting) {
    throw Object.assign(new Error("An active meeting request already exists with this mentor"), { status: 400 });
  }

  const newMeeting = new MeetingModel({
    menteeId,
    mentorId,
    status: "PENDING_MENTOR_TIMES",
  });

  await newMeeting.save();
  return newMeeting;
}

// 2. mentor proposes times
export async function proposeTimes(meetingId, mentorId, proposedTimes) {
  const meeting = await MeetingModel.findById(meetingId);
  
  if (!meeting) {
    throw Object.assign(new Error("Meeting not found"), { status: 404 });
  }

  if (String(meeting.mentorId) !== String(mentorId)) {
    throw Object.assign(new Error("Only the assigned mentor can propose times"), { status: 403 });
  }

  // if (!["PENDING_MENTOR_TIMES", "CANCELLED"].includes(meeting.status) && meeting.rescheduleCount >= 1) {
  //   throw Object.assign(new Error("Cannot propose times at this stage or max reschedules reached"), { status: 400 });

    if (!["PENDING_MENTOR_TIMES", "PENDING_MENTEE_SELECTION"].includes(meeting.status) && meeting.rescheduleCount >= 1) {
      throw Object.assign(new Error("Cannot propose times at this stage or max reschedules reached"), { status: 400 });
    }

  meeting.proposedTimes = proposedTimes;
  meeting.status = "PENDING_MENTEE_SELECTION";
  
  await meeting.save();
  return meeting;
}

// 3. mentor selects the optimal time
export async function selectTime(meetingId, menteeId, selectedTime) {
  const meeting = await MeetingModel.findById(meetingId);
  
  if (!meeting) {
    throw Object.assign(new Error("Meeting not found"), { status: 404 });
  }

  if (String(meeting.menteeId) !== String(menteeId)) {
    throw Object.assign(new Error("Only the assigned mentee can select the time"), { status: 403 });
  }

  if (meeting.status !== "PENDING_MENTEE_SELECTION") {
    throw Object.assign(new Error("Meeting is not awaiting time selection"), { status: 400 });
  }

  meeting.scheduledTime = selectedTime;
  meeting.status = "MATCHED";
  
  await meeting.save();
  return meeting;
}

// 4. reject the meeting (can be done by both sides)
export async function rejectMeeting(meetingId, userId) {
  const meeting = await MeetingModel.findById(meetingId);
  
  if (!meeting) {
    throw Object.assign(new Error("Meeting not found"), { status: 404 });
  }

  if (String(meeting.menteeId) !== String(userId) && String(meeting.mentorId) !== String(userId)) {
    throw Object.assign(new Error("Unauthorized to reject this meeting"), { status: 403 });
  }

  meeting.status = "CANCELLED";
  await meeting.save();
  return meeting;
}

// 5. get all the meetings of the user (as a mentor or a mentee)
export async function getUserMeetings(userId) {
  // fetch all the meetings related to the user, and fetch the user details
  return await MeetingModel.find({
    $or: [{ menteeId: userId }, { mentorId: userId }]
  })
  .populate("menteeId", "firstName lastName email profilePicture")
  .populate("mentorId", "firstName lastName email profilePicture")
  .sort({ createdAt: -1 }); // from new to old
}

// // 6. mark the meeting as unavailable
// export async function markUnavailableMeeting(meetingId, userId) {
//   const meeting = await MeetingModel.findById(meetingId);
  
//   if (!meeting) {
//     throw Object.assign(new Error("Meeting not found"), { status: 404 });
//   }
// }

export async function markUnavailable(meetingId, userId) {
  const meeting = await MeetingModel.findById(meetingId);
  
  if (!meeting) {
    throw Object.assign(new Error("Meeting not found"), { status: 404 });
  }

  // וידוא שהמשתמש שייך לפגישה (מנטור/ית או מנטית)
  if (String(meeting.mentorId) !== String(userId) && String(meeting.menteeId) !== String(userId)) {
    throw Object.assign(new Error("Unauthorized to modify this meeting"), { status: 403 });
  }

  // אם כבר נוצל ניסיון שינוי אחד בעבר - הפגישה מבוטלת סופית
  if (meeting.rescheduleCount >= 1) {
    meeting.status = "CANCELLED";
    await meeting.save();
    return { meeting, cancelled: true };
  }

  // עדכון מונה השינויים ואיפוס השעות כדי לאפשר סבב הצעות חדש
  meeting.rescheduleCount = (meeting.rescheduleCount || 0) + 1;
  meeting.status = "PENDING_MENTOR_TIMES";
  meeting.proposedTimes = [];
  meeting.scheduledTime = null;
  
  await meeting.save();
  return { meeting, cancelled: false };
}