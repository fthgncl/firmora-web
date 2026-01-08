import React, {useCallback, useEffect, useMemo, useState} from 'react';
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
    MenuItem,
    FormControl,
    Select,
    Tooltip,
    CircularProgress,
    Alert,
    Chip,
    Divider,
    Typography,
    Popover,
    Checkbox,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Paper,
    Avatar,
    TextField,
    InputLabel,
} from '@mui/material';
import {
    Refresh,
    ViewColumn,
    Search,
    Clear,
    ReceiptLong,
    AttachFile, CheckCircle, Schedule, Error as ErrorIcon,
    ExpandMore,
    ExpandLess,
} from '@mui/icons-material';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../contexts/AuthContext';
import {permissionsService} from '../services/permissionsService';
import {useNavigate} from 'react-router-dom';

// --- Kolon tanımları ---
const COLUMN_DEFS = [
    {key: 'created_at', labelKey: 'list.columns.created_at'},
    {key: 'id', labelKey: 'list.columns.id'},
    {key: 'amount', labelKey: 'list.columns.amount'},
    {key: 'sender', labelKey: 'list.columns.sender'},
    {key: 'receiver', labelKey: 'list.columns.receiver'},
    {key: 'transfer_type', labelKey: 'list.columns.transfer_type'},
    {key: 'description', labelKey: 'list.columns.description'},
    {key: 'files_count', labelKey: 'list.columns.files_count'},
    {key: 'status', labelKey: 'list.columns.status'},
    {key: 'sender_final_balance', labelKey: 'list.columns.sender_final_balance'},
    {key: 'receiver_final_balance', labelKey: 'list.columns.receiver_final_balance'},
];

const SORT_FIELDS = [
    {value: 'created_at', labelKey: 'list.columns.created_at'},
    {value: 'id', labelKey: 'list.columns.id'},
    {value: 'amount', labelKey: 'list.columns.amount'},
    {value: 'status', labelKey: 'list.columns.status'},
    {value: 'transfer_type', labelKey: 'list.columns.transfer_type'},
    {value: 'currency', labelKey: 'list.columns.currency'},
];

const SORT_ORDERS = [
    {value: 'ASC', labelKey: 'sort.asc'},
    {value: 'DESC', labelKey: 'sort.desc'},
];

// --- Yardımcılar ---
const statusChipProps = (status) => {
    switch ((status || '').toLowerCase()) {
        case 'completed':
            return {color: 'success', label: 'Completed', icon: <CheckCircle sx={{fontSize: 18}}/>};
        case 'pending':
            return {color: 'warning', label: 'Pending', icon: <Schedule sx={{fontSize: 18}}/>};
        case 'reject':
            return {color: 'error', label: 'rejected', icon: <ErrorIcon sx={{fontSize: 18}}/>};
        default:
            return {color: 'default', label: status || '-', icon: null};
    }
};

const scopeOptions = [
    {value: '', labelKey: 'list.filters.any'},
    {value: 'user', labelKey: 'list.filters.scope.user'},
    {value: 'company', labelKey: 'list.filters.scope.company'},
    {value: 'external', labelKey: 'list.filters.scope.external'},
];

const statusOptions = [
    {value: '', labelKey: 'list.filters.any'},
    {value: 'completed', labelKey: 'list.status.completed'},
    {value: 'pending', labelKey: 'list.status.pending'},
    {value: 'failed', labelKey: 'list.status.failed'},
    {value: 'reversed', labelKey: 'list.status.reversed'},
];

const transferTypeOptions = [
    {value: '', labelKey: 'list.filters.any'},
    {value: 'company_to_user_same', labelKey: 'list.types.company_to_user_same'},
    {value: 'company_to_user_other', labelKey: 'list.types.company_to_user_other'},
    {value: 'company_to_company_other', labelKey: 'list.types.company_to_company_other'},
    {value: 'user_to_user_same', labelKey: 'list.types.user_to_user_same'},
    {value: 'user_to_user_other', labelKey: 'list.types.user_to_user_other'},
    {value: 'user_to_company_same', labelKey: 'list.types.user_to_company_same'},
    {value: 'user_to_company_other', labelKey: 'list.types.user_to_company_other'},
    {value: 'user_to_external', labelKey: 'list.types.user_to_external'},
    {value: 'company_to_external', labelKey: 'list.types.company_to_external'},
    {value: 'external_to_user', labelKey: 'list.types.external_to_user'},
    {value: 'external_to_company', labelKey: 'list.types.external_to_company'},
];

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

