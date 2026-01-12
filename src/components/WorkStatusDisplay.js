import React from 'react';
import {
    Button,
    Typography,
} from '@mui/material';
import { WorkOutline, WorkOff, EventBusy } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const WorkStatusDisplay = ({ userId, companyId, isWorking }) => {
    const { t } = useTranslation(['accounts']);
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/company/${companyId}/user/${userId}/work-history`);
    };

    const getIcon = () => {
        if (isWorking === 1) return <WorkOutline fontSize="small" />;
        if (isWorking === 2) return <EventBusy fontSize="small" />;
        return <WorkOff fontSize="small" />;
    };

    const getBgColor = () => {
        if (isWorking === 1) return 'success.main';
        if (isWorking === 2) return 'error.main';
        return 'transparent';
    };

    const getBorderColor = () => {
        if (isWorking === 1) return 'success.main';
        if (isWorking === 2) return 'error.main';
        return 'divider';
    };

    const getTextColor = () => {
        if (isWorking === 1) return 'success.contrastText';
        if (isWorking === 2) return 'error.contrastText';
        return 'text.primary';
    };

    const getHoverBgColor = () => {
        if (isWorking === 1) return 'success.dark';
        if (isWorking === 2) return 'error.dark';
        return 'action.hover';
    };

    const getHoverBorderColor = () => {
        if (isWorking === 1) return 'success.dark';
        if (isWorking === 2) return 'error.dark';
        return 'divider';
    };

    const getStatusText = () => {
        if (isWorking === 1) return t('working');
        if (isWorking === 2) return t('workTimelineChart:allowed');
        return t('notWorking');
    };

    return (
        <Button
            size="small"
            onClick={handleClick}
            startIcon={getIcon()}
            aria-label={t('working')}
            sx={{
                border: 1,
                borderColor: getBorderColor(),
                borderRadius: 2,
                textTransform: 'none',
                px: 1.25,
                height: 32,
                bgcolor: getBgColor(),
                color: getTextColor(),
                '&:hover': {
                    backgroundColor: getHoverBgColor(),
                    borderColor: getHoverBorderColor(),
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
                    padding: 0.5
                }}
            >
                {getStatusText()}
            </Typography>
        </Button>
    );
};

export default WorkStatusDisplay;
