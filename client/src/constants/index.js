export const ROLES = {
  ADMIN: "admin",
  MENTOR: "mentor",
  MENTEE: "mentee",
};

export const SESSION_STATUS = {
  PENDING: "pending",
  SLOTS_PROPOSED: "slots_proposed",
  MATCHED: "matched",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  RESCHEDULE: "reschedule",
};

export const SCHEDULING_STATE = {
  PENDING_REQUEST: "pending_request",
  REJECTED: "rejected",
  SLOTS_PROPOSED: "slots_proposed",
  SLOT_SELECTED: "slot_selected",
  MATCHED: "matched",
  ADDITIONAL_SLOTS_REQUESTED: "additional_slots_requested",
  ADDITIONAL_SLOTS_PROPOSED: "additional_slots_proposed",
  CANCELLED: "cancelled",
  RESCHEDULE_REQUESTED: "reschedule_requested",
  COMPLETED: "completed",
};

export const SCHEDULING_TRANSITIONS = {
  [SCHEDULING_STATE.PENDING_REQUEST]: {
    mentor: ["approve", "reject"],
    mentee: [],
  },
  [SCHEDULING_STATE.REJECTED]: {
    mentor: [],
    mentee: ["back_to_search"],
  },
  [SCHEDULING_STATE.SLOTS_PROPOSED]: {
    mentor: [],
    mentee: ["select_slot", "request_more_slots", "cancel"],
  },
  [SCHEDULING_STATE.ADDITIONAL_SLOTS_REQUESTED]: {
    mentor: ["propose_additional_slots", "cancel"],
    mentee: [],
  },
  [SCHEDULING_STATE.ADDITIONAL_SLOTS_PROPOSED]: {
    mentor: [],
    mentee: ["select_slot", "cancel"],
  },
  [SCHEDULING_STATE.SLOT_SELECTED]: {
    mentor: [],
    mentee: [],
  },
  [SCHEDULING_STATE.MATCHED]: {
    mentor: ["mark_unavailable"],
    mentee: ["mark_unavailable"],
  },
  [SCHEDULING_STATE.RESCHEDULE_REQUESTED]: {
    mentor: ["propose_additional_slots"],
    mentee: [],
  },
};

export const STATUS_LABELS = {
  [SESSION_STATUS.PENDING]: "ממתין לאישור",
  [SESSION_STATUS.SLOTS_PROPOSED]: "זמנים הוצעו",
  [SESSION_STATUS.MATCHED]: "נקבע",
  [SESSION_STATUS.CANCELLED]: "בוטל",
  [SESSION_STATUS.COMPLETED]: "הושלם",
  [SESSION_STATUS.RESCHEDULE]: "תיאום מחדש",
};

export const SCHEDULING_LABELS = {
  [SCHEDULING_STATE.PENDING_REQUEST]: "בקשה חדשה",
  [SCHEDULING_STATE.REJECTED]: "נדחה",
  [SCHEDULING_STATE.SLOTS_PROPOSED]: "זמנים פנויים",
  [SCHEDULING_STATE.SLOT_SELECTED]: "מועד נבחר",
  [SCHEDULING_STATE.MATCHED]: "פגישה נקבעה",
  [SCHEDULING_STATE.ADDITIONAL_SLOTS_REQUESTED]: "בקשה לזמנים נוספים",
  [SCHEDULING_STATE.ADDITIONAL_SLOTS_PROPOSED]: "זמנים נוספים הוצעו",
  [SCHEDULING_STATE.CANCELLED]: "בוטל",
  [SCHEDULING_STATE.RESCHEDULE_REQUESTED]: "תיאום מחדש",
  [SCHEDULING_STATE.COMPLETED]: "הושלם",
};

export const DEFAULT_TECH_STACK = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Python",
  "Java",
  "C#",
  "Go",
  "SQL",
  "MongoDB",
  "AWS",
  "Docker",
];

export const DEFAULT_ADVICE_TOPICS = [
  "ראיונות עבודה",
  "קורות חיים",
  "מעבר קריירה",
  "Full Stack",
  "Backend",
  "Frontend",
  "DevOps",
  "Leadership",
  "Startup",
];

export const SESSION_LENGTHS = [45, 60, 90];
