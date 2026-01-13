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
    CalendarToday,
    Description,
    AttachFile,
    Image as ImageIcon,
    PictureAsPdf,
    Close,
} from '@mui/icons-material';

import {useTranslation} from 'react-i18next';
import {useAuth} from '../contexts/AuthContext';
import {useAlert} from '../contexts/AlertContext';
import axios from 'axios';
import PDFViewer from '../components/PDFViewer';

const formatDateTime = (d, langCode) =>
    d ? new Date(d).toLocaleString(langCode, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }) : '-';

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
                {/* Üst bar: geri + başlık */}
                <Box sx={{mb: 3}}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBack/>}
                            onClick={() => navigate(-1)}
                            sx={{
                                borderRadius: 999,
                                textTransform: 'none',
                                fontWeight: 500,
                            }}
                        >
                            {t('back', {ns: 'common'})}
                        </Button>

                        <Box sx={{flex: 1, minWidth: 0}}>
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 700,
                                    letterSpacing: 0.2,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}
                            >
                                {t('detail.title')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                #{allowedDay.id}
                            </Typography>
                        </Box>
                    </Stack>
                </Box>

                {/* Hero özet kartı (Tarih aralığı) */}
                <Fade in timeout={500}>
                    <Card
                        elevation={0}
                        sx={{
                            mb: 4,
                            borderRadius: 3,
                            overflow: 'hidden',
                            background: "linear-gradient(135deg, #2b2b2b, #125696 70%, #bfa76f33)",
                            color: '#fff',
                            px: {xs: 3, md: 4},
                            py: {xs: 3, md: 4},
                        }}
                    >
                        <Grid container spacing={3} alignItems="center">
                            <Grid item xs={12}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        textTransform: 'uppercase',
                                        letterSpacing: 1.6,
                                        opacity: 0.8,
                                        fontWeight: 600,
                                    }}
                                >
                                    {t('detail.dateRange')}
                                </Typography>
                                <Stack direction="row" spacing={2} alignItems="center" sx={{mt: 1}}>
                                    <Typography
                                        variant="h5"
                                        sx={{
                                            fontWeight: 700,
                                            lineHeight: 1.1,
                                        }}
                                    >
                                        {formatDateTime(allowedDay.start_date, i18n.language)}
                                    </Typography>
                                    <Typography variant="h5" sx={{opacity: 0.7}}>→</Typography>
                                    <Typography
                                        variant="h5"
                                        sx={{
                                            fontWeight: 700,
                                            lineHeight: 1.1,
                                        }}
                                    >
                                        {formatDateTime(allowedDay.end_date, i18n.language)}
                                    </Typography>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Card>
                </Fade>

                <Grid container spacing={3}>
                    {/* Sol taraf: kullanıcı bilgisi + açıklama */}
                    <Grid item xs={12} md={8}>
                        {/* Kullanıcı bilgisi */}
                        <Card elevation={0} sx={{mb: 3, borderRadius: 3, p: 3, border: '1px solid', borderColor: 'divider'}}>
                            <Typography variant="subtitle2" color="text.secondary"
                                        sx={{mb: 2, textTransform: 'uppercase', letterSpacing: 1}}>
                                {t('detail.userInfo')}
                            </Typography>

                            <Paper
                                variant="outlined"
                                sx={{
                                    borderRadius: 2,
                                    p: 2,
                                    borderColor: theme.palette.primary.main,
                                    backgroundColor: 'background.paper',
                                }}
                            >
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Avatar
                                        sx={{
                                            bgcolor: theme.palette.primary.main,
                                            color: 'primary.contrastText',
                                            width: 52,
                                            height: 52,
                                        }}
                                    >
                                        <Person/>
                                    </Avatar>
                                    <Box>
                                        <Typography variant="overline" sx={{color: 'text.secondary', letterSpacing: 1}}>
                                            {t('detail.user')}
                                        </Typography>
                                        <Typography variant="subtitle1" sx={{fontWeight: 700}}>
                                            {userFullName}
                                        </Typography>
                                    </Box>
                                </Stack>
                                <Box sx={{mt: 2}}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <CalendarToday fontSize="small" sx={{color: 'text.secondary'}}/>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {t('detail.createdAt')}
                                            </Typography>
                                            <Typography variant="body2" sx={{fontWeight: 600}}>
                                                {formatDateTime(allowedDay.created_at, i18n.language)}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            </Paper>
                        </Card>

                        {/* Açıklama */}
                        {allowedDay.description && (
                            <Card elevation={0}
                                  sx={{borderRadius: 3, p: 3, border: '1px dashed', borderColor: 'divider'}}>
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
                                            {t('detail.description')}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {allowedDay.description}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Card>
                        )}
                    </Grid>

                    {/* Sağ taraf: Ekler (galeri) */}
                    <Grid item xs={12} md={4}>
                        {files.length > 0 && (
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
                                    <Stack direction="row" justifyContent="space-between" alignItems="center"
                                           sx={{mb: 2}}>
                                        <Typography variant="subtitle2">
                                            <AttachFile sx={{verticalAlign: 'middle', mr: 1}}/>
                                            {t('detail.attachments')} ({files.length})
                                        </Typography>
                                    </Stack>

                                    {/* Galeri tarzı grid */}
                                    <Grid container spacing={1.5}>
                                        {files.map((file, index) => {
                                            const isImage = file.mimeType?.startsWith('image/');
                                            const isPdf = file.mimeType?.includes('pdf');
                                            const isPreviewable = isImage || isPdf;

                                            return (
                                                <Grid item xs={4} sm={3} md={4} key={index}>
                                                    <Paper
                                                        elevation={1}
                                                        sx={{
                                                            borderRadius: 2,
                                                            overflow: 'hidden',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            p: isImage ? 0 : 1.5,
                                                            height: 90,
                                                            '&:hover': {
                                                                boxShadow: 4,
                                                                transform: 'translateY(-2px)',
                                                            },
                                                            transition: 'all 0.15s ease-out',
                                                        }}
                                                        onClick={() => {
                                                            if (isPreviewable) {
                                                                setSelectedFile(file);
                                                            } else {
                                                                handleDownload(file.downloadToken, file.fileName);
                                                            }
                                                        }}
                                                    >
                                                        {isImage ? (
                                                            <ImagePreview fileToken={file.downloadToken} token={token}/>
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
                                                                {getFileIcon(file.mimeType)}
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
