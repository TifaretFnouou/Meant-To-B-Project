import React, { useState } from "react";
import { Box, Paper, Typography, TextField, Button, Chip, Grid, Alert, CircularProgress } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAdminConfig } from "../../context/AdminConfigContext";

export default function ConfigTab() {
  const { techStack, adviceTopics, addTech, removeTech, addTopic, removeTopic, loading } = useAdminConfig();
  const [newTech, setNewTech] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleAddTech = async () => {
    if (!newTech.trim()) return;
    try {
      await addTech(newTech.trim());
      setNewTech("");
      setErrorMessage("");
    } catch (err) {
      console.error("[ConfigTab] Failed to add tech:", err);
      setErrorMessage("Saving the technology failed. Please try again.");
    }
  };

  const handleRemoveTech = async (item) => {
    try {
      await removeTech(item);
      setErrorMessage("");
    } catch (err) {
      console.error("[ConfigTab] Failed to remove tech:", err);
      setErrorMessage("Removing the technology failed. Please try again.");
    }
  };

  const handleAddTopic = async () => {
    if (!newTopic.trim()) return;
    try {
      await addTopic(newTopic.trim());
      setNewTopic("");
      setErrorMessage("");
    } catch (err) {
      console.error("[ConfigTab] Failed to add topic:", err);
      setErrorMessage("Saving the topic failed. Please try again.");
    }
  };

  const handleRemoveTopic = async (item) => {
    try {
      await removeTopic(item);
      setErrorMessage("");
    } catch (err) {
      console.error("[ConfigTab] Failed to remove topic:", err);
      setErrorMessage("Removing the topic failed. Please try again.");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage("")}>
          {errorMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Programming Languages / Technologies
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <TextField
                size="small"
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                placeholder="Add Technology"
                onKeyDown={(e) => e.key === "Enter" && handleAddTech()}
              />
              <Button variant="contained" onClick={handleAddTech}>
                Add
              </Button>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {techStack.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  onDelete={() => handleRemoveTech(t)}
                  deleteIcon={<DeleteIcon />}
                />
              ))}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Consultation Topics
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <TextField
                size="small"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Add Topic"
                onKeyDown={(e) => e.key === "Enter" && handleAddTopic()}
              />
              <Button variant="contained" onClick={handleAddTopic}>
                Add
              </Button>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {adviceTopics.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  onDelete={() => handleRemoveTopic(t)}
                  deleteIcon={<DeleteIcon />}
                />
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}