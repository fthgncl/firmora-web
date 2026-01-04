import React from 'react';
import {
    Button,
    Typography,
} from '@mui/material';
import { WorkOutline, WorkOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const WorkStatusDisplay = ({ userId, companyId, isWorking }) => {
    const { t } = useTranslation(['accounts']);
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/company/${companyId}/user/${userId}/work-history`);
    };

    return (
        <Button
            size="small"
            onClick={handleClick}
            startIcon={isWorking === 1 ? <WorkOutline fontSize="small" /> : <WorkOff fontSize="small" />}
            aria-label={t('working')}
            sx={{
                border: 1,
                borderColor: isWorking === 1 ? 'success.main' : 'divider',
                borderRadius: 2,
                textTransform: 'none',
                px: 1.25,
                height: 32,
                bgcolor: isWorking === 1 ? 'success.main' : 'transparent',
                color: isWorking === 1 ? 'success.contrastText' : 'text.primary',
                '&:hover': {
                    backgroundColor: isWorking === 1 ? 'success.dark' : 'action.hover',
                    borderColor: isWorking === 1 ? 'success.dark' : 'divider',
                },
                '& .MuiButton-startIcon': {
                    display: { xs: 'flex', sm: 'flex' },
                    marginRight: { xs: 0, sm: 0.5 },
                },
            }}
            variant="text"
        >
            <Typography
                variant="subtitle2"
                sx={{
                    opacity: 0.9,
                    display: { xs: 'none', sm: 'block' }
                }}
            >
                {isWorking === 1 ? t('working') : t('notWorking')}
            </Typography>
        </Button>
    );
};

export default WorkStatusDisplay;
