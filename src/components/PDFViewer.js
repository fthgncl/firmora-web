import React, { useState, useEffect } from 'react';
import { Box, IconButton, Typography, Stack, CircularProgress } from '@mui/material';
import { ZoomIn, ZoomOut, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { Document, Page, pdfjs } from 'react-pdf';
import axios from 'axios';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

export default function PDFViewer({ fileUrl, token }) {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let objectUrl = null;

        const loadPDF = async () => {
            try {
                setLoading(true);
                console.log('PDF yükleniyor:', fileUrl);

                const response = await axios.get(fileUrl, {
                    headers: {
                        'x-access-token': token,
                    },
                    responseType: 'blob',
                });

                console.log('PDF blob alındı:', response.data.type, response.data.size);

                // PDF blob'un doğru tipte olduğunu kontrol et
                if (!response.data.type.includes('pdf') && response.data.type !== 'application/octet-stream') {
                    console.error('Beklenen PDF değil:', response.data.type);
                    throw new Error('Geçersiz dosya tipi');
                }

                objectUrl = window.URL.createObjectURL(response.data);
                console.log('PDF blob URL oluşturuldu:', objectUrl);
                setPdfUrl(objectUrl);
            } catch (err) {
                console.error('PDF yüklenirken hata:', err);
                console.error('Hata detayı:', err.response?.data);
                setError(err.message || 'PDF yüklenirken bir hata oluştu');
            } finally {
                setLoading(false);
            }
        };

        if (fileUrl && token) {
            loadPDF();
        }

        return () => {
            if (objectUrl) {
                window.URL.revokeObjectURL(objectUrl);
            }
        };
    }, [fileUrl, token]);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
    const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages));
    const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
    const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 400, p: 4 }}>
                <Typography variant="h6" color="error" gutterBottom>PDF yüklenirken hata oluştu</Typography>
                <Typography variant="body2" color="text.secondary">{error}</Typography>
            </Box>
        );
    }

    if (!pdfUrl) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <Typography>PDF yüklenemedi</Typography>
            </Box>
        );
    }

    return (
        <Box>
            {/* Kontrol Paneli */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                bgcolor: 'background.paper',
                borderBottom: 1,
                borderColor: 'divider',
            }}>
                <Stack direction="row" spacing={1}>
                    <IconButton onClick={zoomOut} disabled={scale <= 0.5}>
                        <ZoomOut />
                    </IconButton>
                    <Typography sx={{ px: 2, display: 'flex', alignItems: 'center' }}>
                        {Math.round(scale * 100)}%
                    </Typography>
                    <IconButton onClick={zoomIn} disabled={scale >= 3}>
                        <ZoomIn />
                    </IconButton>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton onClick={goToPrevPage} disabled={pageNumber <= 1}>
                        <NavigateBefore />
                    </IconButton>
                    <Typography>
                        {pageNumber} / {numPages}
                    </Typography>
                    <IconButton onClick={goToNextPage} disabled={pageNumber >= numPages}>
                        <NavigateNext />
                    </IconButton>
                </Stack>
            </Box>

            {/* PDF Görüntüleme Alanı */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                p: 2,
                bgcolor: 'grey.100',
                maxHeight: '70vh',
                overflow: 'auto',
            }}>
                <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    }
                    error={
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography color="error">PDF yüklenirken hata oluştu</Typography>
                        </Box>
                    }
                >
                    <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                    />
                </Document>
            </Box>
        </Box>
    );
}
