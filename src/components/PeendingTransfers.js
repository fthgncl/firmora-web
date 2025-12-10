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
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Container,
    Popover,
    Checkbox,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Avatar,
} from '@mui/material';
import {
    Refresh,
    HourglassEmpty,
    CheckCircle,
    ViewColumn,
    AttachFile,
    Cancel,
} from '@mui/icons-material';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../contexts/AuthContext';
import {getCurrencies} from '../constants/currency';
import {useNavigate} from 'react-router-dom';

// Kolon tanımları
const COLUMN_DEFS = [
    {key: 'created_at', labelKey: 'list.columns.created_at'},
    {key: 'amount', labelKey: 'list.columns.amount'},
    {key: 'sender', labelKey: 'list.columns.sender'},
    {key: 'receiver', labelKey: 'list.columns.receiver'},
    {key: 'transfer_type', labelKey: 'list.columns.transfer_type'},
    {key: 'description', labelKey: 'list.columns.description'},
    {key: 'files_count', labelKey: 'list.columns.files_count'},
    {key: 'actions', labelKey: 'pending.actions'},
];

const formatAmount = (amount, currency) => {
    const currencies = getCurrencies();
    const validCurrency = currencies.find(c => c.value === currency);

    // Geçersiz para birimi ise formatlama yapmadan direkt string dön
    if (!validCurrency) {
        return `${Number(amount ?? 0).toFixed(2)} ${currency || ''}`.trim();
    }

    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 2,
        }).format(Number(amount ?? 0));
    } catch {
        return `${Number(amount ?? 0).toFixed(2)} ${currency || ''}`.trim();
    }
};

