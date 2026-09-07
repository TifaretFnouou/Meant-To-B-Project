// import React, { useState, useEffect, useRef } from "react";
// import { Dialog, Box, Typography, Button, TextField, CircularProgress } from "@mui/material";
// import SendIcon from "@mui/icons-material/Send";
// import CloseIcon from "@mui/icons-material/Close";
// import { useLanguage } from "../../context/LanguageContext";
// import { useAuth } from "../../context/AuthContext";
// import { meetingChatService } from "../../services/meetingChatService";

// export default function MeetingChatModal({ open, onClose, meeting, otherUser }) {
//   const { t } = useLanguage();
//   const { currentUser } = useAuth();
//   const [messages, setMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState("");
//   const [loading, setLoading] = useState(false);
//   const messagesEndRef = useRef(null);
//   const prevMessagesCountRef = useRef(0); 
//   const meetingId = meeting?.id || meeting?._id;


//   useEffect(() => {
//     if (!open || !meetingId) return;
//     let isMounted = true;
//     setLoading(true);

//     meetingChatService.getMessages(meetingId)
//       .then((data) => {
//         if (isMounted) setMessages(data);
//       })
//       .catch((err) => console.error("Failed to load meeting messages", err))
//       .finally(() => {
//         if (isMounted) setLoading(false);
//       });

//     // Automatic polling every 4 seconds to get real-time messages from the other user
//     const interval = setInterval(() => {
//       meetingChatService.getMessages(meetingId)
//         .then((data) => {
//           if (isMounted) setMessages(data);
//         })
//         .catch(() => {});
//     }, 4000);

//     return () => {
//       isMounted = false;
//       clearInterval(interval);
//     };
//   }, [open, meetingId]);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   const handleSend = async (e) => {
//     e.preventDefault();
//     if (!newMessage.trim() || !meetingId) return;

//     try {
//       const sentMsg = await meetingChatService.sendMessage(meetingId, newMessage.trim());
//       setMessages((prev) => [...prev, sentMsg]);
//       setNewMessage("");
//     } catch (err) {
//       console.error("Failed to send meeting message", err);
//     }
//   };

//   const otherUserName = otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : "Private Chat";

//   return (
//     <Dialog
//       open={open}
//       onClose={onClose}
//       maxWidth="xs"
//       fullWidth
//       PaperProps={{
//         sx: {
//           borderRadius: 4,
//           background: "linear-gradient(to bottom, #fff5f5, #fffcf5)",
//           overflow: "hidden",
//           height: "500px",
//           display: "flex",
//           flexDirection: "column",
//         }
//       }}
//     >
//       {/* Chat title in AI design */}
//       <Box sx={{ p: 2, background: "linear-gradient(135deg, #d38a9b, #e6b8c4)", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//         <Box>
//           <Typography variant="subtitle1" fontWeight={700}>
//             {otherUserName}
//           </Typography>
//           <Typography variant="caption" sx={{ opacity: 0.9 }}>
//             {t("Direct messaging for this session")}
//           </Typography>
//         </Box>
//         <Button onClick={onClose} sx={{ color: "#fff", minWidth: "auto" }}>
//           <CloseIcon />
//         </Button>
//       </Box>

//       {/* גוף ההודעות */}
//       <Box sx={{ p: 2, flexGrow: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1.5 }}>
//         {loading ? (
//           <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
//             <CircularProgress size={28} sx={{ color: "#d38a9b" }} />
//           </Box>
//         ) : messages.length === 0 ? (
//           <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
//             {t("No messages yet. Start the conversation!")}
//           </Typography>
//         ) : (
//           messages.map((msg, index) => {
//             const isMe = String(msg.sender) === String(currentUser?.id) || msg.sender?._id === currentUser?.id;
//             return (
//               <Box
//                 key={index}
//                 sx={{
//                   alignSelf: isMe ? "flex-end" : "flex-start",
//                   bgcolor: isMe ? "#d38a9b" : "#fff",
//                   color: isMe ? "#fff" : "text.primary",
//                   p: 1.5,
//                   borderRadius: 2,
//                   maxWidth: "75%",
//                   boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
//                 }}
//               >
//                 <Typography variant="body2">{msg.text || msg.content}</Typography>
//               </Box>
//             );
//           })
//         )}
//         <div ref={messagesEndRef} />
//       </Box>

