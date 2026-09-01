import React from "react";
import {
  Box,
  LinearProgress,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { evaluatePasswordStrength } from "../../utils/passwordStrength";

const checkLabels = {
  length: "לפחות 8 תווים",
  uppercase: "אות גדולה באנגלית",
  lowercase: "אות קטנה באנגלית",
  number: "ספרה",
  special: "תו מיוחד",
};

export default function PasswordStrengthIndicator({ password }) {
  const { score, label, color, checks } = evaluatePasswordStrength(password);

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="caption">חוזק סיסמה</Typography>
        <Typography variant="caption" color={`${color}.main`}>
          {label}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={(score / 5) * 100}
        color={color}
        sx={{ height: 6, borderRadius: 3 }}
      />
      <List dense sx={{ py: 0 }}>
        {Object.entries(checkLabels).map(([key, text]) => (
          <ListItem key={key} sx={{ py: 0 }}>
            <ListItemIcon sx={{ minWidth: 28 }}>
              {checks[key] ? (
                <CheckCircleIcon color="success" fontSize="small" />
              ) : (
                <CancelIcon color="disabled" fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText primary={text} primaryTypographyProps={{ variant: "caption" }} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
