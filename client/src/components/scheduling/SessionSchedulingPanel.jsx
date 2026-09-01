import React, { useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  Divider,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import StatusBadge from "../common/StatusBadge";
import SlotPicker from "./SlotPicker";
import { SCHEDULING_STATE } from "../../constants";
import { useAuth } from "../../context/AuthContext";
import { useScheduling } from "../../context/SchedulingContext";

export default function SessionSchedulingPanel({ session, mentor, mentee }) {
  const { currentUser } = useAuth();
  const {
    approveRequest,
    rejectRequest,
    proposeSlots,
    selectSlot,
    requestMoreSlots,
    cancelSession,
    markUnavailable,
  } = useScheduling();

  const [localSlots, setLocalSlots] = useState(session.proposedSlots || []);
  const isMentor = currentUser.id === session.mentorId;
  const isMentee = currentUser.id === session.menteeId;
  const actorName = `${currentUser.firstName} ${currentUser.lastName}`;
  const state = session.schedulingState;

  const otherName = isMentor
    ? `${mentee?.firstName} ${mentee?.lastName}`
    : `${mentor?.firstName} ${mentor?.lastName}`;

  const handleApprove = () => {
    approveRequest(session.id, actorName);
  };

  const handleReject = () => {
    rejectRequest(session.id, actorName);
  };

  const handlePropose = () => {
    if (localSlots.length === 0) return;
    proposeSlots(session.id, localSlots, actorName);
  };

  const handleSelect = (slot) => {
    selectSlot(session.id, slot, actorName);
  };

  const handleRequestMore = () => {
    requestMoreSlots(session.id, actorName);
  };

  const handleCancel = () => {
    cancelSession(session.id, actorName);
  };

  const handleUnavailable = () => {
    markUnavailable(session.id, isMentor ? "mentor" : "mentee");
  };

  return (
    <Paper sx={{ p: 3, mb: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6">
          {isMentor ? `בקשה מ${otherName}` : `פגישה עם ${otherName}`}
        </Typography>
        <StatusBadge status={session.status} schedulingState={state} />
      </Box>

      {/* Step 1: Pending request - Mentor view */}
      {state === SCHEDULING_STATE.PENDING_REQUEST && isMentor && (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            בקשה חדשה לפגישת מנטורינג — אשרי ופתחי יומן, או דחי
          </Alert>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="contained" onClick={handleApprove}>
              אשרי ופתחי יומן
            </Button>
            <Button variant="outlined" color="error" onClick={handleReject}>
              דחי בקשה
            </Button>
          </Box>
        </Box>
      )}

      {state === SCHEDULING_STATE.PENDING_REQUEST && isMentee && (
        <Alert severity="warning">הבקשה נשלחה וממתינה למענה</Alert>
      )}

      {/* Rejected */}
      {state === SCHEDULING_STATE.REJECTED && (
        <Alert severity="error">
          הבקשה נדחתה. {isMentee && "אפשר לחזור לחיפוש מנטוריות."}
        </Alert>
      )}

      {/* Step 2: Propose slots - Mentor */}
      {(state === SCHEDULING_STATE.SLOTS_PROPOSED ||
        state === SCHEDULING_STATE.ADDITIONAL_SLOTS_REQUESTED ||
        state === SCHEDULING_STATE.RESCHEDULE_REQUESTED) &&
        isMentor && (
          <Box>
            <SlotPicker slots={localSlots} onChange={setLocalSlots} />
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={handlePropose}
              disabled={localSlots.length === 0}
            >
              שליחת זמנים
            </Button>
            {(state === SCHEDULING_STATE.ADDITIONAL_SLOTS_REQUESTED ||
              state === SCHEDULING_STATE.RESCHEDULE_REQUESTED) && (
              <Button color="error" sx={{ mt: 2, ml: 1 }} onClick={handleCancel}>
                ביטול
              </Button>
            )}
          </Box>
        )}

      {/* Step 3: Select slot - Mentee */}
      {(state === SCHEDULING_STATE.SLOTS_PROPOSED ||
        state === SCHEDULING_STATE.ADDITIONAL_SLOTS_PROPOSED) &&
        isMentee && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              בחרי מועד מתאים מהרשימה
            </Alert>
            <List>
              {session.proposedSlots.map((slot) => (
                <ListItemButton key={slot} onClick={() => handleSelect(slot)}>
                  <ListItemText primary={new Date(slot).toLocaleString("he-IL")} />
                </ListItemButton>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
            {!session.additionalSlotsUsed && (
              <Button variant="outlined" onClick={handleRequestMore}>
                לא מתאים לי אף זמן — בקשי זמנים נוספים
              </Button>
            )}
            <Button color="error" sx={{ ml: 1 }} onClick={handleCancel}>
              דחיית פגישה
            </Button>
          </Box>
        )}

      {(state === SCHEDULING_STATE.SLOTS_PROPOSED ||
        state === SCHEDULING_STATE.ADDITIONAL_SLOTS_PROPOSED) &&
        isMentor && (
          <Alert severity="success">הזמנים נשלחו — ממתינים לבחירת המנטית</Alert>
        )}

      {state === SCHEDULING_STATE.ADDITIONAL_SLOTS_REQUESTED && isMentee && (
        <Alert severity="info">בקשת זמנים נוספים נשלחה</Alert>
      )}

      {/* Matched */}
      {state === SCHEDULING_STATE.MATCHED && (
        <Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            הפגישה נקבעה ל-{new Date(session.matchedSlot).toLocaleString("he-IL")}
          </Alert>
          <Button variant="outlined" color="warning" onClick={handleUnavailable}>
            סימון אי-יכולת להגיע
          </Button>
        </Box>
      )}

      {state === SCHEDULING_STATE.CANCELLED && (
        <Alert severity="error">הפגישה בוטלה</Alert>
      )}

      {state === SCHEDULING_STATE.COMPLETED && (
        <Alert severity="success">הפגישה הושלמה</Alert>
      )}
    </Paper>
  );
}
