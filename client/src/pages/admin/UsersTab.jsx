import React, { useState } from "react";
import { 
  Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, 
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Link 
} from "@mui/material";
import { UserIdentity } from "../../components/common/UserAvatar";

export default function UsersTab({ users }) {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell align="center">Mentor Meetings</TableCell>
              <TableCell align="center">Mentee Meetings</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow 
                key={u.id || u._id} hover 
                onClick={() => setSelectedUser(u)} 
                sx={{ cursor: "pointer" }}
              >
                <TableCell><UserIdentity user={u} avatarSize={34} /></TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  {u.roles?.map((r) => (
                    <Chip key={r} label={r} size="small" sx={{ mr: 0.5 }} color={r === 'admin' ? 'secondary' : 'default'} />
                  ))}
                </TableCell>
                <TableCell align="center">{u.mentorProfile?.completedMeetings || 0}</TableCell>
                <TableCell align="center">{u.menteeProfile?.completedMeetings || 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={Boolean(selectedUser)} onClose={() => setSelectedUser(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>User Profile</DialogTitle>
        <DialogContent dividers>
          {selectedUser && (
            <Box>
              <Box sx={{ mb: 3 }}><UserIdentity user={selectedUser} avatarSize={64} /></Box>
              
              <Typography variant="subtitle1" fontWeight={600}>Professional Details</Typography>
              <Typography>Company: {selectedUser.company || "Not provided"}</Typography>
              <Typography>Job Title: {selectedUser.jobTitle || "Not provided"}</Typography>
              <Typography>Experience: {selectedUser.yearsOfExperience || 0} years</Typography>
              
              <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2 }}>Tech Stack</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                {selectedUser.techStack?.length > 0 ? selectedUser.techStack.map(t => (
                  <Chip key={t} label={t} size="small" />
                )) : <Typography variant="body2" color="text.secondary">None defined</Typography>}
              </Box>

              <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2 }}>Links</Typography>
              {selectedUser.linkedinUrl && <Link href={selectedUser.linkedinUrl} target="_blank" display="block">LinkedIn Profile</Link>}
              {selectedUser.githubUrl && <Link href={selectedUser.githubUrl} target="_blank" display="block">GitHub Profile</Link>}

              <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2 }}>Community Stats</Typography>
              <Typography>Meetings as Mentor: {selectedUser.mentorProfile?.completedMeetings || 0}</Typography>
              <Typography>Meetings as Mentee: {selectedUser.menteeProfile?.completedMeetings || 0}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedUser(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}