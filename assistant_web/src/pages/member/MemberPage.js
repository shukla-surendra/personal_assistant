import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Alert,
  Snackbar,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { selectWorkspace, fetchWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace } from '../../slices/workspaces';
import { fetchMembers, addMember, removeMember, updateMemberRole, clearError } from '../../slices/members';

const MemberPage = () => {
  const dispatch = useDispatch();
  const { workspaces, loading: workspacesLoading } = useSelector((state) => state.workspaces);
  const { members, loading: membersLoading, error } = useSelector((state) => state.members);
  const [openWorkspaceDialog, setOpenWorkspaceDialog] = useState(false);
  const [openMemberDialog, setOpenMemberDialog] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    email: '',
    role: 'member',
  });

  useEffect(() => {
    dispatch(fetchWorkspaces());
    dispatch(fetchMembers());
  }, [dispatch]);

  const handleWorkspaceDialogOpen = (workspace = null) => {
    if (workspace) {
      setFormData({
        name: workspace.name,
        description: workspace.description,
      });
      setSelectedWorkspace(workspace);
    } else {
      setFormData({
        name: '',
        description: '',
      });
      setSelectedWorkspace(null);
    }
    setOpenWorkspaceDialog(true);
  };

  const handleMemberDialogOpen = (workspace) => {
    setSelectedWorkspace(workspace);
    setFormData({
      email: '',
      role: 'member',
    });
    setOpenMemberDialog(true);
  };

  const handleWorkspaceSubmit = () => {
    if (selectedWorkspace) {
      dispatch(updateWorkspace({ id: selectedWorkspace.id, ...formData }));
    } else {
      dispatch(createWorkspace(formData));
    }
    setOpenWorkspaceDialog(false);
  };

  const handleMemberSubmit = () => {
    if (!formData.email) {
      return;
    }
    dispatch(addMember({ workspaceId: selectedWorkspace.id, ...formData }));
    setOpenMemberDialog(false);
  };

  const handleDeleteWorkspace = (workspaceId) => {
    if (window.confirm('Are you sure you want to delete this workspace?')) {
      dispatch(deleteWorkspace(workspaceId));
    }
  };

  const handleRemoveMember = (memberId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      dispatch(removeMember(memberId));
    }
  };

  const handleCloseError = () => {
    dispatch(clearError());
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Workspace Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleWorkspaceDialogOpen()}
        >
          New Workspace
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Members</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workspaces.map((workspace) => (
              <TableRow key={workspace.id}>
                <TableCell>{workspace.name}</TableCell>
                <TableCell>{workspace.description}</TableCell>
                <TableCell>
                  {members
                    .filter((member) => member.workspaceId === workspace.id)
                    .map((member) => (
                      <Chip
                        key={member.id}
                        label={`${member.email} (${member.role})`}
                        onDelete={() => handleRemoveMember(member.id)}
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  <IconButton
                    size="small"
                    onClick={() => handleMemberDialogOpen(workspace)}
                  >
                    <AddIcon />
                  </IconButton>
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleWorkspaceDialogOpen(workspace)}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteWorkspace(workspace.id)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Workspace Dialog */}
      <Dialog open={openWorkspaceDialog} onClose={() => setOpenWorkspaceDialog(false)}>
        <DialogTitle>
          {selectedWorkspace ? 'Edit Workspace' : 'New Workspace'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenWorkspaceDialog(false)}>Cancel</Button>
          <Button onClick={handleWorkspaceSubmit} variant="contained">
            {selectedWorkspace ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Member Dialog */}
      <Dialog open={openMemberDialog} onClose={() => setOpenMemberDialog(false)}>
        <DialogTitle>Add Member</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={!formData.email}
            helperText={!formData.email ? 'Email is required' : ''}
          />
          <TextField
            margin="dense"
            label="Role"
            select
            fullWidth
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            SelectProps={{
              native: true,
            }}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMemberDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleMemberSubmit} 
            variant="contained"
            disabled={!formData.email}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MemberPage; 