const TransfersTable = React.forwardRef(({companyId, entitySearch = '', initialLimit = 20, sx}, ref) => {

    const {t, i18n} = useTranslation(['transfers']);
    const {token, user} = useAuth();
    const navigate = useNavigate();
    const API_URL = `${process.env.REACT_APP_API_URL}/transfers/list`;

    // --- State ---
    const [rows, setRows] = useState([]);
    const [limit, setLimit] = useState(initialLimit);
    const [page, setPage] = useState(0); // 0-based UI, API'ye 1-based gönderiyoruz
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('DESC');
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [hasPermission, setHasPermission] = useState(false);

    // Filtreler
    const [searchTerm, setSearchTerm] = useState('');
    const [status, setStatus] = useState('');
    const [transferType, setTransferType] = useState('');
    const [fromScope, setFromScope] = useState('');
    const [toScope, setToScope] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Kolon görünürlüğü
    const [visibleCols, setVisibleCols] = useState(() =>
        COLUMN_DEFS.reduce(
            (acc, c) => ({
                ...acc,
                [c.key]: !['id', 'sender_final_balance', 'receiver_final_balance'].includes(c.key),
            }),
            {}
        )
    );
    const [anchorEl, setAnchorEl] = useState(null);

    // Açılıp kapanma durumu
    const [isExpanded, setIsExpanded] = useState(false);

    // Yetki kontrolü
    useEffect(() => {
        const checkPermissions = async () => {
            if (!companyId || !user || !token) {
                setHasPermission(false);
                return;
            }
            try {
                if (entitySearch === user.id) {
                    setHasPermission(true);
                    return;
                }
                const permission = await permissionsService.checkUserRoles(
                    token,
                    user,
                    companyId,
                    ['can_view_company_transfer_history']
                );
                setHasPermission(permission);
            } catch (error) {
                console.error('Yetki kontrolü hatası:', error);
                setHasPermission(false);
            }
        };
        checkPermissions();
    }, [companyId, entitySearch, user, token]);

    const authHeaders = useMemo(
        () => ({
            headers: {
                'x-access-token': token,
                'Content-Type': 'application/json',
            },
        }),
        [token]
    );

    const buildRequestBody = useCallback(() => {
        // Backend: page 1-based; UI: 0-based
        const body = {
            companyId,
            searchTerm: searchTerm.trim(),
            status: status || null,
            transferType: transferType || null,
            fromScope: fromScope || null,
            toScope: toScope || null,
            startDate: startDate || null,
            endDate: endDate || null,
            limit,
            page: page + 1,
            sortBy,
            sortOrder,
            entitySearch
        };
        // Boş değerleri tamamen silelim
        Object.keys(body).forEach((k) => {
            if (body[k] === '' || body[k] === null) delete body[k];
        });
        return body;
    }, [companyId, searchTerm, status, transferType, fromScope, toScope, startDate, endDate, limit, page, sortBy, sortOrder, entitySearch]);

    const fetchTransfers = useCallback(async () => {
        if (!companyId) {
            setErrorMsg('companyId gerekli');
            return;
        }
        try {
            setLoading(true);
            setErrorMsg('');
            const body = buildRequestBody();
            const {data} = await axios.post(API_URL, body, authHeaders);

            if (data?.success !== false) {
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
        // eslint-disable-next-line
    }, []);

    // Debounce için timer ref
    const debounceTimerRef = React.useRef(null);

    // Debounced fetch
    const debouncedFetchTransfers = useCallback(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        setLoading(true); // Bekleme süresince loading göster
        debounceTimerRef.current = setTimeout(() => {
            fetchTransfers();
        }, 800); // 800ms bekle
    }, [fetchTransfers]);

    useEffect(() => {
        if (isExpanded) {
            debouncedFetchTransfers();
        }
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [debouncedFetchTransfers, isExpanded]);

    React.useImperativeHandle(ref, () => ({refresh: fetchTransfers}));

    // Arama yazıldıkça sayfayı başa al
    useEffect(() => {
        setPage(0);
    }, [searchTerm, status, transferType, fromScope, toScope, startDate, endDate, sortBy, sortOrder, limit]);

    // Kolon menüsü
    const openColsMenu = (e) => setAnchorEl(e.currentTarget);
    const closeColsMenu = () => setAnchorEl(null);
    const toggleCol = (key) => setVisibleCols((prev) => ({...prev, [key]: !prev[key]}));

    const formatDateTime = (d) =>
        d ? new Date(d).toLocaleString(i18n.language, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : '-';

    const renderTypeChip = (type) => (
        <Chip
            size="small"
            variant="outlined"
            label={t(`transfers:list.types.${type}`, type)}
            sx={{fontWeight: 600}}
        />
    );

    const renderStatusChip = (s) => {
        const {color, label} = statusChipProps(s);
        return <Chip size="small" sx={{color: 'white'}} color={color}
                     label={t(`transfers:list.status.${label.toLowerCase()}`, label)}/>;
    };

    const senderFullName = (r) => {
        const fullName = [r?.sender_name, r?.sender_surname].filter(Boolean).join(' ');
        return fullName || r?.from_external_name;
    };
    const receiverFullName = (r) => {
        const fullName = [r?.receiver_name, r?.receiver_surname].filter(Boolean).join(' ');
        return fullName || r?.to_external_name;
    };

    // Yetki yoksa null döndür
    if (!hasPermission) {
        return null;
    }

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
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                    <ReceiptLong/>
                </Avatar>

                <Box sx={{flex: 1, minWidth: 0, order: 1}}>
                    <Typography variant="h6" noWrap
                                sx={{fontWeight: 600, letterSpacing: 0.3, textShadow: '0 1px 3px rgba(0,0,0,0.3)'}}>
                        {t('transfers:list.title')}
                    </Typography>

                    {total > 0 && (
                        <Typography
                            variant="caption"
                            sx={{
                                opacity: 0.9,
                                textShadow: '0 1px 2px rgba(0,0,0,0.25)',
                                display: 'block',
                                whiteSpace: {xs: 'normal', sm: 'nowrap'}
                            }}
                        >
                            {t('transfers:list.total', {total})} • {t('transfers:list.rowsPerPage')} {limit}
                        </Typography>
                    )}
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
                            onClick={fetchTransfers}
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

                    <Tooltip title={isExpanded ? t('common:close') : t('common:open')}>
                        <IconButton
                            onClick={() => setIsExpanded(!isExpanded)}
                            size="small"
                            sx={{
                                color: '#fff',
                                bgcolor: 'rgba(255,255,255,0.18)',
                                border: '1px solid rgba(255,255,255,0.25)',
                                '&:hover': {bgcolor: 'rgba(255,255,255,0.28)'},
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {isExpanded ? <ExpandLess/> : <ExpandMore/>}
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Araç Çubuğu (Filtreler) - Yalnızca açıksa göster */}
            {isExpanded && (
                <>
                    <Box sx={{px: 2.5, py: 2}}>
                        {/* Arama */}
                        <Box sx={{mb: 2}}>
                            <Paper
                                elevation={0}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 999,
                                    border: (t) => `1px solid ${t.palette.divider}`,
                                    bgcolor: 'background.paper',
                                }}
                            >
                                <Search fontSize="small" style={{opacity: 0.75}}/>
                                <TextField
                                    variant="standard"
                                    fullWidth
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={t('transfers:list.search.placeholder')}
                                    InputProps={{disableUnderline: true}}
                                    sx={{mx: 1}}
                                />
                                {searchTerm && (
                                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                                        <Clear fontSize="small"/>
                                    </IconButton>
                                )}
                            </Paper>
                        </Box>

                        {/* Filtreler */}
                        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                            {/* Filtreler Bölümü */}
                            <Box>
                                <Typography variant="caption"
                                            sx={{fontWeight: 600, mb: 1, display: 'block', color: 'text.secondary'}}>
                                    {t('transfers:list.filters.title')}
                                </Typography>
                                <Box sx={{display: 'flex', gap: 1.5, flexWrap: 'wrap'}}>
                                    <FormControl size="small" sx={{flex: '1 1 200px', minWidth: 200}}>
                                        <InputLabel>{t('transfers:list.filters.status')}</InputLabel>
                                        <Select value={status} onChange={(e) => setStatus(e.target.value)}
                                                label={t('transfers:list.filters.status')}>
                                            {statusOptions.map((o) => (
                                                <MenuItem key={o.value}
                                                          value={o.value}>{t(`transfers:${o.labelKey}`, o.value || 'Any')}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl size="small" sx={{flex: '1 1 280px', minWidth: 280}}>
                                        <InputLabel>{t('transfers:list.filters.transferType')}</InputLabel>
                                        <Select value={transferType} onChange={(e) => setTransferType(e.target.value)}
                                                label={t('transfers:list.filters.transferType')}>
                                            {transferTypeOptions.map((o) => (
                                                <MenuItem key={o.value}
                                                          value={o.value}>{t(`transfers:${o.labelKey}`, o.value || 'Any')}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl size="small" sx={{flex: '1 1 180px', minWidth: 180}}>
                                        <InputLabel>{t('transfers:list.filters.fromScope')}</InputLabel>
                                        <Select value={fromScope} onChange={(e) => setFromScope(e.target.value)}
                                                label={t('transfers:list.filters.fromScope')}>
                                            {scopeOptions.map((o) => (
                                                <MenuItem key={o.value}
                                                          value={o.value}>{t(`transfers:${o.labelKey}`, o.value || 'Any')}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl size="small" sx={{flex: '1 1 180px', minWidth: 180}}>
                                        <InputLabel>{t('transfers:list.filters.toScope')}</InputLabel>
                                        <Select value={toScope} onChange={(e) => setToScope(e.target.value)}
                                                label={t('transfers:list.filters.toScope')}>
                                            {scopeOptions.map((o) => (
                                                <MenuItem key={o.value}
                                                          value={o.value}>{t(`transfers:${o.labelKey}`, o.value || 'Any')}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <TextField
                                        size="small"
                                        type="date"
                                        label={t('transfers:list.filters.startDate')}
                                        InputLabelProps={{shrink: true}}
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        sx={{flex: '1 1 180px', minWidth: 180}}
                                    />

                                    <TextField
                                        size="small"
                                        type="date"
                                        label={t('transfers:list.filters.endDate')}
                                        InputLabelProps={{shrink: true}}
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        sx={{flex: '1 1 180px', minWidth: 180}}
                                    />
                                </Box>
                            </Box>

                            {/* Sıralama Bölümü */}
                            <Box>
                                <Typography variant="caption"
                                            sx={{fontWeight: 600, mb: 1, display: 'block', color: 'text.secondary'}}>
                                    {t('transfers:list.sort.title')}
                                </Typography>
                                <Box sx={{display: 'flex', gap: 1.5, flexWrap: 'wrap'}}>
                                    <FormControl size="small" sx={{flex: '1 1 200px', minWidth: 200}}>
                                        <InputLabel>{t('transfers:list.sort.sortBy')}</InputLabel>
                                        <Select
                                            value={sortBy}
                                            onChange={(e) => {
                                                setSortBy(e.target.value);
                                                setPage(0);
                                            }}
                                            label={t('transfers:list.sort.sortBy')}
                                        >
                                            {SORT_FIELDS.map(f => (
                                                <MenuItem key={f.value}
                                                          value={f.value}>{t(`transfers:${f.labelKey}`)}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl size="small" sx={{flex: '0 1 150px', minWidth: 150}}>
                                        <InputLabel>{t('transfers:list.sort.order')}</InputLabel>
                                        <Select
                                            value={sortOrder}
                                            onChange={(e) => {
                                                setSortOrder(e.target.value);
                                                setPage(0);
                                            }}
                                            label={t('transfers:list.sort.order')}
                                        >
                                            {SORT_ORDERS.map(o => (
                                                <MenuItem key={o.value}
                                                          value={o.value}>{t(`transfers:${o.labelKey}`)}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Box>
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
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={COLUMN_DEFS.length}>
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                justifyContent: 'center',
                                                py: 4
                                            }}>
                                                <CircularProgress size={20}/>
                                                <Typography variant="body2"
                                                            color="text.secondary">{t('transfers:list.loading')}</Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={COLUMN_DEFS.length}>
                                            <Box sx={{py: 6, textAlign: 'center', color: 'text.secondary'}}>
                                                <Typography variant="subtitle1" sx={{mb: 0.5}}>
                                                    {searchTerm ? t('transfers:list.noResultsForSearch') : t('transfers:list.noRecords')}
                                                </Typography>
                                                <Typography variant="body2"
                                                            sx={{mb: 2}}>{t('transfers:list.search.placeholder')}</Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    rows.map((r) => (
                                        <TableRow
                                            key={r.id}
                                            hover
                                            onClick={() => navigate(`/transfer/${r.id}`)}
                                            sx={{cursor: 'pointer'}}
                                        >
                                            {visibleCols.created_at &&
                                                <TableCell>{formatDateTime(r.created_at)}</TableCell>}
                                            {visibleCols.id && <TableCell
                                                sx={{fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'}}>{r.id}</TableCell>}
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
                                                            <Typography variant="caption" color="text.secondary">
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
                                                            <Typography variant="caption" color="text.secondary">
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
                                                            <AttachFile fontSize="small"
                                                                        sx={{color: 'text.secondary'}}/>
                                                            <Typography variant="body2" sx={{fontWeight: 600}}>
                                                                {r.files_count}
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </TableCell>
                                            )}
                                            {visibleCols.status && <TableCell>{renderStatusChip(r.status)}</TableCell>}
                                            {visibleCols.sender_final_balance &&
                                                <TableCell>{r.sender_final_balance != null ? formatAmount(r.sender_final_balance, r.currency) : '-'}</TableCell>}
                                            {visibleCols.receiver_final_balance &&
                                                <TableCell>{r.receiver_final_balance != null ? formatAmount(r.receiver_final_balance, r.currency) : '-'}</TableCell>}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Alt bar - Sunucu tarafı sayfalama */}
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
                                count
                            })}
                            sx={{
                                '.MuiTablePagination-toolbar': {flexWrap: 'wrap', minHeight: {xs: 'auto', sm: 52}},
                            }}
                        />
                    </Box>
                </>
            )}

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
        </Card>
    );
});

TransfersTable.displayName = 'TransfersTable';
export default TransfersTable;
