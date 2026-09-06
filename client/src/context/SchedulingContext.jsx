import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import appointmentService from "../services/appointmentService";
import availabilityService from "../services/availabilityService";
import { getStoredToken } from "../services/api";
import { useAuth } from "./AuthContext";
import { useNotifications } from "./NotificationContext";

const SchedulingContext = createContext(null);

const fallbackMapStatus = (state) => state;

export function SchedulingProvider({ children }) {
  const [Meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { refreshNotifications } = useNotifications();
  const { currentUser, authReady } = useAuth();

  const refreshMeetings = useCallback(async () => {
    if (!getStoredToken()) {
      setMeetings([]);
      setLoading(false);
      return [];
    }

    try {
      const data = await appointmentService.getAppointmentsForUser();
      setMeetings(data || []);
      return data || [];
    } catch (error) {
      console.error("Failed to fetch Meetings from server:", error);
      setMeetings([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authReady) return;

    if (!currentUser) {
      setMeetings([]);
      setLoading(false);
      return;
    }

    refreshMeetings();
  }, [authReady, currentUser?.id, refreshMeetings]);

  const afterMutation = async () => {
    await refreshMeetings();
    // Server persists notifications for the other party; refresh own bell too.
    await refreshNotifications();
  };

  const createRequest = async (mentorId) => {
    const meeting = await appointmentService.createMentorshipRequest({ mentorId });
    await afterMutation();
    return meeting;
  };

  const bookFromAvailability = async ({ mentorId, startTime, endTime }) => {
    const meeting = await appointmentService.bookFromAvailability({
      mentorId,
      startTime,
      endTime,
    });
    await afterMutation();
    return meeting;
  };

  const rebookFromAvailability = async (meetingId, startTime, endTime) => {
    const meeting = await appointmentService.rebookFromAvailability(
      meetingId,
      startTime,
      endTime
    );
    await afterMutation();
    return meeting;
  };

  const saveWeekAvailability = useCallback(async ({ weekStart, weekEnd, slots }) => {
    return availabilityService.setWeekAvailability({ weekStart, weekEnd, slots });
  }, []);

  const getMyAvailability = useCallback(async () => availabilityService.getMyAvailability(), []);

  const approveRequest = async (meetingId) => {
    console.warn("approveRequest is deprecated. Mentors should publish availability.");
    return Meetings.find((s) => s.id === meetingId);
  };

  const rejectRequest = async (meetingId) => {
    const meeting = await appointmentService.rejectRequest(meetingId);
    await afterMutation();
    return meeting;
  };

  const proposeSlots = async (meetingId, slots) => {
    if (!Array.isArray(slots) || slots.length === 0) {
      throw new Error("Please select at least one time slot");
    }
    if (slots.length > 3) {
      throw new Error("You can propose up to 3 time options");
    }
    const meeting = await appointmentService.proposeSlots(meetingId, slots);
    await afterMutation();
    return meeting;
  };

  const selectSlot = async (meetingId, slot) => {
    const existing = Meetings.find((m) => String(m.id) === String(meetingId));
    const proposed = existing?.proposedTimes?.find(
      (pt) => new Date(pt.startTime).getTime() === new Date(slot).getTime()
    );
    const durationMinutes = proposed
      ? Math.max(
          15,
          Math.round((new Date(proposed.endTime) - new Date(proposed.startTime)) / 60000)
        )
      : existing?.durationMinutes || 60;

    const meeting = await appointmentService.bookSlot(meetingId, slot, durationMinutes);
    await afterMutation();
    return meeting;
  };

  const requestMoreSlots = async (meetingId) => {
    const { meeting } = await appointmentService.requestMoreSlots(meetingId);
    await afterMutation();
    return meeting;
  };

  const cancelMeeting = async (meetingId) => {
    const meeting = await appointmentService.cancelAppointment(meetingId);
    await afterMutation();
    return meeting;
  };

  const markUnavailable = async (meetingId) => {
    const { meeting } = await appointmentService.markUnavailable(meetingId);
    await afterMutation();
    return meeting;
  };

  const submitAttendance = async (meetingId, role, attended) => {
    const meeting = await appointmentService.submitAttendance(meetingId, role, attended);
    await refreshMeetings();
    return meeting;
  };

  const submitFeedback = async (meetingId, role, feedback) => {
    const meeting = await appointmentService.submitFeedback(meetingId, role, feedback);
    await afterMutation();
    return meeting;
  };

  const getMeetingsForUser = () => Meetings;

  const getCalendarEvents = async (userId, role) =>
    appointmentService.getCalendarEvents(userId, role);

  const getMentorAvailability = useCallback(async (mentorId) => {
    return availabilityService.getMentorOpenSlots(mentorId);
  }, []);

  const value = useMemo(
    () => ({
      Meetings,
      loading,
      refresh: refreshMeetings,
      refreshMeetings,
      createRequest,
      bookFromAvailability,
      rebookFromAvailability,
      saveWeekAvailability,
      getMyAvailability,
      approveRequest,
      rejectRequest,
      proposeSlots,
      selectSlot,
      requestMoreSlots,
      cancelMeeting,
      markUnavailable,
      submitAttendance,
      submitFeedback,
      getMeetingsForUser,
      getCalendarEvents,
      getMentorAvailability,
      mapSchedulingToMeetingstatus:
        appointmentService.mapSchedulingToMeetingstatus || fallbackMapStatus,
    }),
    [Meetings, loading, refreshMeetings, getMentorAvailability, getMyAvailability, saveWeekAvailability]
  );

  return (
    <SchedulingContext.Provider value={value}>{children}</SchedulingContext.Provider>
  );
}

export function useScheduling() {
  const ctx = useContext(SchedulingContext);
  if (!ctx) {
    throw new Error("useScheduling must be used within SchedulingProvider");
  }
  return ctx;
}
