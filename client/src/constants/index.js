export const ROLES = {
  ADMIN: "admin",
  MENTOR: "mentor",
  MENTEE: "mentee",
};

export const USER_MODES = {
  MENTEE: "mentee",
  MENTOR: "mentor",
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
  // Programming
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C#",
  "C++",
  "Go",
  "Rust",

  // Frontend
  "React",
  "Next.js",
  "Vue.js",
  "Angular",
  "HTML",
  "CSS",
  "Tailwind CSS",

  // Backend
  "Node.js",
  "Express.js",
  "NestJS",
  "Django",
  "FastAPI",
  "Spring Boot",
  ".NET",

  // APIs & Architecture
  "REST API",
  "GraphQL",
  "Microservices",
  "System Design",
  "WebSockets",

  // Databases
  "SQL",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "Elasticsearch",

  // Data
  "Data Engineering",
  "Apache Kafka",
  "Apache Spark",
  "Airflow",
  "Snowflake",
  "Databricks",

  // AI & Machine Learning
  "Artificial Intelligence",
  "Machine Learning",
  "Generative AI",
  "LLMs",
  "AI Agents",
  "RAG",
  "PyTorch",
  "TensorFlow",
  "Hugging Face",

  // Cloud
  "AWS",
  "Microsoft Azure",
  "Google Cloud",

  // DevOps
  "Docker",
  "Kubernetes",
  "Terraform",
  "CI/CD",
  "Linux",

  // Testing
  "Testing",
  "Playwright",
  "Cypress",
  "Jest",

  // Security
  "Cybersecurity",
  "Application Security",
  "DevSecOps",

  // Version Control & Tools
  "Git",
  "GitHub",
  "GitLab",
  "Postman",
  "VS Code"
];

export const DEFAULT_ADVICE_TOPICS = [
  // Career
  "Career Advice",
  "Career Change",
  "Career Growth",
  "Job Search",
  "Job Interviews",
  "Salary Negotiation",
  "Resume & CV",
  "LinkedIn & Networking",

  // Software Development
  "Software Engineering",
  "Frontend Development",
  "Backend Development",
  "Full Stack Development",
  "Mobile Development",
  "Software Architecture",
  "System Design",
  "Testing & QA",

  // AI & Data
  "Artificial Intelligence",
  "Generative AI",
  "Machine Learning",
  "Data Science",
  "Data Analytics",
  "Data Engineering",
  "Business Intelligence",

  // Cloud & Infrastructure
  "Cloud Computing",
  "DevOps",
  "Cybersecurity",

  // Product & Business
  "Product Management",
  "Startups",
  "SaaS",
  "FinTech",
  "Gaming",

  // Leadership & Work
  "Leadership",
  "Engineering Management",
  "Team Management",
  "Mentoring",
  "Productivity",
  "Work-Life Balance",

  // Emerging Tech
  "Blockchain & Web3",
  "IoT",
  "Robotics",
  "Open Source"
];

export const SESSION_LENGTHS = [45, 60, 90];
