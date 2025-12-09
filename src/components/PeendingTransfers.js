import React, {useCallback, useEffect, useState} from 'react';
import axios from 'axios';
import {
    Box,
    Card,
    IconButton,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableContainer,
    TablePagination,
    Tooltip,
    CircularProgress,
    Alert,
    Chip,
    Divider,
    Typography,
    Avatar,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@mui/material';
import {
    Refresh,
    HourglassEmpty,
    CheckCircle,
} from '@mui/icons-material';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../contexts/AuthContext';
import {useNavigate} from 'react-router-dom';

const currencyGuess = (c) => (c && /^[A-Z]{3}$/.test(c) ? c : 'USD');

const formatAmount = (amount, currency) => {
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currencyGuess(currency),
            maximumFractionDigits: 2,
        }).format(Number(amount ?? 0));
    } catch {
        return `${amount} ${currency || ''}`.trim();
    }
};

const PendingTransfers = ({companyId, sx}) => {
    const {t} = useTranslation(['transfers']);
    const {token} = useAuth();
    const navigate = useNavigate();
    const API_URL = `${process.env.REACT_APP_API_URL}/transfers/pending`;
    const APPROVE_URL = `${process.env.REACT_APP_API_URL}/transfers/approve`;

    const [rows, setRows] = useState([]);
    const [limit, setLimit] = useState(20);
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState(null);
    const [approving, setApproving] = useState(false);

    const fetchPendingTransfers = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMsg('');

            const params = {};
            if (companyId) {
                params.companyId = companyId;
            }

            const {data} = await axios.get(API_URL, {
                params,
                headers: {
                    'x-access-token': token,
                    'Content-Type': 'application/json',
                }
            });

            console.log(data);

            if (data?.status === 'success') {
                const transfers = data?.data?.transfers ?? [];
                setRows(transfers);
                setTotal(data?.data?.pagination?.total ?? transfers.length ?? 0);
            } else {
                setRows([]);
                setTotal(0);
                setErrorMsg(data?.message || t('list.errors.fetchFailed'));
            }
        } catch (err) {
            setRows([]);
            setTotal(0);
            setErrorMsg(err?.response?.data?.message || err.message || t('list.errors.unexpected'));
        } finally {
            setLoading(false);
        }
    }, [API_URL, token, companyId, t]);

    useEffect(() => {
        fetchPendingTransfers();
    }, [fetchPendingTransfers]);

    const handleApproveClick = (transfer) => {
        setSelectedTransfer(transfer);
        setApproveDialogOpen(true);
    };

    const handleApproveConfirm = async () => {
        if (!selectedTransfer) return;

        try {
            setApproving(true);
            const {data} = await axios.post(
                APPROVE_URL,
                {transferId: selectedTransfer.id},
                {
                    headers: {
                        'x-access-token': token,
                        'Content-Type': 'application/json',
                    }
                }
            );

            if (data?.status === 'success') {
                // Başarılı onay - listeyi yenile
                await fetchPendingTransfers();
                setApproveDialogOpen(false);
                setSelectedTransfer(null);
            } else {
                setErrorMsg(data?.message || 'Transfer onaylanamadı');
            }
        } catch (err) {
            setErrorMsg(err?.response?.data?.message || err.message || 'Transfer onaylanırken hata oluştu');
        } finally {
            setApproving(false);
        }
    };

    const handleApproveCancel = () => {
        setApproveDialogOpen(false);
        setSelectedTransfer(null);
    };

    const formatDateTime = (d) =>
        d ? new Date(d).toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : '-';

    const senderFullName = (r) => {
        const fullName = [r?.sender_name, r?.sender_surname].filter(Boolean).join(' ');
        return fullName || r?.from_external_name || '-';
    };

    const receiverFullName = (r) => {
        const fullName = [r?.receiver_name, r?.receiver_surname].filter(Boolean).join(' ');
        return fullName || r?.to_external_name || '-';
    };

    return (
        <Card
            sx={{
                p: 0,
                overflow: 'hidden',
                borderRadius: 3,
                backdropFilter: 'blur(8px)',
                bgcolor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(25,28,34,0.65)'
                    : 'rgba(255,255,255,0.75)',
                border: (t) => `1px solid ${t.palette.divider}`,
                ...sx
            }}
        >
            {/* Başlık Şeridi */}
            <Box
                sx={{
                    px: {xs: 1.5, sm: 2.5},
                    py: {xs: 1.25, sm: 2},
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    rowGap: {xs: 1, sm: 1.5},
                    columnGap: {xs: 1, sm: 1.5},
                    boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                    borderBottom: '1px solid rgba(255,255,255,0.15)',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    position: 'relative',
                }}
            >
                <Avatar
                    sx={{
                        color: 'white',
                        bgcolor: 'rgba(255,255,255,0.18)',
                        width: {xs: 36, sm: 42},
                        height: {xs: 36, sm: 42},
                        backdropFilter: 'blur(4px)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                        flexShrink: 0,
                        order: 0,
                    }}
                >
                    <HourglassEmpty/>
                </Avatar>

                <Box sx={{flex: 1, minWidth: 0, order: 1}}>
                    <Typography variant="h6" noWrap
                                sx={{fontWeight: 600, letterSpacing: 0.3, textShadow: '0 1px 3px rgba(0,0,0,0.3)'}}>
                        {t('transfers:pending.title', 'Onay Bekleyen Transferler')}
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            opacity: 0.9,
                            textShadow: '0 1px 2px rgba(0,0,0,0.25)',
                            display: 'block',
                            whiteSpace: {xs: 'normal', sm: 'nowrap'}
                        }}
                    >
                        {t('transfers:pending.total', {total, defaultValue: `Toplam ${total} transfer`})}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flexWrap: 'wrap',
                        justifyContent: {xs: 'flex-end', sm: 'flex-end'},
                        width: {xs: 'auto', sm: 'auto'},
                        order: 2,
                    }}
                >
                    <Tooltip title={t('transfers:list.refresh', 'Yenile')}>
                        <IconButton
                            onClick={fetchPendingTransfers}
                            size="small"
                            sx={{
                                color: '#fff',
                                bgcolor: 'rgba(255,255,255,0.18)',
                                border: '1px solid rgba(255,255,255,0.25)',
                                '&:hover': {bgcolor: 'rgba(255,255,255,0.28)'},
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <Refresh/>
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Divider/>

            {/* Hata */}
            {errorMsg && <Alert severity="error" sx={{m: 2}}>{errorMsg}</Alert>}

            {/* Tablo */}
            <TableContainer sx={{overflowX: 'auto'}}>
                <Table size="small" sx={{
                    minWidth: 900,
                    'thead th': {fontWeight: 700, whiteSpace: 'nowrap'},
                    'tbody tr': {
                        transition: 'background-color 120ms ease, transform 120ms ease',
                        '&:hover': {bgcolor: 'action.hover'}
                    },
                    '& thead th, & tbody td': {textAlign: 'center', verticalAlign: 'middle'}
                }}>
                    <TableHead>
                        <TableRow>
                            <TableCell>{t('transfers:list.columns.created_at', 'Tarih')}</TableCell>
                            <TableCell>{t('transfers:list.columns.amount', 'Tutar')}</TableCell>
                            <TableCell>{t('transfers:list.columns.sender', 'Gönderen')}</TableCell>
                            <TableCell>{t('transfers:list.columns.receiver', 'Alıcı')}</TableCell>
                            <TableCell>{t('transfers:list.columns.description', 'Açıklama')}</TableCell>
                            <TableCell>{t('transfers:pending.actions', 'İşlemler')}</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6}>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        justifyContent: 'center',
                                        py: 4
                                    }}>
                                        <CircularProgress size={20}/>
                                        <Typography variant="body2"
                                                    color="text.secondary">{t('transfers:list.loading', 'Yükleniyor...')}</Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6}>
                                    <Box sx={{py: 6, textAlign: 'center', color: 'text.secondary'}}>
                                        <Typography variant="subtitle1" sx={{mb: 0.5}}>
                                            {t('transfers:pending.noRecords', 'Onay bekleyen transfer bulunmamaktadır')}
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((r) => (
                                <TableRow
                                    key={r.id}
                                    hover
                                >
                                    <TableCell>{formatDateTime(r.created_at)}</TableCell>
                                    <TableCell sx={{fontWeight: 700}}>{formatAmount(r.amount, r.currency)}</TableCell>
                                    <TableCell>
                                        <Box sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 0.5
                                        }}>
                                            <Typography variant="body2" sx={{fontWeight: 600}}>
                                                {senderFullName(r)}
                                            </Typography>
                                            {r.sender_company_name && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {r.sender_company_name}
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 0.5
                                        }}>
                                            <Typography variant="body2" sx={{fontWeight: 600}}>
                                                {receiverFullName(r)}
                                            </Typography>
                                            {r.receiver_company_name && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {r.receiver_company_name}
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{
                                        maxWidth: 300,
                                        whiteSpace: 'normal',
                                        wordWrap: 'break-word'
                                    }}>{r.description || '-'}</TableCell>
                                    <TableCell>
                                        <Box sx={{display: 'flex', gap: 1, justifyContent: 'center'}}>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                color="success"
                                                startIcon={<CheckCircle/>}
                                                onClick={() => handleApproveClick(r)}
                                            >
                                                {t('transfers:pending.approve', 'Onayla')}
                                            </Button>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Alt bar - Sayfalama */}
            <Box sx={{px: 2, py: 1.5}}>
                <TablePagination
                    component="div"
                    count={total}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    rowsPerPage={limit}
                    onRowsPerPageChange={(e) => {
                        setLimit(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    rowsPerPageOptions={[10, 20, 50, 100]}
                    labelRowsPerPage={t('transfers:list.rowsPerPage', 'Sayfa başına satır')}
                    labelDisplayedRows={({from, to, count}) => t('transfers:list.displayedRows', {from, to, count, defaultValue: `${from}-${to} / ${count}`})}
                    sx={{
                        '.MuiTablePagination-toolbar': {flexWrap: 'wrap', minHeight: {xs: 'auto', sm: 52}},
                    }}
                />
            </Box>

            {/* Onay Dialog */}
            <Dialog
                open={approveDialogOpen}
                onClose={handleApproveCancel}
            >
                <DialogTitle>
                    {t('transfers:pending.approveDialog.title', 'Transfer Onaylama')}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {selectedTransfer && (
                            <>
                                {t('transfers:pending.approveDialog.message', {
                                    amount: formatAmount(selectedTransfer.amount, selectedTransfer.currency),
                                    sender: senderFullName(selectedTransfer),
                                    receiver: receiverFullName(selectedTransfer),
                                    defaultValue: `${formatAmount(selectedTransfer.amount, selectedTransfer.currency)} tutarındaki transferi onaylamak istediğinizden emin misiniz?`
                                })}
                            </>
                        )}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleApproveCancel} disabled={approving}>
                        {t('transfers:pending.approveDialog.cancel', 'İptal')}
                    </Button>
                    <Button
                        onClick={handleApproveConfirm}
                        color="success"
                        variant="contained"
                        disabled={approving}
                        startIcon={approving ? <CircularProgress size={16}/> : <CheckCircle/>}
                    >
                        {approving
                            ? t('transfers:pending.approveDialog.approving', 'Onaylanıyor...')
                            : t('transfers:pending.approveDialog.confirm', 'Onayla')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};

export default PendingTransfers;
