import React, { useState } from "react";
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { useLanguage } from "../../context/LanguageContext";

export default function NotificationBell() {
  const { currentUser } = useAuth();
  const { getForUser, markAsRead, markAllAsRead, resolveMessage } = useNotifications();
  const { t } = useLanguage();
  const [anchorEl, setAnchorEl] = useState(null);

  if (!currentUser) return null;

  const items = getForUser(currentUser.id);
  const unread = items.filter((n) => !n.read).length;

  return (
    <>
      <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
        <Badge badgeContent={unread} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { width: 320, maxHeight: 400, borderRadius: 3 } }}
      >
        <Box sx={{ px: 2, py: 1, display: "flex", justifyContent: "space-between" }}>
          <Typography variant="subtitle2" fontWeight={700}>{t("notif.title")}</Typography>
          {unread > 0 && (
            <Button size="small" onClick={() => markAllAsRead(currentUser.id)}>
              {t("notif.markAllRead")}
            </Button>
          )}
        </Box>
        <Divider />
        {items.length === 0 && (
          <MenuItem disabled>
            <Typography variant="body2">{t("notif.empty")}</Typography>
          </MenuItem>
        )}
        {items.map((n) => (
          <MenuItem
            key={n.id}
            onClick={() => markAsRead(n.id)}
            sx={{ whiteSpace: "normal", bgcolor: n.read ? "inherit" : "action.hover" }}
          >
            <Box>
              <Typography variant="body2">{resolveMessage(n)}</Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(n.createdAt).toLocaleString()}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
