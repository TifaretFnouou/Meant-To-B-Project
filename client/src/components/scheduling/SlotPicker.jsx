import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  TextField,
} from "@mui/material";

export default function SlotPicker({ slots, onChange, readOnly = false }) {
  const [newSlot, setNewSlot] = useState("");

  const addSlot = () => {
    if (!newSlot) return;
    onChange([...slots, new Date(newSlot).toISOString()]);
    setNewSlot("");
  };

  const removeSlot = (index) => {
    onChange(slots.filter((_, i) => i !== index));
  };

  if (readOnly) {
    return (
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          זמנים מוצעים
        </Typography>
        <Grid container spacing={1}>
          {slots.map((slot) => (
            <Grid item key={slot}>
              <Chip label={new Date(slot).toLocaleString("he-IL")} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        יומן — סימון משבצות זמן פנויות
      </Typography>
      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          type="datetime-local"
          size="small"
          value={newSlot}
          onChange={(e) => setNewSlot(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <Button variant="outlined" onClick={addSlot}>
          הוספה
        </Button>
      </Box>
      <Grid container spacing={1}>
        {slots.map((slot, index) => (
          <Grid item key={slot}>
            <Chip
              label={new Date(slot).toLocaleString("he-IL")}
              onDelete={() => removeSlot(index)}
            />
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}
