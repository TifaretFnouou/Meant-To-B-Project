import { ROLES } from "../constants";

export function isActiveMentor(user) {
  return (
    user?.roles?.includes(ROLES.MENTOR) &&
    user?.mentorProfile &&
    user.mentorProfile.isActive !== false
  );
}

export function getCatalogMentors(users, excludeUserId = null) {
  if (!Array.isArray(users)) return [];

  return users.filter(
    (user) => isActiveMentor(user) && user.id !== excludeUserId
  );
}
