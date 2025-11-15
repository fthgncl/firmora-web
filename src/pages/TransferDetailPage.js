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
    Avatar,
    Stack,
    Fade,
    Grow,
    Zoom,
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

// Görsel önizleme için yardımcı component
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

        // Cleanup: blob URL'i temizle
        return () => {
            if (objectUrl) {
                window.URL.revokeObjectURL(objectUrl);
            }
        };
    }, [attachment.download_url, token]);

    if (error) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
                <Typography variant="caption" color="error">Görsel yüklenemedi</Typography>
            </Box>
        );
    }

    if (!imageUrl) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    return (
        <img
            src={imageUrl}
            alt={attachment.file_name}
            style={{
                width: '100%',
                height: 120,
                objectFit: 'cover',
                borderRadius: 8
            }}
        />
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
    const [selectedImage, setSelectedImage] = useState(null);
    const [error, setError] = useState(null);

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

                    // Transfer verisine sender ve receiver bilgilerini ekle
                    const enrichedTransfer = {
                        ...transferData,
                        sender_name: senderData?.name,
                        sender_surname: senderData?.surname,
                        receiver_name: receiverData?.name,
                        receiver_surname: receiverData?.surname,
                    };

                    setTransfer(enrichedTransfer);

                    // Transfer dosya listesini API'den çek
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
                                download_url: file.downloadUrl, // /file/TOKEN formatında geliyor
                                extension: file.extension || '',
                            }));

                            setAttachments(formattedAttachments);
                        } else {
                            console.log('Dosya bulunamadı veya API yanıtı beklenen formatta değil');
                            setAttachments([]);
                        }
                    } catch (filesError) {
                        console.error('Dosyalar yüklenirken hata:', filesError);
                        console.error('Hata detayı:', filesError.response?.data);
                        // Dosya hatası olsa bile transfer bilgisi gösterilsin
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
        // API'den gelen downloadUrl zaten /file/TOKEN formatında geliyor
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
        if (mimeType?.includes('pdf')) return <PictureAsPdf sx={{color: '#d32f2f', fontSize: 48}}/>;
        if (mimeType?.startsWith('image/')) return <ImageIcon sx={{color: '#1976d2', fontSize: 48}}/>;
        return <AttachFile sx={{fontSize: 48}}/>;
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
        if (scope === 'external') return '#1976d2';
        if (scope === 'company') return '#9c27b0';
        return '#2e7d32';
    };

    return (
        <Container maxWidth="lg" sx={{py: 4}}>
            {/* Başlık */}
            <Fade in timeout={500}>
                <Box sx={{mb: 3}}>
                    <Paper elevation={1} sx={{p: 2.5, borderRadius: 2}}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <IconButton 
                                onClick={() => navigate(-1)} 
                                sx={{
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    '&:hover': {
                                        bgcolor: 'primary.dark',
                                        transform: 'scale(1.05)',
                                    },
                                    transition: 'all 0.3s',
                                }}
                            >
                                <ArrowBack/>
                            </IconButton>
                            <Typography variant="h4" sx={{fontWeight: 800, flex: 1, color: 'primary.main'}}>
                                {t('list.detail.title')}
                            </Typography>
                            <Chip
                                icon={statusIcon}
                                color={statusColor}
                                label={t(`list.status.${statusLabel.toLowerCase()}`, statusLabel)}
                                sx={{
                                    fontWeight: 700,
                                    fontSize: '0.95rem',
                                    px: 1,
                                    py: 2.5,
                                    boxShadow: 2,
                                }}
                            />
                        </Stack>
                    </Paper>
                </Box>
                                </Fade>

                                <Grid container spacing={3}>
                    {/* Sol Kolon - Transfer Bilgileri */}
                    <Grid item xs={12} md={8}>
                        {/* Ana Transfer Kartı */}
                        <Grow in timeout={700}>
                            <Card sx={{mb: 3}}>
                                <CardContent sx={{p: 4}}>
                                    {/* Transfer ID Badge */}
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        mb: 2,
                                    }}>
                                        <Chip 
                                            label={`#${transfer.id}`}
                                            size="small"
                                            sx={{
                                                bgcolor: 'rgba(102, 126, 234, 0.1)',
                                                color: 'primary.main',
                                                fontWeight: 700,
                                                fontSize: '0.85rem',
                                            }}
                                        />
                                    </Box>

                                    {/* Büyük Tutar Gösterimi */}
                                    <Zoom in timeout={1000}>
                                        <Box sx={{
                                            textAlign: 'center',
                                            py: 4,
                                            mb: 4,
                                            bgcolor: 'primary.main',
                                            borderRadius: 2,
                                        }}>
                                            <Typography variant="caption" sx={{
                                                color: 'primary.contrastText',
                                                textTransform: 'uppercase',
                                                letterSpacing: 1.5,
                                                fontWeight: 600,
                                                mb: 1,
                                                display: 'block',
                                                opacity: 0.9,
                                            }}>
                                                {t('list.columns.amount')}
                                            </Typography>
                                            <Typography variant="h2" sx={{
                                                fontWeight: 700,
                                                color: 'primary.contrastText',
                                            }}>
                                                {formatAmount(transfer.amount, transfer.currency)}
                                            </Typography>
                                        </Box>
                                    </Zoom>

                                    {/* Timeline Görünümü - Gönderici ve Alıcı */}
                                    <Box sx={{position: 'relative', mb: 4}}>
                                        <Grid container spacing={3} alignItems="stretch">
                                            {/* Gönderici */}
                                            <Grid item xs={12} md={5}>
                                                <Fade in timeout={1200}>
                                                    <Paper elevation={2} sx={{
                                                        p: 3,
                                                        height: '100%',
                                                        borderLeft: 4,
                                                        borderColor: getScopeColor(transfer.from_scope),
                                                    }}>
                                                        <Stack direction="row" spacing={2} alignItems="center" sx={{mb: 2}}>
                                                            <Avatar sx={{
                                                                bgcolor: getScopeColor(transfer.from_scope),
                                                                width: 48,
                                                                height: 48,
                                                            }}>
                                                                {getScopeIcon(transfer.from_scope)}
                                                            </Avatar>
                                                            <Box>
                                                                <Typography variant="caption" sx={{
                                                                    color: 'text.secondary',
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: 1,
                                                                    fontWeight: 600,
                                                                }}>
                                                                    {t('list.detail.sender')}
                                                                </Typography>
                                                                <Typography variant="h6" sx={{fontWeight: 700, color: getScopeColor(transfer.from_scope)}}>
                                                                    {senderFullName || '-'}
                                                                </Typography>
                                                            </Box>
                                                        </Stack>
                                                        {transfer.sender_company_name && (
                                                            <Typography variant="body2" color="text.secondary" sx={{fontWeight: 500, mb: 2}}>
                                                                <Business sx={{fontSize: 16, verticalAlign: 'middle', mr: 0.5}}/>
                                                                {transfer.sender_company_name}
                                                            </Typography>
                                                        )}
                                                        {transfer.sender_final_balance != null && (
                                                            <Box sx={{mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1}}>
                                                                <Typography variant="caption" color="text.secondary" sx={{display: 'block', mb: 0.5}}>
                                                                    {t('list.columns.sender_final_balance')}
                                                                </Typography>
                                                                <Typography variant="body1" sx={{fontWeight: 600}}>
                                                                    {formatAmount(transfer.sender_final_balance, transfer.currency)}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </Paper>
                                                </Fade>
                                            </Grid>

                                            {/* Ok işareti - Orta */}
                                            <Grid item xs={12} md={2} sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}>
                                                <Avatar sx={{
                                                    bgcolor: 'white',
                                                    color: 'primary.main',
                                                    width: 56,
                                                    height: 56,
                                                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                                                    border: '3px solid',
                                                    borderColor: 'primary.main',
                                                }}>
                                                    <TrendingFlat sx={{fontSize: 32}}/>
                                                </Avatar>
                                            </Grid>

                                            {/* Alıcı */}
                                            <Grid item xs={12} md={5}>
                                                <Fade in timeout={1400}>
                                                    <Paper elevation={2} sx={{
                                                        p: 3,
                                                        height: '100%',
                                                        borderLeft: 4,
                                                        borderColor: getScopeColor(transfer.to_scope),
                                                    }}>
                                                        <Stack direction="row" spacing={2} alignItems="center" sx={{mb: 2}}>
                                                            <Avatar sx={{
                                                                bgcolor: getScopeColor(transfer.to_scope),
                                                                width: 48,
                                                                height: 48,
                                                            }}>
                                                                {getScopeIcon(transfer.to_scope)}
                                                            </Avatar>
                                                            <Box>
                                                                <Typography variant="caption" sx={{
                                                                    color: 'text.secondary',
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: 1,
                                                                    fontWeight: 600,
                                                                }}>
                                                                    {t('list.detail.receiver')}
                                                                </Typography>
                                                                <Typography variant="h6" sx={{fontWeight: 700, color: getScopeColor(transfer.to_scope)}}>
                                                                    {receiverFullName || '-'}
                                                                </Typography>
                                                            </Box>
                                                        </Stack>
                                                        {transfer.receiver_company_name && (
                                                            <Typography variant="body2" color="text.secondary" sx={{fontWeight: 500, mb: 2}}>
                                                                <Business sx={{fontSize: 16, verticalAlign: 'middle', mr: 0.5}}/>
                                                                {transfer.receiver_company_name}
                                                            </Typography>
                                                        )}
                                                        {transfer.receiver_final_balance != null && (
                                                            <Box sx={{mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1}}>
                                                                <Typography variant="caption" color="text.secondary" sx={{display: 'block', mb: 0.5}}>
                                                                    {t('list.columns.receiver_final_balance')}
                                                                </Typography>
                                                                <Typography variant="body1" sx={{fontWeight: 600}}>
                                                                    {formatAmount(transfer.receiver_final_balance, transfer.currency)}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </Paper>
                                                </Fade>
                                            </Grid>
                                        </Grid>
                                    </Box>

                                    {/* Açıklama */}
                                    {transfer.description && (
                                        <Fade in timeout={1600}>
                                            <Paper elevation={0} sx={{
                                                p: 3,
                                                bgcolor: 'action.hover',
                                                borderLeft: 4,
                                                borderColor: 'primary.main',
                                            }}>
                                                <Stack direction="row" spacing={2} alignItems="flex-start">
                                                    <Description color="primary" />
                                                    <Box sx={{flex: 1}}>
                                                        <Typography variant="subtitle2" color="text.secondary" sx={{mb: 1}}>
                                                            {t('list.columns.description')}
                                                        </Typography>
                                                        <Typography variant="body1">
                                                            {transfer.description}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </Paper>
                                        </Fade>
                                    )}
                                </CardContent>
                            </Card>
                        </Grow>
                    </Grid>

                    {/* Sağ Kolon - Ek Bilgiler ve Dosyalar */}
                    <Grid item xs={12} md={4}>
                        {/* Tarih ve Tip Bilgileri */}
                        <Grow in timeout={900}>
                            <Card sx={{mb: 3}}>
                                <CardContent>
                                    <Typography variant="h6" sx={{mb: 2, fontWeight: 600}}>
                                        {t('list.detail.additionalInfo')}
                                    </Typography>

                                                                                <Stack spacing={2}>
                                        {/* Tarih */}
                                        <Box sx={{display: 'flex', gap: 1.5, alignItems: 'center'}}>
                                            <CalendarToday fontSize="small" color="action"/>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    {t('list.columns.created_at')}
                                                </Typography>
                                                <Typography variant="body2" sx={{fontWeight: 600}}>
                                                    {formatDateTime(transfer.created_at)}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* Transfer Tipi */}
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" sx={{display: 'block', mb: 0.5}}>
                                                {t('list.columns.transfer_type')}
                                            </Typography>
                                            <Chip
                                                label={t(`list.types.${transfer.transfer_type}`, transfer.transfer_type)}
                                                size="small"
                                                color="primary"
                                                sx={{fontWeight: 600}}
                                            />
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grow>

                        {/* Dosya Ekleri */}
                        {attachments.length > 0 && (
                            <Grow in timeout={1100}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" sx={{mb: 2, fontWeight: 600}}>
                                            <AttachFile sx={{verticalAlign: 'middle', mr: 1}}/>
                                            {t('list.detail.attachments')} ({attachments.length})
                                        </Typography>

                                        <Grid container spacing={2}>
                                            {attachments.map((attachment, index) => (
                                                <Grid item xs={6} key={attachment.id}>
                                                    <Zoom in timeout={1200 + index * 100}>
                                                        <Paper
                                                            elevation={1}
                                                            sx={{
                                                                p: 2,
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s',
                                                                '&:hover': {
                                                                    elevation: 3,
                                                                    transform: 'translateY(-4px)',
                                                                },
                                                            }}
                                                            onClick={() => {
                                                                if (attachment.mime_type?.startsWith('image/')) {
                                                                    setSelectedImage(attachment);
                                                                } else {
                                                                    handleDownload(attachment);
                                                                }
                                                            }}
                                                        >
                                                            <Box sx={{
                                                                textAlign: 'center',
                                                                mb: 1,
                                                            }}>
                                                                {attachment.mime_type?.startsWith('image/') ? (
                                                                    <ImagePreview 
                                                                        attachment={attachment} 
                                                                        token={token}
                                                                    />
                                                                ) : (
                                                                    <Box sx={{py: 2}}>
                                                                        {getFileIcon(attachment.mime_type)}
                                                                    </Box>
                                                                )}
                                                            </Box>
                                                            <Typography variant="caption" sx={{
                                                                display: 'block',
                                                                textAlign: 'center',
                                                                fontWeight: 700,
                                                                mb: 0.5,
                                                            }} noWrap>
                                                                {attachment.file_name}
                                                            </Typography>
                                                            {attachment.file_size > 0 && (
                                                                <Typography variant="caption" color="text.secondary"
                                                                            sx={{display: 'block', textAlign: 'center'}}>
                                                                    {(attachment.file_size / 1024).toFixed(1)} KB
                                                                </Typography>
                                                            )}
                                                        </Paper>
                                                    </Zoom>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grow>
                        )}
                    </Grid>
                </Grid>

                {/* Resim önizleme dialog */}
                <Dialog
                    open={!!selectedImage}
                    onClose={() => setSelectedImage(null)}
                    maxWidth="lg"
                    fullWidth
                >
                    <DialogContent sx={{p: 0, position: 'relative'}}>
                        <IconButton
                            sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                bgcolor: 'background.paper',
                                zIndex: 1,
                            }}
                            onClick={() => setSelectedImage(null)}
                        >
                            <Close/>
                        </IconButton>
                        {selectedImage && (
                            <img
                                src={`${process.env.REACT_APP_API_URL}/transfers${selectedImage.download_url}`}
                                alt={selectedImage.file_name}
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                }}
                            />
                        )}
                    </DialogContent>
                </Dialog>
        </Container>
    );
}
