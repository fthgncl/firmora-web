// src/components/ReportAbsenceDialog.js
import React, {useState, useCallback} from 'react';
import axios from 'axios';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    useMediaQuery, useTheme, Box, Stack,
    TextField, Button, IconButton, Tooltip,
    CircularProgress, Typography
} from '@mui/material';

import CloseRounded from '@mui/icons-material/CloseRounded';
import Send from '@mui/icons-material/Send';
import Clear from '@mui/icons-material/Clear';
import AttachFile from '@mui/icons-material/AttachFile';
import CameraAlt from '@mui/icons-material/CameraAlt';
import InsertDriveFile from '@mui/icons-material/InsertDriveFile';
import Image from '@mui/icons-material/Image';
import PictureAsPdf from '@mui/icons-material/PictureAsPdf';
import Person from '@mui/icons-material/Person';
import Business from '@mui/icons-material/Business';
import EventAvailable from '@mui/icons-material/EventAvailable';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

import {useTranslation} from 'react-i18next';
import {useAuth} from '../contexts/AuthContext';
import {useAlert} from '../contexts/AlertContext';
import Paper from "@mui/material/Paper";
import Switch from "@mui/material/Switch";

// Tarihten formatlanmış string al (örn: "13 Ocak Pazartesi")
const getFormattedDate = (dateStr, locale) => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr + 'T00:00:00');
        const day = date.getDate();
        const month = date.toLocaleDateString(locale, {month: 'long'});
        const weekday = date.toLocaleDateString(locale, {weekday: 'long'});
        return `${day} ${month} ${weekday}`;
    } catch {
        return '';
    }
};

