import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {
    Box,
    Container,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Alert,
    Button,
    Grid,
    Chip,
    Paper,
    IconButton,
    Dialog,
    DialogContent,
    DialogTitle,
    Avatar,
    Stack,
    Fade,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    ArrowBack,
    Person,
    Business,
    AccountBalance,
    CalendarToday,
    Description,
    AttachFile,
    Image as ImageIcon,
    PictureAsPdf,
    Close,
    TrendingFlat,
    CheckCircle,
    Schedule,
    Error as ErrorIcon,
    Cancel,
} from '@mui/icons-material';

import {useTranslation} from 'react-i18next';
import {useAuth} from '../contexts/AuthContext';
import {useAlert} from '../contexts/AlertContext';
import axios from 'axios';
import PDFViewer from '../components/PDFViewer';

const statusChipProps = (status) => {
    switch ((status || '').toLowerCase()) {
        case 'completed':
            return {color: 'success', label: 'Completed', icon: <CheckCircle sx={{fontSize: 18}} />};
        case 'pending':
            return {color: 'warning', label: 'Pending', icon: <Schedule sx={{fontSize: 18}} />};
        case 'failed':
            return {color: 'error', label: 'Failed', icon: <ErrorIcon sx={{fontSize: 18}} />};
        case 'reversed':
            return {color: 'default', label: 'Reversed', icon: <Cancel sx={{fontSize: 18}} />};
        default:
            return {color: 'default', label: status || '-', icon: null};
    }
};

const formatAmount = (amount, currency) => {
    try {
        const currencyCode = currency && /^[A-Z]{3}$/.test(currency) ? currency : 'USD';
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currencyCode,
            maximumFractionDigits: 2,
        }).format(Number(amount ?? 0));
    } catch {
        return `${amount} ${currency || ''}`.trim();
    }
};

const formatDateTime = (d) =>
    d ? new Date(d).toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }) : '-';

// Küçük görsel önizleme
function ImagePreview({ attachment, token }) {
    const [imageUrl, setImageUrl] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let objectUrl = null;

        const loadImage = async () => {
            try {
                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/transfers${attachment.download_url}`,
                    {
                        headers: {
                            'x-access-token': token,
                        },
                        responseType: 'blob',
                    }
                );

                objectUrl = window.URL.createObjectURL(response.data);
                setImageUrl(objectUrl);
            } catch (err) {
                console.error('Görsel yüklenirken hata:', err);
                setError(true);
            }
        };

        loadImage();

        return () => {
            if (objectUrl) {
                window.URL.revokeObjectURL(objectUrl);
            }
        };
    }, [attachment.download_url, token]);

    if (error) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 90 }}>
                <Typography variant="caption" color="error">Görsel yüklenemedi</Typography>
            </Box>
        );
    }

    if (!imageUrl) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 90 }}>
                <CircularProgress size={18} />
            </Box>
        );
    }

    return (
        <img
            src={imageUrl}
            alt={attachment.file_name}
            style={{
                width: '100%',
                height: 90,
                objectFit: 'cover',
                borderRadius: 8
            }}
        />
    );
}

// Büyük görsel
function ImageViewer({ attachment, token }) {
    const [imageUrl, setImageUrl] = useState(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let objectUrl = null;

        const loadImage = async () => {
            try {
                setLoading(true);
                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/transfers${attachment.download_url}`,
                    {
                        headers: {
                            'x-access-token': token,
                        },
                        responseType: 'blob',
                    }
                );

                objectUrl = window.URL.createObjectURL(response.data);
                setImageUrl(objectUrl);
            } catch (err) {
                console.error('Görsel yüklenirken hata:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        loadImage();

        return () => {
            if (objectUrl) {
                window.URL.revokeObjectURL(objectUrl);
            }
        };
    }, [attachment.download_url, token]);

    if (loading) {
        return (
            <Box sx={{
                p: 2,
                textAlign: 'center',
                bgcolor: 'grey.100',
                maxHeight: '100vh',
                overflow: 'auto',
            }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, p: 4 }}>
                <Typography variant="body1" color="error">Görsel yüklenirken hata oluştu</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.100' }}>
            <img
                src={imageUrl}
                alt={attachment.file_name}
                style={{
                    maxWidth: '100%',
                    maxHeight: '80vh',
                    objectFit: 'contain',
                }}
            />
        </Box>
    );
}

