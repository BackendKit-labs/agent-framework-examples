import { useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, TextField, Chip, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';
// SVG icons inline
const MoreVertSvg = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>;
const EditSvg = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>;
const DeleteSvg = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>;
import { useWallets, useCreateWallet, useDeleteWallet } from '../../features/wallets/hooks/useWallets';
import { LoadingState } from '../../shared/components/LoadingState';
import { ErrorState } from '../../shared/components/ErrorState';
import client from '../../shared/api/client';

export default function WalletsPage() {
  const { data: wallets, isLoading, error, refetch } = useWallets();
  const createWallet = useCreateWallet();
  const deleteWallet = useDeleteWallet();
  const navigate = useNavigate();
  
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuWallet, setMenuWallet] = useState<any>(null);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  const handleCreate = () => {
    if (name.trim()) {
      createWallet.mutate({ name, description: description || undefined });
      setName('');
      setDescription('');
      setOpenCreate(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedWallet || !name.trim()) return;
    try {
      await client.patch(`/wallets/${selectedWallet.id}`, { name, description: description || undefined });
      refetch();
      setOpenEdit(false);
      setSelectedWallet(null);
    } catch (err) {
      console.error('Failed to update wallet', err);
    }
  };

  const handleDelete = async () => {
    if (!selectedWallet) return;
    try {
      await client.delete(`/wallets/${selectedWallet.id}`);
      refetch();
      setOpenDelete(false);
      setSelectedWallet(null);
    } catch (err) {
      console.error('Failed to delete wallet', err);
    }
  };

  const openMenu = (e: React.MouseEvent<HTMLElement>, wallet: any) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setMenuWallet(wallet);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuWallet(null);
  };

  const handleEditClick = () => {
    setSelectedWallet(menuWallet);
    setName(menuWallet.name);
    setDescription(menuWallet.description || '');
    setOpenEdit(true);
    closeMenu();
  };

  const handleDeleteClick = () => {
    setSelectedWallet(menuWallet);
    setOpenDelete(true);
    closeMenu();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Wallets</Typography>
        <Button variant="contained" onClick={() => setOpenCreate(true)}>+ New Wallet</Button>
      </Box>

      <Grid container spacing={2}>
        {wallets?.map(wallet => (
          <Grid item xs={12} sm={6} md={4} key={wallet.id}>
            <Card
              sx={{ cursor: 'pointer', '&:hover': { borderColor: 'primary.main' }, position: 'relative' }}
            >
              <CardContent onClick={() => navigate(`/wallets/${wallet.id}`)}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h6">{wallet.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      ${Number(wallet.totalValue).toLocaleString()}
                    </Typography>
                    <Box mt={1}>
                      <Chip
                        label={`${wallet.portfolioCount || 0} portfolios`}
                        size="small"
                        variant="outlined"
                      />
                      {wallet.description && (
                        <Typography variant="caption" display="block" color="text.secondary" mt={0.5}>
                          {wallet.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <IconButton size="small" onClick={(e) => openMenu(e, wallet)}>
                    <MoreVertSvg />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Menu */}
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeMenu}>
        <MenuItem onClick={handleEditClick}>
          <ListItemIcon><EditSvg /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon><DeleteSvg /></ListItemIcon>
          <ListItemText primary="Delete" primaryTypographyProps={{ color: 'error' }} />
        </MenuItem>
      </Menu>

      {/* Create Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Wallet</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Wallet Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            multiline
            rows={2}
          />
          <Button fullWidth variant="contained" onClick={handleCreate} sx={{ mt: 2 }}>
            Create
          </Button>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Wallet</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Wallet Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            multiline
            rows={2}
          />
          <Button fullWidth variant="contained" onClick={handleEdit} sx={{ mt: 2 }}>
            Save Changes
          </Button>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Wallet?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedWallet?.name}</strong>?
            This action cannot be undone.
          </Typography>
          <Box display="flex" gap={2} mt={2}>
            <Button fullWidth variant="outlined" onClick={() => setOpenDelete(false)}>
              Cancel
            </Button>
            <Button fullWidth variant="contained" color="error" onClick={handleDelete}>
              Delete
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