export default function ReportAbsenceDialog({open, onClose, sourceAccount = null, handleSuccess}) {
    const {t, i18n} = useTranslation(['absence', 'common']);
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const {token} = useAuth();
    const {showError, showSuccess} = useAlert();

    // derived
    const companyId = sourceAccount?.company?.id || null;

    // state
    const [submitting, setSubmitting] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('00:00');
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('23:59');
    const [allDay, setAllDay] = useState(true);
    const [description, setDescription] = useState('');
    const [attachedFiles, setAttachedFiles] = useState([]);

    const handleClose = useCallback(() => {
        if (submitting) return;
        onClose?.();
    }, [onClose, submitting]);

    // Tüm gün checkbox değiştiğinde
    const handleAllDayChange = useCallback((e) => {
        const checked = e.target.checked;
        setAllDay(checked);
        if (checked) {
            setStartTime('00:00');
            setEndTime('23:59');
        }
    }, []);

    // Başlangıç tarihi değiştiğinde
    const handleStartDateChange = useCallback((newStartDate) => {
        setStartDate(newStartDate);
        // Eğer bitiş tarihi daha erken ise veya boşsa, başlangıç tarihine eşitle
        if (!endDate || newStartDate > endDate) {
            setEndDate(newStartDate);
        }
    }, [endDate]);

    // Başlangıç saati değiştiğinde
    const handleStartTimeChange = useCallback((newStartTime) => {
        setStartTime(newStartTime);
        // Eğer tarihler aynıysa ve bitiş saati daha erken ise, başlangıç saatine eşitle
        if (startDate === endDate && newStartTime > endTime) {
            setEndTime(newStartTime);
        }
    }, [startDate, endDate, endTime]);

    // Bitiş tarihi değiştiğinde
    const handleEndDateChange = useCallback((newEndDate) => {
        setEndDate(newEndDate);
    }, []);

    // Bitiş saati değiştiğinde
    const handleEndTimeChange = useCallback((newEndTime) => {
        setEndTime(newEndTime);
        // Eğer tarihler aynıysa ve bitiş saati başlangıçtan erken ise, başlangıç saatini bitiş saatine eşitle
        if (startDate === endDate && newEndTime < startTime) {
            setStartTime(newEndTime);
        }
    }, [startDate, endDate, startTime]);

    // dosya yönetimi
    const handleFileSelect = useCallback((event) => {
        const files = Array.from(event.target.files || []);
        const validFiles = files.filter(file => {
            const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
            const isValidSize = file.size <= 25 * 1024 * 1024; // 25MB limit
            if (!isValidType) showError(t('absence:validations.invalid_file_type'));
            if (!isValidSize) showError(t('absence:validations.file_too_large'));
            return isValidType && isValidSize;
        });
        setAttachedFiles(prev => [...prev, ...validFiles]);
    }, [showError, t]);

    const handleRemoveFile = useCallback((index) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    }, []);

    const getFileIcon = (file) => {
        if (file.type === 'application/pdf') return <PictureAsPdf sx={{color: '#d32f2f'}}/>;
        if (file.type.startsWith('image/')) return <Image sx={{color: '#1976d2'}}/>;
        return <InsertDriveFile/>;
    };

    // doğrulama
    const validate = () => {
        if (!startDate) {
            showError(t('absence:validations.start_date_required'));
            return false;
        }
        if (!startTime) {
            showError(t('absence:validations.start_time_required'));
            return false;
        }
        if (!endDate) {
            showError(t('absence:validations.end_date_required'));
            return false;
        }
        if (!endTime) {
            showError(t('absence:validations.end_time_required'));
            return false;
        }

        // Başlangıç ve bitiş tarih-saat kontrolü
        const start = new Date(`${startDate}T${startTime}`);
        const end = new Date(`${endDate}T${endTime}`);

        if (start >= end) {
            showError(t('absence:validations.end_must_be_after_start'));
            return false;
        }

        return true;
    };

    // submit
    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        try {
            const formData = new FormData();

            formData.append('companyId', companyId);

            // Tarih ve saati ISO formatında gönder (saat dilimi dahil)
            const startDateTime = new Date(`${startDate}T${startTime}`);
            const endDateTime = new Date(`${endDate}T${endTime}`);

            formData.append('startDate', startDateTime.toISOString());
            formData.append('endDate', endDateTime.toISOString());

            if (description?.trim()) formData.append('description', description.trim());

            // dosyaları ekle
            attachedFiles.forEach((file) => {
                formData.append('files', file);
            });

            const res = await axios.post(
                `${process.env.REACT_APP_API_URL}/user-allowed-days/create`,
                formData,
                {
                    headers: {
                        'x-access-token': token,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            if (res?.data?.status === "success") {
                showSuccess(res?.data?.data?.message || t('absence:create.success'));
                // reset
                setStartDate('');
                setStartTime('00:00');
                setEndDate('');
                setEndTime('23:59');
                setAllDay(true);
                setDescription('');
                setAttachedFiles([]);
                onClose?.(res.data);

                if (typeof handleSuccess === 'function') {
                    handleSuccess();
                }
            } else {
                showError(res?.data?.error || t('absence:create.failed'));
            }
        } catch (e) {
            const apiMsg = e?.response?.data?.error || e?.message || t('absence:create.failed');
            showError(apiMsg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            fullScreen={fullScreen}
            PaperProps={{sx: {borderRadius: fullScreen ? 0 : 2}}}
        >
            <DialogTitle
                sx={{
                    pr: 6,
                    color: 'white',
                    background: 'linear-gradient(90deg, rgba(99,102,241,0.7), rgba(236,72,153,0.7))',
                    fontWeight: 600,
                    letterSpacing: 0.3,
                    position: 'relative',
                }}
            >
                {t('absence:dialog.title')}

                <IconButton
                    aria-label={t('common:close')}
                    onClick={handleClose}
                    edge="end"
                    sx={{
                        position: 'absolute',
                        right: 16,
                        top: 8,
                        color: 'white',
                        transition: 'opacity 0.2s ease',
                        '&:hover': {opacity: 0.8},
                    }}
                >
                    <CloseRounded/>
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{pt: 2}}>
                {/* Kaynak Hesap Kartı */}
                <Paper
                    elevation={3}
                    sx={{
                        mb: 3,
                        borderRadius: 3,
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            boxShadow: theme.shadows[6],
                        },
                    }}
                >
                    {/* Üst kısım: İkon ve Bilgiler */}
                    <Box sx={{p: 2.5, display: 'flex', alignItems: 'center', gap: 2}}>
                        <Paper
                            elevation={2}
                            sx={{
                                width: 60,
                                height: 60,
                                flexShrink: 0,
                                borderRadius: 2,
                                backgroundColor: theme.palette.background.paper,
                                border: `1px solid ${theme.palette.divider}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: theme.palette.text.primary,
                                transition: 'all 0.25s ease',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    color: theme.palette.primary.main,
                                    borderColor: theme.palette.primary.main,
                                },
                            }}
                        >
                            <Person fontSize="medium"/>
                        </Paper>

                        <Box sx={{flex: 1, minWidth: 0}}>
                            <Typography
                                variant="overline"
                                sx={{
                                    color: 'text.secondary',
                                    fontSize: '0.75rem',
                                    letterSpacing: 0.5,
                                    textTransform: 'uppercase',
                                    display: 'block',
                                }}
                            >
                                {t('absence:dialog.source_account')}
                            </Typography>

                            <Typography variant="subtitle1" sx={{fontWeight: 600, mb: 0.25}}>
                                {sourceAccount?.name || '-'}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Alt kısım: Firma bilgisi */}
                    <Box
                        sx={{
                            px: 2.5,
                            py: 1.75,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.primary.main}08 100%)`,
                            borderTop: `1px solid ${theme.palette.divider}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                        }}
                    >
                        <Business sx={{fontSize: 20, color: 'primary.main', opacity: 0.9}}/>
                        <Typography
                            variant="body2"
                            sx={{fontWeight: 600, color: 'text.primary'}}
                        >
                            {sourceAccount?.company?.company_name || '-'}
                        </Typography>
                    </Box>
                </Paper>

                {/* Hızlı Tarih Seçimi */}
                <Box sx={{mb: 3}}>
                    <Typography variant="subtitle2" sx={{mb: 1.5, color: 'text.secondary'}}>
                        {t('absence:quick_select')}
                    </Typography>
                    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                                const today = new Date().toISOString().split('T')[0];
                                handleStartDateChange(today);
                                handleEndDateChange(today);
                            }}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                            }}
                        >
                            {t('absence:today')}
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                                const tomorrow = new Date();
                                tomorrow.setDate(tomorrow.getDate() + 1);
                                const tomorrowStr = tomorrow.toISOString().split('T')[0];
                                handleStartDateChange(tomorrowStr);
                                handleEndDateChange(tomorrowStr);
                            }}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                            }}
                        >
                            {t('absence:tomorrow')}
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                                const today = new Date();
                                const nextMonday = new Date(today);
                                const dayOfWeek = today.getDay();
                                const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
                                nextMonday.setDate(today.getDate() + daysUntilMonday);
                                const mondayStr = nextMonday.toISOString().split('T')[0];
                                handleStartDateChange(mondayStr);
                                handleEndDateChange(mondayStr);
                            }}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                            }}
                        >
                            {t('absence:next_monday')}
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                                const today = new Date();
                                const monday = new Date(today);
                                const dayOfWeek = today.getDay();
                                const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
                                monday.setDate(today.getDate() + daysUntilMonday);
                                const friday = new Date(monday);
                                friday.setDate(monday.getDate() + 4);
                                handleStartDateChange(monday.toISOString().split('T')[0]);
                                handleEndDateChange(friday.toISOString().split('T')[0]);
                            }}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                            }}
                        >
                            {t('absence:next_week')}
                        </Button>
                    </Stack>
                </Box>

                {/* Tüm Gün */}
                <Paper
                    elevation={allDay ? 4 : 1}
                    sx={{
                        mb: 3,
                        p: 2.5,
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: allDay ? 'primary.main' : 'divider',
                        background: allDay
                            ? `linear-gradient(135deg,
                ${theme.palette.primary.main}12,
                ${theme.palette.primary.main}05
              )`
                            : 'transparent',
                        transition: 'all 0.25s ease',
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={2}>
                        {/* Sol ikon */}
                        <Paper
                            elevation={0}
                            sx={{
                                width: 44,
                                height: 44,
                                borderRadius: 2,
                                bgcolor: allDay ? 'primary.main' : 'action.hover',
                                color: allDay ? 'primary.contrastText' : 'text.secondary',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <EventAvailable fontSize="small"/>
                        </Paper>

                        {/* Metin */}
                        <Box sx={{flex: 1}}>
                            <Typography variant="subtitle2" fontWeight={600}>
                                {t('absence:fields.all_day')}
                            </Typography>

                            <Typography variant="caption" color="text.secondary">
                                {t('absence:hints.all_day')}
                            </Typography>
                        </Box>

                        {/* Switch */}
                        <Box>
                            <Switch
                                checked={allDay}
                                onChange={handleAllDayChange}
                                color="primary"
                            />
                        </Box>
                    </Stack>
                </Paper>


                {/* Başlangıç Tarihi ve Saati */}
                <DateTimeSection
                    allDay={allDay}
                    icon={<CalendarMonthIcon color="primary"/>}
                    title={t('absence:fields.start_datetime')}
                    subtitle={getFormattedDate(startDate, i18n.language)}
                >
                    <Stack
                        direction={{xs: 'column', sm: 'row'}}
                        spacing={2}
                    >
                        <TextField
                            type="date"
                            label={t('common:date')}
                            fullWidth
                            value={startDate}
                            onChange={(e) => handleStartDateChange(e.target.value)}
                            InputLabelProps={{shrink: true}}
                        />

                        <TextField
                            type="time"
                            label={t('common:time')}
                            fullWidth
                            value={startTime}
                            onChange={(e) => handleStartTimeChange(e.target.value)}
                            disabled={allDay}
                            InputLabelProps={{shrink: true}}
                        />
                    </Stack>
                </DateTimeSection>


                {/* Bitiş Tarihi ve Saati */}
                <DateTimeSection
                    allDay={allDay}
                    icon={<CalendarMonthIcon color="secondary"/>}
                    title={t('absence:fields.end_datetime')}
                    subtitle={getFormattedDate(endDate, i18n.language)}
                >
                    <Stack
                        direction={{xs: 'column', sm: 'row'}}
                        spacing={2}
                    >
                        <TextField
                            type="date"
                            label={t('common:date')}
                            fullWidth
                            value={endDate}
                            onChange={(e) => handleEndDateChange(e.target.value)}
                            InputLabelProps={{shrink: true}}
                        />

                        <TextField
                            type="time"
                            label={t('common:time')}
                            fullWidth
                            value={endTime}
                            onChange={(e) => handleEndTimeChange(e.target.value)}
                            disabled={allDay}
                            InputLabelProps={{shrink: true}}
                        />
                    </Stack>
                </DateTimeSection>


                {/* Açıklama */}
                <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label={t('absence:fields.description')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    inputProps={{maxLength: 255}}
                    sx={{mb: 2}}
                />

                {/* Dosya Yükleme */}
                <Box sx={{mb: 2}}>
                    <Typography variant="subtitle2" sx={{mb: 1}}>
                        {t('absence:fields.attachments')} ({t('common:optional')})
                    </Typography>

                    <Stack direction="row" spacing={1} sx={{mb: 1.5}}>
                        <Button
                            component="label"
                            variant="outlined"
                            startIcon={<AttachFile/>}
                            size="small"
                        >
                            {t('absence:buttons.attach_files')}
                            <input
                                type="file"
                                hidden
                                multiple
                                accept="image/*,application/pdf"
                                onChange={handleFileSelect}
                            />
                        </Button>

                        <Button
                            component="label"
                            variant="outlined"
                            startIcon={<CameraAlt/>}
                            size="small"
                            sx={{display: {xs: 'inline-flex', sm: 'none'}}}
                        >
                            {t('absence:buttons.take_photo')}
                            <input
                                type="file"
                                hidden
                                accept="image/*"
                                capture="environment"
                                onChange={handleFileSelect}
                            />
                        </Button>
                    </Stack>

                    {attachedFiles.length > 0 && (
                        <Stack spacing={1}>
                            {attachedFiles.map((file, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 1.5,
                                        bgcolor: 'rgba(0,0,0,0.03)',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                    }}
                                >
                                    <Stack direction="row" alignItems="center" spacing={1.5}>
                                        {getFileIcon(file)}
                                        <Box sx={{flexGrow: 1, minWidth: 0}}>
                                            <Typography variant="body2" noWrap sx={{fontWeight: 500}}>
                                                {file.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {(file.size / 1024).toFixed(1)} KB
                                            </Typography>
                                        </Box>
                                        <Tooltip title={t('common:remove')}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleRemoveFile(index)}
                                            >
                                                <Clear fontSize="small"/>
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </Box>
                            ))}
                        </Stack>
                    )}

                    <Typography variant="caption" color="text.secondary" sx={{display: 'block', mt: 0.5}}>
                        {t('absence:hints.file_upload', {maxSize: 25})}
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{px: 3, py: 2}}>
                <Button onClick={handleClose} disabled={submitting}>
                    {t('common:cancel')}
                </Button>
                <Box sx={{position: 'relative'}}>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        startIcon={<Send/>}
                        disabled={submitting}
                    >
                        {submitting ? t('common:please_wait') : t('absence:dialog.submit')}
                    </Button>
                    {submitting && (
                        <CircularProgress
                            size={24}
                            sx={{position: 'absolute', top: '50%', left: '50%', mt: '-12px', ml: '-12px'}}
                        />
                    )}
                </Box>
            </DialogActions>
        </Dialog>
    );
}

const DateTimeSection = ({ icon, title, subtitle, children, allDay }) => {
    const theme = useTheme();

    return (
        <Paper
            elevation={3}
            sx={{
                mb: 3,
                borderRadius: 3,
                overflow: 'hidden',
                opacity: allDay ? 0.85 : 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                    boxShadow: theme.shadows[6],
                },
            }}
        >
            {/* Üst alan */}
            <Box
                sx={{
                    p: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                }}
            >
                {/* İkon kartı */}
                <Paper
                    elevation={2}
                    sx={{
                        width: 52,
                        height: 52,
                        flexShrink: 0,
                        borderRadius: 2,
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: theme.palette.primary.main,
                        transition: 'all 0.25s ease',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            borderColor: theme.palette.primary.main,
                        },
                    }}
                >
                    {icon}
                </Paper>

                <Box sx={{flex: 1, minWidth: 0}}>

                    <Typography variant="subtitle1" sx={{fontWeight: 600}}>
                        {title}
                    </Typography>

                    <Typography
                        variant="overline"
                        sx={{
                            color: 'text.secondary',
                            fontSize: '0.75rem',
                            letterSpacing: 0.5,
                            textTransform: 'uppercase',
                            display: 'block',
                        }}
                    >
                        {subtitle}
                    </Typography>

                </Box>
            </Box>

            {/* İçerik */}
            <Box sx={{px: 2.5, pb: 2.5}}>
                {children}
            </Box>

            {/* Alt gradient bant */}
            <Box
                sx={{
                    height: 6,
                    background: `linear-gradient(90deg,
                        ${theme.palette.primary.main}70,
                        ${theme.palette.secondary.main}70
                    )`,
                }}
            />
        </Paper>
    );
};
