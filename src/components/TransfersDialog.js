import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Box,
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material';
import { Close, Person } from '@mui/icons-material';
import TransfersTable from './TransfersTable';

export default function TransfersDialog({ open, onClose, selectedAccount, userId }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen={isMobile}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: isMobile ? 0 : 3,
                    minHeight: isMobile ? '100vh' : '80vh',
                }
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1,
                    px: 2,
                    borderBottom: (t) => `1px solid ${t.palette.divider}`,
                    bgcolor: 'background.paper',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {selectedAccount?.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        • {selectedAccount?.company?.company_name}
                    </Typography>
                </Box>
                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{ color: 'text.secondary' }}
                    aria-label="close"
                >
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0, bgcolor: 'background.default' }}>
                {selectedAccount?.company?.id && (
                    <TransfersTable entitySearch={userId} companyId={selectedAccount.company.id} />
                )}
            </DialogContent>
        </Dialog>
    );
}
