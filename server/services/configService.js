import AdminConfig from "../models/adminConfig.js";

/**
 * returns the singleton config document. If it doesn't exist yet (e.g. on first project run)
 * it creates one automatically, so we don't have to worry about migrations.
 */

async function getOrCreateConfig() {
  let config = await AdminConfig.findOne({});
  if (!config) {
    config = await AdminConfig.create({ techStack: [], adviceTopics: [] });
  }
  return config;
}

export async function getConfig() {
  const config = await getOrCreateConfig();
  return {
    techStack: config.techStack,
    adviceTopics: config.adviceTopics,
  };
}

export async function addTech(item) {
  if (!item || !item.trim()) {
    throw Object.assign(new Error("Technology name is required"), { status: 400 });
  }
  const config = await getOrCreateConfig();
  const trimmed = item.trim();
  if (!config.techStack.includes(trimmed)) {
    config.techStack.push(trimmed);
    await config.save();
  }
  return config.techStack;
}

export async function removeTech(item) {
  const config = await getOrCreateConfig();
  config.techStack = config.techStack.filter((t) => t !== item);
  await config.save();
  return config.techStack;
}

export async function addTopic(item) {
  if (!item || !item.trim()) {
    throw Object.assign(new Error("Topic name is required"), { status: 400 });
  }
  const config = await getOrCreateConfig();
  const trimmed = item.trim();
  if (!config.adviceTopics.includes(trimmed)) {
    config.adviceTopics.push(trimmed);
    await config.save();
  }
  return config.adviceTopics;
}

export async function removeTopic(item) {
  const config = await getOrCreateConfig();
  config.adviceTopics = config.adviceTopics.filter((t) => t !== item);
  await config.save();
  return config.adviceTopics;
}