export default function TransferDetailPage() {
    const {transferId} = useParams();
    const navigate = useNavigate();
    const {t} = useTranslation(['transfers','common']);
    const {token} = useAuth();
    const {showError} = useAlert();

    const [loading, setLoading] = useState(true);
    const [transfer, setTransfer] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState(null);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => {
        const fetchTransferDetail = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await axios.post(
                    `${process.env.REACT_APP_API_URL}/transfers/get`,
                    {
                        transferId
                    },
                    {
                        headers: {
                            'x-access-token': token,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (response.data?.status === 'success' && response.data?.data?.transfer) {
                    const transferData = response.data.data.transfer;
                    const senderData = response.data.data.sender;
                    const receiverData = response.data.data.receiver;

                    const enrichedTransfer = {
                        ...transferData,
                        sender_name: senderData?.name,
                        sender_surname: senderData?.surname,
                        receiver_name: receiverData?.name,
                        receiver_surname: receiverData?.surname,
                    };

                    setTransfer(enrichedTransfer);

                    try {
                        const filesResponse = await axios.post(
                            `${process.env.REACT_APP_API_URL}/transfers/files`,
                            {
                                transferId: transferData.id
                            },
                            {
                                headers: {
                                    'x-access-token': token,
                                    'Content-Type': 'application/json',
                                },
                            }
                        );

                        if (filesResponse.data?.status === "success" && filesResponse.data?.files) {
                            const filesData = filesResponse.data.files;
                            const formattedAttachments = filesData.map((file, index) => ({
                                id: index,
                                file_name: file.fileName || `file-${index + 1}.${file.extension || 'bin'}`,
                                mime_type: file.mimeType || 'application/octet-stream',
                                file_size: file.size || 0,
                                download_url: file.downloadUrl,
                                extension: file.extension || '',
                            }));

                            setAttachments(formattedAttachments);
                        } else {
                            setAttachments([]);
                        }
                    } catch (filesError) {
                        console.error('Dosyalar yüklenirken hata:', filesError);
                        console.error('Hata detayı:', filesError.response?.data);
                        setAttachments([]);
                    }
                } else {
                    const errorMessage = response.data?.message || t('list.errors.fetchFailed');
                    setError(errorMessage);
                    showError(errorMessage);
                }
            } catch (error) {
                console.error('Transfer detayı yüklenirken hata:', error);
                const errorMessage = error?.response?.data?.message || t('list.errors.fetchFailed');
                setError(errorMessage);
                showError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        if (transferId && token) {
            fetchTransferDetail();
        }
        // eslint-disable-next-line
    }, [transferId, token]);

    const getFileUrl = (attachment) => {
        return `${process.env.REACT_APP_API_URL}/transfers${attachment.download_url}`;
    };

    const handleDownload = (attachment) => {
        const link = document.createElement('a');
        link.href = getFileUrl(attachment);
        link.download = attachment.file_name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getFileIcon = (mimeType) => {
        if (mimeType?.includes('pdf')) return <PictureAsPdf sx={{color: '#d32f2f', fontSize: 30}}/>;
        if (mimeType?.startsWith('image/')) return <ImageIcon sx={{color: '#1976d2', fontSize: 30}}/>;
        return <AttachFile sx={{fontSize: 28}}/>;
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{py: 4}}>
                <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh'}}>
                    <CircularProgress/>
                </Box>
            </Container>
        );
    }

    if (!transfer && !loading) {
        return (
            <Container maxWidth="lg" sx={{py: 4}}>
                <Alert severity="error" sx={{mb: 2}}>
                    {error || t('list.errors.notFound')}
                </Alert>
                <Button startIcon={<ArrowBack/>} onClick={() => navigate(-1)}>
                    {t('back', { ns: 'common' })}
                </Button>
            </Container>
        );
    }

    const {color: statusColor, label: statusLabel, icon: statusIcon} = statusChipProps(transfer.status);
    const senderFullName = [transfer.sender_name, transfer.sender_surname].filter(Boolean).join(' ') || transfer.from_external_name;
    const receiverFullName = [transfer.receiver_name, transfer.receiver_surname].filter(Boolean).join(' ') || transfer.to_external_name;

    const getScopeIcon = (scope) => {
        if (scope === 'external') return <AccountBalance/>;
        if (scope === 'company') return <Business/>;
        return <Person/>;
    };

    const getScopeColor = (scope) => {
        if (scope === 'external') return theme.palette.info.main;
        if (scope === 'company') return theme.palette.secondary.main;
        return theme.palette.success.main;
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                py: {xs: 3, md: 6},
                background: (t) =>
                    `radial-gradient(circle at top left, ${t.palette.primary.light}22, transparent 55%),
                     radial-gradient(circle at bottom right, ${t.palette.secondary.light}18, transparent 55%)`,
            }}
        >
            <Container maxWidth="lg">
                {/* Üst bar: geri + başlık + durum */}
                <Box sx={{mb: 3}}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBack />}
                            onClick={() => navigate(-1)}
                            sx={{
                                borderRadius: 999,
                                textTransform: 'none',
                                fontWeight: 500,
                            }}
                        >
                            {t('back', { ns: 'common' })}
                        </Button>

                        <Box sx={{flex: 1, minWidth: 0}}>
                            <Typography
                                variant="h5"
                                sx={{fontWeight: 700, letterSpacing: 0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}
                            >
                                {t('list.detail.title')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                #{transfer.id}
                            </Typography>
                        </Box>

                        <Chip
                            icon={statusIcon}
                            label={t(`list.status.${statusLabel.toLowerCase()}`, statusLabel)}
                            sx={{
                                fontWeight: 700,
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 999,
                                bgcolor: (theme) => {
                                    switch (statusColor) {
                                        case 'success':
                                            return theme.palette.success.main;
                                        case 'warning':
                                            return theme.palette.warning.main;
                                        case 'error':
                                            return theme.palette.error.main;
                                        default:
                                            return 'rgba(255,255,255,0.18)';
                                    }
                                },
                                color: '#fff',
                                '& .MuiChip-icon': {
                                    color: '#fff',
                                },
                            }}
                        />


                    </Stack>
                </Box>

                {/* Hero özet kartı (Tutar + Tarih + Transfer Türü) */}
                <Fade in timeout={500}>
                    <Card
                        elevation={0}
                        sx={{
                            mb: 4,
                            borderRadius: 3,
                            overflow: 'hidden',
                            background: "linear-gradient(135deg, #2b2b2b, #125696 70%, #bfa76f33)",
                            color: '#fff', // her zaman beyaz
                            px: {xs: 3, md: 4},
                            py: {xs: 3, md: 4},
                        }}
                    >
                        <Grid container spacing={3} alignItems="center">
                            {/* Amount */}
                            <Grid item xs={12} md={8}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        textTransform: 'uppercase',
                                        letterSpacing: 1.6,
                                        opacity: 0.8,
                                        fontWeight: 600,
                                    }}
                                >
                                    {t('list.columns.amount')}
                                </Typography>
                                <Typography
                                    variant="h3"
                                    sx={{
                                        fontWeight: 800,
                                        lineHeight: 1.1,
                                        mt: 1,
                                        wordBreak: 'break-word'
                                    }}
                                >
                                    {formatAmount(transfer.amount, transfer.currency)}
                                </Typography>
                            </Grid>

                            {/* Tarih + Transfer türü */}
                            <Grid item xs={12} md={4}>
                                <Stack
                                    spacing={1.5}
                                    alignItems={{xs: 'flex-start', md: 'flex-end'}}
                                    justifyContent="center"
                                >
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <CalendarToday fontSize="small" sx={{ color: '#fff', opacity: 0.9 }} />

                                        <Box>
                                            <Typography variant="caption" sx={{opacity: 0.85}}>
                                                {t('list.columns.created_at')}
                                            </Typography>
                                            <Typography variant="body2" sx={{fontWeight: 600}}>
                                                {formatDateTime(transfer.created_at)}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Box>
                                        <Typography
                                            variant="caption"
                                            sx={{opacity: 0.85, display: 'block', mb: 0.5}}
                                        >
                                            {t('list.columns.transfer_type')}
                                        </Typography>
                                        <Chip
                                            label={t(`list.types.${transfer.transfer_type}`, transfer.transfer_type)}
                                            size="small"
                                            sx={{
                                                fontWeight: 600,
                                                backgroundColor: 'rgba(0,0,0,0.25)',
                                                color: '#fff',
                                                '& .MuiChip-label': {
                                                    color: '#fff',
                                                },
                                            }}
                                        />

                                    </Box>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Card>
                </Fade>

                <Grid container spacing={3}>
                    {/* Sol taraf: katılımcılar + açıklama */}
                    <Grid item xs={12} md={8}>
                        {/* Katılımcılar */}
                        <Card elevation={0} sx={{mb: 3, borderRadius: 3, p: 3, border: '1px solid', borderColor: 'divider'}}>
                            <Typography variant="subtitle2" color="text.secondary" sx={{mb: 2, textTransform: 'uppercase', letterSpacing: 1}}>
                                {t('list.detail.transactionParties')}
                            </Typography>

                            <Grid container spacing={2} alignItems="stretch">
                                {/* Gönderici */}
                                <Grid item xs={12} md={5.5}>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            height: '100%',
                                            borderRadius: 2,
                                            p: 2,
                                            borderColor: getScopeColor(transfer.from_scope),
                                            backgroundColor: 'background.paper',
                                        }}
                                    >
                                        <Stack direction="row" spacing={2} alignItems="center" sx={{mb: 1.5}}>
                                            <Avatar
                                                sx={{
                                                    bgcolor: getScopeColor(transfer.from_scope),
                                                    color: 'primary.contrastText',
                                                    width: 52,
                                                    height: 52,
                                                }}
                                            >
                                                {getScopeIcon(transfer.from_scope)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="overline" sx={{color: 'text.secondary', letterSpacing: 1}}>
                                                    {t('list.detail.sender')}
                                                </Typography>
                                                <Typography variant="subtitle1" sx={{fontWeight: 700}}>
                                                    {senderFullName || '-'}
                                                </Typography>
                                                {transfer.sender_company_name && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        <Business sx={{fontSize: 16, mr: 0.5, verticalAlign: 'middle'}}/>
                                                        {transfer.sender_company_name}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Stack>
                                        {transfer.sender_final_balance != null && (
                                            <Box sx={{mt: 1.5}}>
                                                <Typography variant="caption" color="text.secondary" sx={{display: 'block'}}>
                                                    {t('list.columns.sender_final_balance')}
                                                </Typography>
                                                <Typography variant="body2" sx={{fontWeight: 600}}>
                                                    {formatAmount(transfer.sender_final_balance, transfer.currency)}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Paper>
                                </Grid>

                                {/* Ok */}
                                <Grid
                                    item
                                    xs={12}
                                    md={1}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Avatar
                                        sx={{
                                            bgcolor: 'background.paper',
                                            color: 'primary.main',
                                            width: 44,
                                            height: 44,
                                            border: '1px solid',
                                            borderColor: 'primary.main',
                                        }}
                                    >
                                        <TrendingFlat/>
                                    </Avatar>
                                </Grid>

                                {/* Alıcı */}
                                <Grid item xs={12} md={5.5}>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            height: '100%',
                                            borderRadius: 2,
                                            p: 2,
                                            borderColor: getScopeColor(transfer.to_scope),
                                            backgroundColor: 'background.paper',
                                        }}
                                    >
                                        <Stack direction="row" spacing={2} alignItems="center" sx={{mb: 1.5}}>
                                            <Avatar
                                                sx={{
                                                    bgcolor: getScopeColor(transfer.to_scope),
                                                    color: 'primary.contrastText',
                                                    width: 52,
                                                    height: 52,
                                                }}
                                            >
                                                {getScopeIcon(transfer.to_scope)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="overline" sx={{color: 'text.secondary', letterSpacing: 1}}>
                                                    {t('list.detail.receiver')}
                                                </Typography>
                                                <Typography variant="subtitle1" sx={{fontWeight: 700}}>
                                                    {receiverFullName || '-'}
                                                </Typography>
                                                {transfer.receiver_company_name && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        <Business sx={{fontSize: 16, mr: 0.5, verticalAlign: 'middle'}}/>
                                                        {transfer.receiver_company_name}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Stack>
                                        {transfer.receiver_final_balance != null && (
                                            <Box sx={{mt: 1.5}}>
                                                <Typography variant="caption" color="text.secondary" sx={{display: 'block'}}>
                                                    {t('list.columns.receiver_final_balance')}
                                                </Typography>
                                                <Typography variant="body2" sx={{fontWeight: 600}}>
                                                    {formatAmount(transfer.receiver_final_balance, transfer.currency)}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Card>

                        {/* Açıklama */}
                        {transfer.description && (
                            <Card elevation={0} sx={{borderRadius: 3, p: 3, border: '1px dashed', borderColor: 'divider'}}>
                                <Stack direction="row" spacing={2} alignItems="flex-start">
                                    <Avatar
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 2,
                                            backdropFilter: 'blur(6px)',
                                            background: (theme) =>
                                                theme.palette.mode === 'dark'
                                                    ? 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.10))'
                                                    : 'linear-gradient(135deg, rgba(0,0,0,0.10), rgba(0,0,0,0.05))',
                                            color: (theme) =>
                                                theme.palette.mode === 'dark'
                                                    ? theme.palette.common.white
                                                    : theme.palette.common.black,
                                        }}
                                    >
                                        <Description
                                            sx={{
                                                fontSize: 22,
                                                color: (theme) =>
                                                    theme.palette.mode === 'dark'
                                                        ? theme.palette.common.white
                                                        : theme.palette.common.black,
                                            }}
                                        />
                                    </Avatar>

                                    <Box sx={{flex: 1}}>
                                        <Typography variant="subtitle2" sx={{mb: 0.5}}>
                                            {t('list.columns.description')}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {transfer.description}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Card>
                        )}
                    </Grid>

                    {/* Sağ taraf: sadece Ekler (galeri) */}
                    <Grid item xs={12} md={4}>
                        {attachments.length > 0 && (
                            <Card
                                elevation={0}
                                sx={{
                                    borderRadius: 3,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    overflow: 'hidden',
                                }}
                            >
                                <CardContent>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{mb: 2}}>
                                        <Typography variant="subtitle2">
                                            <AttachFile sx={{verticalAlign: 'middle', mr: 1}}/>
                                            {t('list.detail.attachments')} ({attachments.length})
                                        </Typography>
                                    </Stack>

                                    {/* Galeri tarzı grid (isimler yok) */}
                                    <Grid container spacing={1.5}>
                                        {attachments.map((attachment) => {
                                            const isPreviewable =
                                                attachment.mime_type?.startsWith('image/') ||
                                                attachment.mime_type?.includes('pdf');
                                            return (
                                                <Grid item xs={4} sm={3} md={4} key={attachment.id}>
                                                    <Paper
                                                        elevation={1}
                                                        sx={{
                                                            borderRadius: 2,
                                                            overflow: 'hidden',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            p: attachment.mime_type?.startsWith('image/') ? 0 : 1.5,
                                                            height: 90,
                                                            '&:hover': {
                                                                boxShadow: 4,
                                                                transform: 'translateY(-2px)',
                                                            },
                                                            transition: 'all 0.15s ease-out',
                                                        }}
                                                        onClick={() => {
                                                            if (isPreviewable) {
                                                                setSelectedFile(attachment);
                                                            } else {
                                                                handleDownload(attachment);
                                                            }
                                                        }}
                                                    >
                                                        {attachment.mime_type?.startsWith('image/') ? (
                                                            <ImagePreview attachment={attachment} token={token} />
                                                        ) : (
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    width: '100%',
                                                                    height: '100%',
                                                                }}
                                                            >
                                                                {getFileIcon(attachment.mime_type)}
                                                            </Box>
                                                        )}
                                                    </Paper>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                </CardContent>
                            </Card>
                        )}
                    </Grid>
                </Grid>

                {/* Dosya önizleme dialog */}
                <Dialog
                    open={!!selectedFile}
                    onClose={() => setSelectedFile(null)}
                    maxWidth="lg"
                    fullWidth
                    fullScreen={isMobile}
                    PaperProps={{
                        sx: {
                            m: 0,
                            borderRadius: isMobile ? 0 : 2,
                        },
                    }}
                >
                    <DialogTitle
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            py: 1.5,
                        }}
                    >
                        <Typography variant="h6" sx={{fontWeight: 600}}>
                            {selectedFile?.file_name}
                        </Typography>
                        <IconButton onClick={() => setSelectedFile(null)} size="small">
                            <Close/>
                        </IconButton>
                    </DialogTitle>
                    <DialogContent
                        sx={{
                            p: isMobile ? 0 : 2,
                            height: isMobile ? '100vh' : 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        {selectedFile && (
                            <>
                                {selectedFile.mime_type?.startsWith('image/') ? (
                                    <ImageViewer attachment={selectedFile} token={token} />
                                ) : selectedFile.mime_type?.includes('pdf') ? (
                                    <PDFViewer
                                        fileUrl={`${process.env.REACT_APP_API_URL}/transfers${selectedFile.download_url}`}
                                        token={token}
                                    />
                                ) : null}
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            </Container>
        </Box>
    );
}
