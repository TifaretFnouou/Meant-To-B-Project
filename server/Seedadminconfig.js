 /**
 * One-time script that injects the entire original default list (from constants.js in the frontend)
 * into the AdminConfig document in the DB, to avoid typing everything manually via the UI.
 *
 * Execution (from the backend folder): node scripts/seedAdminConfig.js
 *
 * Note: If items need to be added in the future, it is best to do so via the UI
 * (Categories & Tags) - this script is intended only for a one-time population of the initial list.
 */

// Must be loaded before any use of process.env.MONGO_URI - exactly like in app.js

import "dotenv/config";

import mongoose from "mongoose";
import AdminConfig from "./models/adminConfig.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/queenb";

const DEFAULT_TECH_STACK = [
  "JavaScript", "TypeScript", "Python", "Java", "C#", "C++", "Go", "Rust",
  "React", "Next.js", "Vue.js", "Angular", "HTML", "CSS", "Tailwind CSS",
  "Node.js", "Express.js", "NestJS", "Django", "FastAPI", "Spring Boot", ".NET",
  "REST API", "GraphQL", "Microservices", "System Design", "WebSockets",
  "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",
  "Data Engineering", "Apache Kafka", "Apache Spark", "Airflow", "Snowflake", "Databricks",
  "Artificial Intelligence", "Machine Learning", "Generative AI", "LLMs", "AI Agents", "RAG", "PyTorch", "TensorFlow", "Hugging Face",
  "AWS", "Microsoft Azure", "Google Cloud",
  "Docker", "Kubernetes", "Terraform", "CI/CD", "Linux",
  "Testing", "Playwright", "Cypress", "Jest",
  "Cybersecurity", "Application Security", "DevSecOps",
  "Git", "GitHub", "GitLab", "Postman", "VS Code",
];

const DEFAULT_ADVICE_TOPICS = [
  "Career Advice", "Career Change", "Career Growth", "Job Search", "Job Interviews",
  "Salary Negotiation", "Resume & CV", "LinkedIn & Networking",
  "Software Engineering", "Frontend Development", "Backend Development", "Full Stack Development",
  "Mobile Development", "Software Architecture", "System Design", "Testing & QA",
  "Artificial Intelligence", "Generative AI", "Machine Learning", "Data Science",
  "Data Analytics", "Data Engineering", "Business Intelligence",
  "Cloud Computing", "DevOps", "Cybersecurity",
  "Product Management", "Startups", "SaaS", "FinTech", "Gaming",
  "Leadership", "Engineering Management", "Team Management", "Mentoring", "Productivity", "Work-Life Balance",
  "Blockchain & Web3", "IoT", "Robotics", "Open Source",
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to DB");

  let config = await AdminConfig.findOne({});

  if (!config) {
    config = await AdminConfig.create({
      techStack: DEFAULT_TECH_STACK,
      adviceTopics: DEFAULT_ADVICE_TOPICS,
    });
    console.log(`Created new AdminConfig with ${DEFAULT_TECH_STACK.length} technologies and ${DEFAULT_ADVICE_TOPICS.length} topics.`);
  } else {
      // add only items that don't exist yet, to avoid duplicates
      // if you've already added some manually in the meantime.
    const newTech = DEFAULT_TECH_STACK.filter((t) => !config.techStack.includes(t));
    const newTopics = DEFAULT_ADVICE_TOPICS.filter((t) => !config.adviceTopics.includes(t));

    config.techStack.push(...newTech);
    config.adviceTopics.push(...newTopics);
    await config.save();

    console.log(`Updated existing AdminConfig: added ${newTech.length} new technologies and ${newTopics.length} new topics.`);
  }

  console.log("\nDone. Refresh the Categories & Tags tab to see the full list.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});