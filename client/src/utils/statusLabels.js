// central mapping for the entire application - every place that displays status (StatusBadge, filters, log and etc.)
// needs to pull the labels from here, so there are no multiple sources for the same thing.

export const STATUS_LABELS = {
    PENDING_MENTOR_TIMES: "Pending Mentor Times",
    PENDING_MENTEE_SELECTION: "Pending Mentee Selection",
    PENDING_MENTOR_APPROVAL: "Pending Mentor Approval",
    MATCHED: "Matched",
    ATTENDANCE_CONFIRMED: "Attendance Confirmed",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    NO_SHOW: "No Show",
    FEEDBACK_FILLED: "Feedback Filled",
  };
  
  // helper function: if a status is not recognized, at least show it in a readable format
  // (e.g. "SOME_NEW_STATUS" -> "Some New Status") instead of crashing.
  export function getStatusLabel(status) {
    if (!status) return "";
    if (STATUS_LABELS[status]) return STATUS_LABELS[status];
  
    return status
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }