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
    Divider,
    Grid,
    Chip,
    Paper,
    IconButton,
    ImageList,
    ImageListItem,
    Dialog,
    DialogContent,
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
    Download,
    Close,
} from '@mui/icons-material';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../contexts/AuthContext';
import {useAlert} from '../contexts/AlertContext';
import axios from 'axios';

const statusChipProps = (status) => {
    switch ((status || '').toLowerCase()) {
        case 'completed':
            return {color: 'success', label: 'Completed'};
        case 'pending':
            return {color: 'warning', label: 'Pending'};
        case 'failed':
            return {color: 'error', label: 'Failed'};
        case 'reversed':
            return {color: 'default', label: 'Reversed'};
        default:
            return {color: 'default', label: status || '-'};
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

    useEffect(() => {
        const fetchTransferDetail = async () => {
            try {
                setLoading(true);
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

                if (response.data?.status === 'success' && response.data?.data) {
                    const transferData = response.data.data;
                    setTransfer(transferData);

                    // files JSON string'ini parse et
                    if (transferData.files) {
                        try {
                            const filesArray = JSON.parse(transferData.files);
                            const formattedAttachments = filesArray.map((filePath, index) => {
                                const fileName = filePath.split('\\').pop() || filePath.split('/').pop();
                                const fileExtension = fileName.split('.').pop()?.toLowerCase();
                                let mimeType = 'application/octet-stream';

                                if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
                                    mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
                                } else if (fileExtension === 'pdf') {
                                    mimeType = 'application/pdf';
                                }

                                return {
                                    id: index,
                                    file_path: filePath,
                                    file_name: fileName,
                                    mime_type: mimeType,
                                    file_size: 0, // Backend'den gelmiyor, varsayılan değer
                                };
                            });
                            setAttachments(formattedAttachments);
                        } catch (parseError) {
                            console.error('Dosyalar parse edilirken hata:', parseError);
                            setAttachments([]);
                        }
                    } else {
                        setAttachments([]);
                    }
                } else {
                    showError(response.data?.message || t('list.errors.fetchFailed'));
                }
            } catch (error) {
                console.error('Transfer detayı yüklenirken hata:', error);
                showError(error?.response?.data?.message || t('list.errors.fetchFailed'));
            } finally {
                setLoading(false);
            }
        };

        if (transferId && token) {
            fetchTransferDetail();
        }
    }, [transferId, token, showError, t]);

    const getFileUrl = (attachment) => {
        // Backend'den gelen path'i URL'e dönüştür
        const encodedPath = encodeURIComponent(attachment.file_path);
        return `${process.env.REACT_APP_API_URL}/uploads/${attachment.file_path.replace(/\\/g, '/')}`;
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

    if (!transfer) {
        return (
            <Container maxWidth="lg" sx={{py: 4}}>
                <Alert severity="error" sx={{mb: 2}}>
                    {t('list.errors.notFound')}
                </Alert>
                <Button startIcon={<ArrowBack/>} onClick={() => navigate(-1)}>
                    {t('back', { ns: 'common' })}
                </Button>
            </Container>
        );
    }

    const {color: statusColor, label: statusLabel} = statusChipProps(transfer.status);
    const senderFullName = [transfer.sender_name, transfer.sender_surname].filter(Boolean).join(' ') || transfer.from_external_name;
    const receiverFullName = [transfer.receiver_name, transfer.receiver_surname].filter(Boolean).join(' ') || transfer.to_external_name;

    return (
        <Container maxWidth="lg" sx={{py: 4}}>
            {/* Başlık */}
            <Box sx={{mb: 3, display: 'flex', alignItems: 'center', gap: 2}}>
                <Button startIcon={<ArrowBack/>} onClick={() => navigate(-1)} variant="outlined">
                    {t('back', { ns: 'common' })}
                </Button>
                <Typography variant="h4" sx={{fontWeight: 700, flex: 1}}>
                    {t('list.detail.title')} #{transfer.id}
                </Typography>
                <Chip
                    color={statusColor}
                    label={t(`list.status.${statusLabel.toLowerCase()}`, statusLabel)}
                    sx={{fontWeight: 600}}
                />
            </Box>

            <Grid container spacing={3}>
                {/* Sol Kolon - Transfer Bilgileri */}
                <Grid item xs={12} md={8}>
                    <Card sx={{borderRadius: 3, mb: 3}}>
                        <CardContent sx={{p: 3}}>
                            <Typography variant="h6" sx={{mb: 2, fontWeight: 600}}>
                                {t('list.detail.transferInfo')}
                            </Typography>
                            <Divider sx={{mb: 2}}/>

                            {/* Tutar */}
                            <Box sx={{mb: 3, textAlign: 'center', py: 2}}>
                                <Typography variant="h3" sx={{fontWeight: 700, color: 'primary.main'}}>
                                    {formatAmount(transfer.amount, transfer.currency)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {t('list.columns.amount')}
                                </Typography>
                            </Box>

                            <Divider sx={{mb: 2}}/>

                            {/* Gönderici */}
                            <Paper elevation={0} sx={{p: 2, mb: 2, bgcolor: 'action.hover', borderRadius: 2}}>
                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, mb: 1}}>
                                    {transfer.from_scope === 'external' ?
                                        <AccountBalance/> : transfer.from_scope === 'company' ? <Business/> : <Person/>}
                                    <Typography variant="subtitle2" color="text.secondary">
                                        {t('list.detail.sender')}
                                    </Typography>
                                </Box>
                                <Typography variant="h6" sx={{fontWeight: 600}}>
                                    {senderFullName || '-'}
                                </Typography>
                                {transfer.sender_company_name && (
                                    <Typography variant="body2" color="text.secondary">
                                        {transfer.sender_company_name}
                                    </Typography>
                                )}
                            </Paper>

                            {/* Alıcı */}
                            <Paper elevation={0} sx={{p: 2, mb: 2, bgcolor: 'action.hover', borderRadius: 2}}>
                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, mb: 1}}>
                                    {transfer.to_scope === 'external' ?
                                        <AccountBalance/> : transfer.to_scope === 'company' ? <Business/> : <Person/>}
                                    <Typography variant="subtitle2" color="text.secondary">
                                        {t('list.detail.receiver')}
                                    </Typography>
                                </Box>
                                <Typography variant="h6" sx={{fontWeight: 600}}>
                                    {receiverFullName || '-'}
                                </Typography>
                                {transfer.receiver_company_name && (
                                    <Typography variant="body2" color="text.secondary">
                                        {transfer.receiver_company_name}
                                    </Typography>
                                )}
                            </Paper>

                            {/* Açıklama */}
                            {transfer.description && (
                                <Paper elevation={0} sx={{p: 2, bgcolor: 'action.hover', borderRadius: 2}}>
                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, mb: 1}}>
                                        <Description/>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            {t('list.columns.description')}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1">
                                        {transfer.description}
                                    </Typography>
                                </Paper>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Sağ Kolon - Ek Bilgiler ve Dosyalar */}
                <Grid item xs={12} md={4}>
                    {/* Tarih ve Tip Bilgileri */}
                    <Card sx={{borderRadius: 3, mb: 3}}>
                        <CardContent sx={{p: 3}}>
                            <Typography variant="h6" sx={{mb: 2, fontWeight: 600}}>
                                {t('list.detail.additionalInfo')}
                            </Typography>
                            <Divider sx={{mb: 2}}/>

                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, mb: 2}}>
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

                            <Box sx={{mb: 2}}>
                                <Typography variant="caption" color="text.secondary" sx={{display: 'block', mb: 0.5}}>
                                    {t('list.columns.transfer_type')}
                                </Typography>
                                <Chip
                                    size="small"
                                    variant="outlined"
                                    label={t(`list.types.${transfer.transfer_type}`, transfer.transfer_type)}
                                    sx={{fontWeight: 600}}
                                />
                            </Box>

                            {transfer.sender_final_balance != null && (
                                <Box sx={{mb: 2}}>
                                    <Typography variant="caption" color="text.secondary">
                                        {t('list.columns.sender_final_balance')}
                                    </Typography>
                                    <Typography variant="body2" sx={{fontWeight: 600}}>
                                        {formatAmount(transfer.sender_final_balance, transfer.currency)}
                                    </Typography>
                                </Box>
                            )}

                            {transfer.receiver_final_balance != null && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        {t('list.columns.receiver_final_balance')}
                                    </Typography>
                                    <Typography variant="body2" sx={{fontWeight: 600}}>
                                        {formatAmount(transfer.receiver_final_balance, transfer.currency)}
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>

                    {/* Dosya Ekleri */}
                    {attachments.length > 0 && (
                        <Card sx={{borderRadius: 3}}>
                            <CardContent sx={{p: 3}}>
                                <Typography variant="h6" sx={{mb: 2, fontWeight: 600}}>
                                    <AttachFile sx={{verticalAlign: 'middle', mr: 1}}/>
                                    {t('list.detail.attachments')} ({attachments.length})
                                </Typography>
                                <Divider sx={{mb: 2}}/>

                                <ImageList cols={2} gap={8}>
                                    {attachments.map((attachment) => (
                                        <ImageListItem key={attachment.id}>
                                            <Paper
                                                elevation={2}
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 2,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    '&:hover': {
                                                        transform: 'translateY(-4px)',
                                                        boxShadow: 4,
                                                    },
                                                }}
                                                onClick={() => {
                                                    if (attachment.mime_type?.startsWith('image/')) {
                                                        setSelectedImage(getFileUrl(attachment));
                                                    } else {
                                                        handleDownload(attachment);
                                                    }
                                                }}
                                            >
                                                <Box sx={{textAlign: 'center', mb: 1}}>
                                                    {attachment.mime_type?.startsWith('image/') ? (
                                                        <img
                                                            src={getFileUrl(attachment)}
                                                            alt={attachment.file_name}
                                                            style={{
                                                                width: '100%',
                                                                height: 120,
                                                                objectFit: 'cover',
                                                                borderRadius: 8
                                                            }}
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.parentElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 120px;">Görsel yüklenemedi</div>';
                                                            }}
                                                        />
                                                    ) : (
                                                        getFileIcon(attachment.mime_type)
                                                    )}
                                                </Box>
                                                <Typography variant="caption" sx={{
                                                    display: 'block',
                                                    textAlign: 'center',
                                                    fontWeight: 500
                                                }} noWrap>
                                                    {attachment.file_name}
                                                </Typography>
                                                {attachment.file_size > 0 && (
                                                    <Typography variant="caption" color="text.secondary"
                                                                sx={{display: 'block', textAlign: 'center'}}>
                                                        {(attachment.file_size / 1024).toFixed(1)} KB
                                                    </Typography>
                                                )}
                                                <Box sx={{textAlign: 'center', mt: 1}}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDownload(attachment);
                                                        }}
                                                    >
                                                        <Download fontSize="small"/>
                                                    </IconButton>
                                                </Box>
                                            </Paper>
                                        </ImageListItem>
                                    ))}
                                </ImageList>
                            </CardContent>
                        </Card>
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
                        sx={{position: 'absolute', top: 8, right: 8, bgcolor: 'background.paper', zIndex: 1}}
                        onClick={() => setSelectedImage(null)}
                    >
                        <Close/>
                    </IconButton>
                    {selectedImage && (
                        <img
                            src={selectedImage}
                            alt="Preview"
                            style={{width: '100%', height: 'auto', display: 'block'}}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </Container>
    );
}