//       {/* Input line */}
//       <Box
//         component="form"
//         onSubmit={handleSend}
//         sx={{ p: 2, bgcolor: "#fff", display: "flex", gap: 1, alignItems: "center", borderTop: "1px solid rgba(0,0,0,0.06)" }}
//       >
//         <TextField
//           size="small"
//           fullWidth
//           placeholder={t("Type your message...")}
//           value={newMessage}
//           onChange={(e) => setNewMessage(e.target.value)}
//           sx={{
//             "& .MuiOutlinedInput-root": {
//               borderRadius: 5,
//               bgcolor: "#fcf8f8",
//               "& fieldset": { borderColor: "#e2bcbf" },
//               "&.Mui-focused fieldset": { borderColor: "#d38a9b" },
//             },
//           }}
//         />
//         <Button
//           type="submit"
//           variant="contained"
//           sx={{ minWidth: "auto", borderRadius: "50%", p: 1, bgcolor: "#d38a9b", "&:hover": { bgcolor: "#c07787" } }}
//         >
//           <SendIcon fontSize="small" />
//         </Button>
//       </Box>
//     </Dialog>
//   );
// }




import React, { useState, useEffect, useRef } from "react";
import { Dialog, Box, Typography, Button, TextField, CircularProgress } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { meetingChatService } from "../../services/meetingChatService";

export default function MeetingChatModal({ open, onClose, meeting, otherUser }) {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const prevMessagesCountRef = useRef(0); 
  const meetingId = meeting?.id || meeting?._id;

  // פונקציה להשמעת צליל פינג נעים כשמתקבלת הודעה חדשה
  const playPingSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // תדר נעים (D5)
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  useEffect(() => {
    if (!open || !meetingId) return;
    let isMounted = true;
    setLoading(true);

    meetingChatService.getMessages(meetingId)
      .then((data) => {
        if (isMounted) {
          setMessages(data);
          prevMessagesCountRef.current = data.length;
        }
      })
      .catch((err) => console.error("Failed to load meeting messages", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    // Automatic polling every 4 seconds to get real-time messages from the other user
    const interval = setInterval(() => {
      meetingChatService.getMessages(meetingId)
        .then((data) => {
          if (!isMounted) return;

          // בדיקה האם נוספה הודעה חדשה שאינה ממני כדי להשמיע פינג
          if (data.length > prevMessagesCountRef.current) {
            const latestMsg = data[data.length - 1];
            const isMe = String(latestMsg.sender) === String(currentUser?.id) || latestMsg.sender?._id === currentUser?.id;
            
            if (!isMe) {
              playPingSound();
            }
          }

          setMessages(data);
          prevMessagesCountRef.current = data.length;
        })
        .catch(() => {});
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [open, meetingId, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !meetingId) return;

    try {
      const sentMsg = await meetingChatService.sendMessage(meetingId, newMessage.trim());
      setMessages((prev) => {
        const updated = [...prev, sentMsg];
        prevMessagesCountRef.current = updated.length;
        return updated;
      });
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send meeting message", err);
    }
  };

  const otherUserName = otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : "Private Chat";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: "linear-gradient(to bottom, #fff5f5, #fffcf5)",
          overflow: "hidden",
          height: "500px",
          display: "flex",
          flexDirection: "column",
        }
      }}
    >
      {/* Chat title in AI design */}
      <Box sx={{ p: 2, background: "linear-gradient(135deg, #d38a9b, #e6b8c4)", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {otherUserName}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            {t("Direct messaging for this session")}
          </Typography>
        </Box>
        <Button onClick={onClose} sx={{ color: "#fff", minWidth: "auto" }}>
          <CloseIcon />
        </Button>
      </Box>

      {/* גוף ההודעות */}
      <Box sx={{ p: 2, flexGrow: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1.5 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <CircularProgress size={28} sx={{ color: "#d38a9b" }} />
          </Box>
        ) : messages.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
            {t("No messages yet. Start the conversation!")}
          </Typography>
        ) : (
          messages.map((msg, index) => {
            const isMe = String(msg.sender) === String(currentUser?.id) || msg.sender?._id === currentUser?.id;
            return (
              <Box
                key={index}
                sx={{
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  bgcolor: isMe ? "#d38a9b" : "#fff",
                  color: isMe ? "#fff" : "text.primary",
                  p: 1.5,
                  borderRadius: 2,
                  maxWidth: "75%",
                  minWidth: 0,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", wordBreak: "break-word" }}
                >
                  {msg.text || msg.content}
                </Typography>
              </Box>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input line */}
      <Box
        component="form"
        onSubmit={handleSend}
        sx={{ p: 2, bgcolor: "#fff", display: "flex", gap: 1, alignItems: "center", borderTop: "1px solid rgba(0,0,0,0.06)" }}
      >
        <TextField
          size="small"
          fullWidth
          placeholder={t("Type your message...")}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 5,
              bgcolor: "#fcf8f8",
              "& fieldset": { borderColor: "#e2bcbf" },
              "&.Mui-focused fieldset": { borderColor: "#d38a9b" },
            },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          sx={{ minWidth: "auto", borderRadius: "50%", p: 1, bgcolor: "#d38a9b", "&:hover": { bgcolor: "#c07787" } }}
        >
          <SendIcon fontSize="small" />
        </Button>
      </Box>
    </Dialog>
  );
}