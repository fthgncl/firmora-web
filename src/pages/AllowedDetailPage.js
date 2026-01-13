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
    Stack,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    ArrowBack,
    Description,
    AttachFile,
    Image as ImageIcon,
    PictureAsPdf,
    Close,
    AccessTime,
} from '@mui/icons-material';

import {useTranslation} from 'react-i18next';
import {useAuth} from '../contexts/AuthContext';
import {useAlert} from '../contexts/AlertContext';
import axios from 'axios';
import PDFViewer from '../components/PDFViewer';

const formatDateWithDay = (d, langCode) => {
    if (!d) return '-';
    const date = new Date(d);
    const dateStr = date.toLocaleDateString(langCode, {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const dayStr = date.toLocaleDateString(langCode, {
        weekday: 'long'
    });
    const timeStr = date.toLocaleTimeString(langCode, {
        hour: '2-digit',
        minute: '2-digit'
    });
    return { dateStr, dayStr, timeStr };
};

// Küçük görsel önizleme
function ImagePreview({fileToken, token}) {
    const [imageUrl, setImageUrl] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let objectUrl = null;

        const loadImage = async () => {
            try {
                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/user-allowed-days/file/${fileToken}`,
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
    }, [fileToken, token]);

    if (error) {
        return (
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: 90}}>
                <Typography variant="caption" color="error">Görsel yüklenemedi</Typography>
            </Box>
        );
    }

    if (!imageUrl) {
        return (
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: 90}}>
                <CircularProgress size={18}/>
            </Box>
        );
    }

    return (
        <img
            src={imageUrl}
            alt="Allowed day file"
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
function ImageViewer({fileToken, token}) {
    const [imageUrl, setImageUrl] = useState(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let objectUrl = null;

        const loadImage = async () => {
            try {
                setLoading(true);
                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/user-allowed-days/file/${fileToken}`,
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
    }, [fileToken, token]);

    if (loading) {
        return (
            <Box sx={{
                p: 2,
                textAlign: 'center',
                bgcolor: 'grey.100',
                maxHeight: '100vh',
                overflow: 'auto',
            }}>
                <CircularProgress/>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, p: 4}}>
                <Typography variant="body1" color="error">Görsel yüklenirken hata oluştu</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{p: 2, textAlign: 'center', bgcolor: 'grey.100'}}>
            <img
                src={imageUrl}
                alt="Allowed day file"
                style={{
                    maxWidth: '100%',
                    maxHeight: '80vh',
                    objectFit: 'contain',
                }}
            />
        </Box>
    );
}

