import React, { useState } from 'react';
import {
    Card,
    CardHeader,
    CardContent,
    Button,
    Avatar,
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import AddUserDialog from './AddUserDialog';

export default function AddUserToCompany({ companyId, onUserAdded }) {
    const { t } = useTranslation(['companyUsers']);
    const [open, setOpen] = useState(false);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    return (
        <>
            <Card>
                <CardHeader
                    title={t('companyUsers:card.title')}
                    subheader={t('companyUsers:card.subheader')}
                    avatar={
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <PersonAdd />
                        </Avatar>
                    }
                />
                <CardContent>
                    <Button
                        variant="contained"
                        startIcon={<PersonAdd />}
                        onClick={handleOpen}
                        fullWidth
                        size="large"
                    >
                        {t('companyUsers:card.openDialog')}
                    </Button>
                </CardContent>
            </Card>

            <AddUserDialog
                open={open}
                onClose={handleClose}
                companyId={companyId}
                onUserAdded={onUserAdded}
            />
        </>
    );
}