const PendingTransfers = ({companyId}) => {
    const {t} = useTranslation(['transfers']);
    const {token} = useAuth();
    const navigate = useNavigate();
    const API_URL = `${process.env.REACT_APP_API_URL}/transfers/pending`;
    const APPROVE_URL = `${process.env.REACT_APP_API_URL}/transfers/approve`;
    const REJECT_URL = `${process.env.REACT_APP_API_URL}/transfers/reject`;

    const [rows, setRows] = useState([]);
    const [limit, setLimit] = useState(20);
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState(null);
    const [approving, setApproving] = useState(false);
    const [rejecting, setRejecting] = useState(false);

    // Kolon görünürlüğü
    const [visibleCols, setVisibleCols] = useState(() =>
        COLUMN_DEFS.reduce(
            (acc, c) => ({
                ...acc,
                [c.key]: true,
            }),
            {}
        )
    );
    const [anchorEl, setAnchorEl] = useState(null);

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

    const handleRejectClick = (transfer) => {
        setSelectedTransfer(transfer);
        setRejectDialogOpen(true);
    };

    const handleRejectConfirm = async () => {
        if (!selectedTransfer) return;

        try {
            setRejecting(true);
            const {data} = await axios.post(
                REJECT_URL,
                {transferId: selectedTransfer.id},
                {
                    headers: {
                        'x-access-token': token,
                        'Content-Type': 'application/json',
                    }
                }
            );

            if (data?.status === 'success') {
                await fetchPendingTransfers();
                setRejectDialogOpen(false);
                setSelectedTransfer(null);
            } else {
                setErrorMsg(data?.message || 'Transfer reddedilemedi');
            }
        } catch (err) {
            setErrorMsg(err?.response?.data?.message || err.message || 'Transfer reddedilirken hata oluştu');
        } finally {
            setRejecting(false);
        }
    };

    const handleRejectCancel = () => {
        setRejectDialogOpen(false);
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
        return fullName || r?.from_external_name;
    };

    const receiverFullName = (r) => {
        const fullName = [r?.receiver_name, r?.receiver_surname].filter(Boolean).join(' ');
        return fullName || r?.to_external_name;
    };

    // Kolon menüsü
    const openColsMenu = (e) => setAnchorEl(e.currentTarget);
    const closeColsMenu = () => setAnchorEl(null);
    const toggleCol = (key) => setVisibleCols((prev) => ({...prev, [key]: !prev[key]}));

    const renderTypeChip = (type) => (
        <Chip
            size="small"
            variant="outlined"
            label={t(`transfers:list.types.${type}`, type)}
            sx={{fontWeight: 600}}
        />
    );

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{mt: 4}}>
                <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px'}}>
                    <CircularProgress size={60}/>
                </Box>
            </Container>
        );
    }

    if (rows.length === 0) {
        return null;
    }

    return (
        <Container maxWidth="lg" sx={{mt: 4, mb: 4}}>
            <Box sx={{mb: 4}}>
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                        fontWeight: 700,
                        color: 'text.primary',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5
                    }}
                >
                    <HourglassEmpty sx={{fontSize: 40, color: 'primary.main'}}/>
                    {t('transfers:pending.title')}
                </Typography>
            </Box>

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
                        background: 'linear-gradient(90deg, rgba(99,102,241,0.8), rgba(236,72,153,0.8))',
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
                            {t('transfers:pending.title')}
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
                            {t('transfers:pending.total', {total})}
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
                        <Tooltip title={t('transfers:list.view.tooltip')}>
                            <IconButton
                                onClick={openColsMenu}
                                size="small"
                                sx={{
                                    color: '#fff',
                                    bgcolor: 'rgba(255,255,255,0.18)',
                                    border: '1px solid rgba(255,255,255,0.25)',
                                    '&:hover': {bgcolor: 'rgba(255,255,255,0.28)'},
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <ViewColumn/>
                            </IconButton>
                        </Tooltip>

                        <Tooltip title={t('transfers:list.refresh')}>
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
                                {COLUMN_DEFS.filter(c => visibleCols[c.key]).map(c => (
                                    <TableCell key={c.key}>{t(`transfers:${c.labelKey}`)}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {rows.map((r) => (
                                <TableRow
                                    key={r.id}
                                    hover
                                    onClick={() => navigate(`/transfer/${r.id}`)}
                                    sx={{cursor: 'pointer'}}
                                >
                                    {visibleCols.created_at && <TableCell>{formatDateTime(r.created_at)}</TableCell>}
                                    {visibleCols.amount && <TableCell
                                        sx={{fontWeight: 700}}>{formatAmount(r.amount, r.currency)}</TableCell>}
                                    {visibleCols.sender && (
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
                                                    <Typography variant={senderFullName(r)?"caption":"body2"} color={senderFullName(r)?"text.secondary":"text.primary"}>
                                                        {r.sender_company_name}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                    )}
                                    {visibleCols.receiver && (
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
                                                    <Typography variant={receiverFullName(r)?"caption":"body2"} color={receiverFullName(r)?"text.secondary":"text.primary"}>
                                                        {r.receiver_company_name}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                    )}
                                    {visibleCols.transfer_type &&
                                        <TableCell>{renderTypeChip(r.transfer_type)}</TableCell>}
                                    {visibleCols.description && <TableCell sx={{
                                        maxWidth: 300,
                                        whiteSpace: 'normal',
                                        wordWrap: 'break-word'
                                    }}>{r.description || '-'}</TableCell>}
                                    {visibleCols.files_count && (
                                        <TableCell>
                                            {r.files_count > 0 ? (
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: 0.5
                                                }}>
                                                    <AttachFile fontSize="small" sx={{color: 'text.secondary'}}/>
                                                    <Typography variant="body2" sx={{fontWeight: 600}}>
                                                        {r.files_count}
                                                    </Typography>
                                                </Box>
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                    )}
                                    {visibleCols.actions && (
                                        <TableCell>
                                            <Box sx={{display: 'flex', gap: 1, justifyContent: 'center'}}>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    color="success"
                                                    startIcon={<CheckCircle/>}
                                                    sx={{color: 'white'}}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleApproveClick(r);
                                                    }}
                                                >
                                                    {t('transfers:pending.approve')}
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    color="error"
                                                    startIcon={<Cancel/>}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRejectClick(r);
                                                    }}
                                                >
                                                    {t('transfers:pending.reject')}
                                                </Button>
                                            </Box>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
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
                        labelRowsPerPage={t('transfers:list.rowsPerPage')}
                        labelDisplayedRows={({from, to, count}) => t('transfers:list.displayedRows', {
                            from,
                            to,
                            count,
                            defaultValue: `${from}-${to} / ${count}`
                        })}
                        sx={{
                            '.MuiTablePagination-toolbar': {flexWrap: 'wrap', minHeight: {xs: 'auto', sm: 52}},
                        }}
                    />
                </Box>
            </Card>

            {/* Kolon menüsü */}
            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={closeColsMenu}
                anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                transformOrigin={{vertical: 'top', horizontal: 'right'}}
                PaperProps={{sx: {width: 280, p: 1}}}
            >
                <Typography variant="subtitle2" sx={{px: 1, pb: 0.5}}>
                    {t('transfers:list.view.columnsTitle')}
                </Typography>
                <Divider sx={{mb: 0.5}}/>
                {COLUMN_DEFS.map(c => (
                    <ListItemButton key={c.key} dense onClick={() => toggleCol(c.key)}>
                        <ListItemIcon>
                            <Checkbox edge="start" size="small" checked={!!visibleCols[c.key]} tabIndex={-1}
                                      disableRipple/>
                        </ListItemIcon>
                        <ListItemText primary={t(`transfers:${c.labelKey}`)}/>
                    </ListItemButton>
                ))}
            </Popover>

            {/* Onay Dialog */}
            <Dialog
                open={approveDialogOpen}
                onClose={handleApproveCancel}
            >
                <DialogTitle>
                    {t('transfers:pending.approveDialog.title')}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {selectedTransfer && (
                            <>
                                {t('transfers:pending.approveDialog.message', {
                                    amount: formatAmount(selectedTransfer.amount, selectedTransfer.currency),
                                    sender: senderFullName(selectedTransfer),
                                    receiver: receiverFullName(selectedTransfer) || selectedTransfer.receiver_company_name
                                })}
                            </>
                        )}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleApproveCancel} disabled={approving}>
                        {t('transfers:pending.approveDialog.cancel')}
                    </Button>
                    <Button
                        onClick={handleApproveConfirm}
                        color="success"
                        variant="contained"
                        disabled={approving}
                        startIcon={approving ? <CircularProgress size={16}/> : <CheckCircle/>}
                    >
                        {approving
                            ? t('transfers:pending.approveDialog.approving')
                            : t('transfers:pending.approveDialog.confirm')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Reddetme Dialog */}
            <Dialog
                open={rejectDialogOpen}
                onClose={handleRejectCancel}
            >
                <DialogTitle>
                    {t('transfers:pending.rejectDialog.title')}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {selectedTransfer && (
                            <>
                                {t('transfers:pending.rejectDialog.message', {
                                    amount: formatAmount(selectedTransfer.amount, selectedTransfer.currency),
                                    sender: senderFullName(selectedTransfer),
                                    receiver: receiverFullName(selectedTransfer) || selectedTransfer.receiver_company_name
                                })}
                            </>
                        )}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleRejectCancel} disabled={rejecting}>
                        {t('transfers:pending.rejectDialog.cancel')}
                    </Button>
                    <Button
                        onClick={handleRejectConfirm}
                        color="error"
                        variant="contained"
                        disabled={rejecting}
                        startIcon={rejecting ? <CircularProgress size={16}/> : <Cancel/>}
                    >
                        {rejecting
                            ? t('transfers:pending.rejectDialog.rejecting')
                            : t('transfers:pending.rejectDialog.confirm')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default PendingTransfers;
