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

  return users.filter((user) => {
    if (!isActiveMentor(user)) return false;
    if (excludeUserId != null && String(user.id) === String(excludeUserId)) {
      return false;
    }
    return true;
  });
}
