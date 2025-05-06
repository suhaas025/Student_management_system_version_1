import React, { useEffect, useState } from 'react';
import {
  getDashboardComponents,
  createComponent,
  updateComponent,
  deleteComponent,
  reorderComponents,
} from '../../services/dashboardApi';
import {
  Box, Button, Typography, CircularProgress, Alert, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Switch, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControlLabel, Checkbox, Chip
} from '@mui/material';
import { Edit, Delete, Add, DragIndicator } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAuth } from '../../context/AuthContext';

const defaultForm = {
  title: '', description: '', icon: '', displayOrder: 0, visible: true, allowedRoles: [], frontendRoute: '', backendEndpoint: '', componentType: 'card', configJson: '{}', parentId: null, themeJson: '{}', permissionsJson: '{}', translationsJson: '{}',
};

const ALL_ROLES = ['ADMIN', 'MODERATOR', 'USER'];

export default function DashboardAdminConfig() {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchComponents();
  }, []);

  function fetchComponents() {
    setLoading(true);
    getDashboardComponents()
      .then(data => {
        setComponents((data || []).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
        setLoading(false);
      })
      .catch(e => {
        setError(e.message || 'Failed to load components');
        setLoading(false);
      });
  }

  function handleOpenForm(comp) {
    setForm(comp ? { ...comp } : defaultForm);
    setEditingId(comp ? comp.id : null);
    setOpen(true);
  }
  function handleCloseForm() {
    setOpen(false);
    setForm(defaultForm);
    setEditingId(null);
  }
  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }
  function handleRoleToggle(role) {
    setForm(f => ({ ...f, allowedRoles: f.allowedRoles.includes(role) ? f.allowedRoles.filter(r => r !== role) : [...f.allowedRoles, role] }));
  }
  async function handleSave() {
    setSaving(true);
    try {
      if (editingId) {
        await updateComponent(editingId, form);
      } else {
        await createComponent(form);
      }
      handleCloseForm();
      fetchComponents();
    } catch (e) {
      alert(e.message || 'Save failed');
    }
    setSaving(false);
  }
  async function handleDelete(id) {
    if (!window.confirm('Delete this component?')) return;
    await deleteComponent(id);
    fetchComponents();
  }

  function onDragEnd(result) {
    if (!result.destination) return;
    const reordered = Array.from(components);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setComponents(reordered);
    reorderComponents(reordered.map(c => c.id));
  }

  if (loading) return <Box mt={4} display="flex" justifyContent="center"><CircularProgress /> </Box>;
  if (error) return <Box mt={4}><Alert severity="error">{error}</Alert></Box>;

  return (
    <Box mt={4} px={2}>
      <Typography variant="h4" gutterBottom>Admin Menu Management</Typography>
      <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => handleOpenForm(null)} sx={{ mb: 2 }}>Add Component</Button>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="menu-table">
          {(provided) => (
            <Table ref={provided.innerRef} {...provided.droppableProps}>
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell>Order</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Roles</TableCell>
                  <TableCell>Visible</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {components.map((comp, idx) => (
                  <Draggable key={comp.id} draggableId={String(comp.id)} index={idx}>
                    {(provided, snapshot) => (
                      <TableRow ref={provided.innerRef} {...provided.draggableProps} style={{ ...provided.draggableProps.style, background: snapshot.isDragging ? '#f0f0f0' : undefined }}>
                        <TableCell {...provided.dragHandleProps}><DragIndicator /></TableCell>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{comp.title}</TableCell>
                        <TableCell>{comp.componentType}</TableCell>
                        <TableCell>{comp.allowedRoles.map(r => <Chip key={r} label={r} size="small" />)}</TableCell>
                        <TableCell><Switch checked={comp.visible} disabled /></TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleOpenForm(comp)}><Edit /></IconButton>
                          <IconButton onClick={() => handleDelete(comp.id)}><Delete /></IconButton>
                        </TableCell>
                      </TableRow>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </TableBody>
            </Table>
          )}
        </Droppable>
      </DragDropContext>
      <Dialog open={open} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit' : 'Add'} Component</DialogTitle>
        <DialogContent>
          <TextField margin="dense" label="Title" name="title" value={form.title} onChange={handleFormChange} fullWidth />
          <TextField margin="dense" label="Description" name="description" value={form.description} onChange={handleFormChange} fullWidth />
          <TextField margin="dense" label="Icon" name="icon" value={form.icon} onChange={handleFormChange} fullWidth />
          <TextField margin="dense" label="Display Order" name="displayOrder" type="number" value={form.displayOrder} onChange={handleFormChange} fullWidth />
          <FormControlLabel control={<Switch checked={form.visible} onChange={e => setForm(f => ({ ...f, visible: e.target.checked }))} name="visible" />} label="Visible" />
          <Box mt={1} mb={1}>
            {ALL_ROLES.map(role => (
              <FormControlLabel key={role} control={<Checkbox checked={form.allowedRoles.includes(role)} onChange={() => handleRoleToggle(role)} />} label={role} />
            ))}
          </Box>
          <TextField margin="dense" label="Frontend Route" name="frontendRoute" value={form.frontendRoute} onChange={handleFormChange} fullWidth />
          <TextField margin="dense" label="Backend Endpoint" name="backendEndpoint" value={form.backendEndpoint} onChange={handleFormChange} fullWidth />
          <TextField margin="dense" label="Component Type" name="componentType" value={form.componentType} onChange={handleFormChange} fullWidth />
          <TextField margin="dense" label="Config JSON" name="configJson" value={form.configJson} onChange={handleFormChange} fullWidth multiline />
          <TextField margin="dense" label="Parent ID" name="parentId" value={form.parentId || ''} onChange={handleFormChange} fullWidth />
          <TextField margin="dense" label="Theme JSON" name="themeJson" value={form.themeJson} onChange={handleFormChange} fullWidth multiline />
          <TextField margin="dense" label="Permissions JSON" name="permissionsJson" value={form.permissionsJson} onChange={handleFormChange} fullWidth multiline />
          <TextField margin="dense" label="Translations JSON" name="translationsJson" value={form.translationsJson} onChange={handleFormChange} fullWidth multiline />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 