export default function AllowedDetailPage() {
    const {allowedDayId} = useParams();
    const navigate = useNavigate();
    const {t, i18n} = useTranslation(['allowedDays', 'common']);
    const {token} = useAuth();
    const {showError} = useAlert();

    const [loading, setLoading] = useState(true);
    const [allowedDay, setAllowedDay] = useState(null);
    const [user, setUser] = useState(null);
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState(null);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => {
        const fetchAllowedDayDetail = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await axios.post(
                    `${process.env.REACT_APP_API_URL}/user-allowed-days/get`,
                    {
                        allowedDayId
                    },
                    {
                        headers: {
                            'x-access-token': token,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (response.data?.status === 'success' && response.data?.data) {
                    setAllowedDay(response.data.data.allowedDay);
                    setUser(response.data.data.user);

                    // Dosyaları listele
                    const allowedDayData = response.data.data.allowedDay;
                    if (allowedDayData.filesCount > 0) {
                        try {
                            const filesResponse = await axios.post(
                                `${process.env.REACT_APP_API_URL}/user-allowed-days/files`,
                                {
                                    allowedDayId: allowedDayData.id
                                },
                                {
                                    headers: {
                                        'x-access-token': token,
                                        'Content-Type': 'application/json',
                                    },
                                }
                            );

                            if (filesResponse.data.status === "success" && filesResponse.data?.files) {
                                // downloadUrl formatı: "/file/eyJ..." şeklinde geliyor
                                // Token'ı extract ediyoruz
                                const processedFiles = filesResponse.data.files.map(file => ({
                                    ...file,
                                    downloadToken: file.downloadUrl?.replace('/file/', '') || ''
                                }));
                                setFiles(processedFiles);
                            } else {
                                setFiles([]);
                            }
                        } catch (filesError) {
                            console.error('Dosyalar yüklenirken hata:', filesError);
                            setFiles([]);
                        }
                    } else {
                        setFiles([]);
                    }
                } else {
                    const errorMessage = response.data?.message || t('errors.fetchFailed');
                    setError(errorMessage);
                    showError(errorMessage);
                }
            } catch (error) {
                console.error('İzin günü detayı yüklenirken hata:', error);
                const errorMessage = error?.response?.data?.message || t('errors.fetchFailed');
                setError(errorMessage);
                showError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        if (allowedDayId && token) {
            fetchAllowedDayDetail();
        }
        // eslint-disable-next-line
    }, [allowedDayId, token]);

    const getFileUrl = (fileToken) => {
        return `${process.env.REACT_APP_API_URL}/user-allowed-days/file/${fileToken}`;
    };

    const handleDownload = (fileToken, fileName) => {
        const link = document.createElement('a');
        link.href = getFileUrl(fileToken);
        link.download = fileName;
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

    if (!allowedDay && !loading) {
        return (
            <Container maxWidth="lg" sx={{py: 4}}>
                <Alert severity="error" sx={{mb: 2}}>
                    {error || t('errors.notFound')}
                </Alert>
                <Button startIcon={<ArrowBack/>} onClick={() => navigate(-1)}>
                    {t('back', {ns: 'common'})}
                </Button>
            </Container>
        );
    }

    const userFullName = user ? [user.name, user.surname].filter(Boolean).join(' ') : '-';

    const calculateDays = () => {
        const start = new Date(allowedDay.start_date);
        const end = new Date(allowedDay.end_date);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: 'background.default',
            }}
        >
            <Container maxWidth="md" sx={{py: {xs: 2, md: 4}}}>
                {/* Header with back button */}
                <Stack direction="row" alignItems="center" spacing={2} sx={{mb: 4}}>
                    <IconButton
                        onClick={() => navigate(-1)}
                        sx={{
                            bgcolor: 'background.paper',
                            boxShadow: 1,
                            '&:hover': {
                                bgcolor: 'action.hover',
                            },
                        }}
                    >
                        <ArrowBack/>
                    </IconButton>
                    <Box>
                        <Typography variant="h4" sx={{fontWeight: 700}}>
                            {t('detail.title')}
                        </Typography>
                    </Box>
                </Stack>

                {/* Main Content Card */}
                <Card
                    elevation={0}
                    sx={{
                        borderRadius: 4,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    {/* Date Range Header */}
                    <Box
                        sx={{
                            background: (theme) =>
                                `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                            px: 3,
                            py: 4,
                            color: 'white',
                        }}
                    >
                        {/* User Name */}
                        <Typography variant="h5" sx={{fontWeight: 700, mb: 3}}>
                            {userFullName}
                        </Typography>

                        <Stack direction={{xs: 'column', md: 'row'}} alignItems={{xs: 'flex-start', md: 'center'}} spacing={3}>
                            {/* Start Date */}
                            <Box>
                                <Typography variant="h6" sx={{fontWeight: 700, mb: 0.5}}>
                                    {formatDateWithDay(allowedDay.start_date, i18n.language).dateStr}
                                </Typography>
                                <Typography variant="body2" sx={{opacity: 0.9}}>
                                    {formatDateWithDay(allowedDay.start_date, i18n.language).dayStr}, {formatDateWithDay(allowedDay.start_date, i18n.language).timeStr}
                                </Typography>
                            </Box>

                            {/* Arrow */}
                            <Typography variant="h4" sx={{fontWeight: 300, opacity: 0.7}}>→</Typography>

                            {/* End Date */}
                            <Box>
                                <Typography variant="h6" sx={{fontWeight: 700, mb: 0.5}}>
                                    {formatDateWithDay(allowedDay.end_date, i18n.language).dateStr}
                                </Typography>
                                <Typography variant="body2" sx={{opacity: 0.9}}>
                                    {formatDateWithDay(allowedDay.end_date, i18n.language).dayStr}, {formatDateWithDay(allowedDay.end_date, i18n.language).timeStr}
                                </Typography>
                            </Box>

                            {/* Days Count */}
                            <Chip
                                label={`${calculateDays()} ${t('detail.days', {ns: 'allowedDays', defaultValue: 'gün'})}`}
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.9)',
                                    color: 'primary.main',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    height: 36,
                                }}
                            />
                        </Stack>
                    </Box>

                    <CardContent sx={{p: 3}}>
                        {/* Info Sections */}
                        <Stack spacing={2.5}>
                            {/* Request Date */}
                            <Box>
                                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                    <AccessTime fontSize="small" color="action" sx={{mt: 0.5}}/>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{display: 'block', mb: 0.5}}>
                                            {t('detail.createdAt')}
                                        </Typography>
                                        <Typography variant="body1" sx={{fontWeight: 600}}>
                                            {formatDateWithDay(allowedDay.created_at, i18n.language).dateStr}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {formatDateWithDay(allowedDay.created_at, i18n.language).dayStr}, {formatDateWithDay(allowedDay.created_at, i18n.language).timeStr}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>

                            {/* Description */}
                            {allowedDay.description && (
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2.5,
                                        borderRadius: 2,
                                        bgcolor: 'grey.50',
                                        borderColor: 'grey.200',
                                    }}
                                >
                                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                        <Description fontSize="small" color="action" sx={{mt: 0.5}}/>
                                        <Box sx={{flex: 1}}>
                                            <Typography variant="caption" color="text.secondary" sx={{mb: 0.5, display: 'block'}}>
                                                {t('detail.description')}
                                            </Typography>
                                            <Typography variant="body1" sx={{whiteSpace: 'pre-wrap'}}>
                                                {allowedDay.description}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Paper>
                            )}

                            {/* Files */}
                            {files.length > 0 && (
                                <Box>
                                    <Typography variant="subtitle2" sx={{mb: 2, display: 'flex', alignItems: 'center', gap: 1}}>
                                        <AttachFile fontSize="small"/>
                                        {t('detail.attachments')} ({files.length})
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {files.map((file, index) => {
                                            const isImage = file.mimeType?.startsWith('image/');
                                            const isPdf = file.mimeType?.includes('pdf');
                                            const isPreviewable = isImage || isPdf;

                                            return (
                                                <Grid item xs={6} sm={4} md={3} key={index}>
                                                    <Paper
                                                        elevation={0}
                                                        sx={{
                                                            borderRadius: 2,
                                                            overflow: 'hidden',
                                                            cursor: 'pointer',
                                                            border: '1px solid',
                                                            borderColor: 'divider',
                                                            height: 140,
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            transition: 'all 0.2s',
                                                            '&:hover': {
                                                                boxShadow: 2,
                                                                borderColor: 'primary.main',
                                                                transform: 'translateY(-4px)',
                                                            },
                                                        }}
                                                        onClick={() => {
                                                            if (isPreviewable) {
                                                                setSelectedFile(file);
                                                            } else {
                                                                handleDownload(file.downloadToken, file.fileName);
                                                            }
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                flex: 1,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                bgcolor: 'grey.100',
                                                                p: isImage ? 0 : 2,
                                                            }}
                                                        >
                                                            {isImage ? (
                                                                <ImagePreview fileToken={file.downloadToken} token={token}/>
                                                            ) : (
                                                                getFileIcon(file.mimeType)
                                                            )}
                                                        </Box>
                                                        <Box sx={{p: 1, bgcolor: 'background.paper'}}>
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    display: 'block',
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    fontWeight: 500,
                                                                }}
                                                            >
                                                                {file.fileName}
                                                            </Typography>
                                                        </Box>
                                                    </Paper>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                </Box>
                            )}
                        </Stack>
                    </CardContent>
                </Card>

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
                            {selectedFile?.fileName}
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
                                {selectedFile.mimeType?.startsWith('image/') ? (
                                    <ImageViewer fileToken={selectedFile.downloadToken} token={token}/>
                                ) : selectedFile.mimeType?.includes('pdf') ? (
                                    <PDFViewer
                                        fileUrl={`${process.env.REACT_APP_API_URL}/user-allowed-days/file/${selectedFile.downloadToken}`}
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
