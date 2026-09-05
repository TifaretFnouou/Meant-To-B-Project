import React, { useEffect, useState } from "react";
import { Avatar, Box, Typography } from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

export function getUserInitials(user = {}) {
  const firstInitial = user.firstName?.trim()?.[0] || "";
  const lastInitial = user.lastName?.trim()?.[0] || "";
  return `${firstInitial}${lastInitial}`.toLocaleUpperCase();
}

export default function UserAvatar({
  user = {},
  src,
  size = 40,
  sx,
  ...props
}) {
  const imageSource = src ?? user.profilePicture;
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageSource]);

  const initials = getUserInitials(user);

  return (
    <Avatar
      src={imageSource && !imageFailed ? imageSource : undefined}
      imgProps={{ onError: () => setImageFailed(true) }}
      alt={`${user.firstName || ""} ${user.lastName || ""}`.trim()}
      sx={{
        width: size,
        height: size,
        bgcolor: "primary.main",
        color: "primary.contrastText",
        fontSize: size <= 40 ? "0.82rem" : "1rem",
        fontWeight: 800,
        flexShrink: 0,
        ...sx,
      }}
      {...props}
    >
      {initials || <PersonOutlineIcon sx={{ fontSize: size * 0.52 }} />}
    </Avatar>
  );
}

export function UserIdentity({
  user,
  avatarSize = 36,
  secondary,
  showAvatar = true,
  sx,
  nameProps,
}) {
  if (!user) return null;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, ...sx }}>
      {showAvatar && <UserAvatar user={user} size={avatarSize} />}
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="body2"
          fontWeight={700}
          noWrap
          {...nameProps}
        >
          {user.firstName} {user.lastName}
        </Typography>
        {secondary && (
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {secondary}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
