import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
    Avatar
} from '@mui/material';
import {
    Refresh,
    ViewColumn,
    Search,
    Clear,
    EventAvailable,
    ExpandMore,
    ExpandLess,
    Description,
} from '@mui/icons-material';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const COLUMN_DEFS = [
    { key: 'user_name', labelKey: 'allowedDays.columns.userName' },
    { key: 'start_date', labelKey: 'allowedDays.columns.startDate' },
    { key: 'end_date', labelKey: 'allowedDays.columns.endDate' },
    { key: 'duration', labelKey: 'allowedDays.columns.duration' },
    { key: 'description', labelKey: 'allowedDays.columns.description' },
    { key: 'filesCount', labelKey: 'allowedDays.columns.filesCount' },
];

const SORT_FIELDS = COLUMN_DEFS
    .filter(c => ['user_name', 'start_date', 'end_date', 'duration'].includes(c.key))
    .map(c => ({ value: c.key, labelKey: c.labelKey }));

const SORT_ORDERS = [
    { value: 'ASC', labelKey: 'allowedDays.sort.asc' },
    { value: 'DESC', labelKey: 'allowedDays.sort.desc' },
];

const UserAllowedDaysList = React.forwardRef(({ companyId, initialLimit = 20, sx }, ref) => {
    const { t, i18n } = useTranslation(['users']);
    const { token } = useAuth();
    const navigate = useNavigate();
    const API_URL = `${process.env.REACT_APP_API_URL}/user-allowed-days/get-by-company-id`;

    // table state
    const [rows, setRows] = useState([]);
    const [limit, setLimit] = useState(initialLimit);
    const [page, setPage] = useState(0);
    const [sortBy, setSortBy] = useState('start_date');
    const [sortOrder, setSortOrder] = useState('DESC');
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [hasFetched, setHasFetched] = useState(false);

    // Date filters - 2 days ago to 7 days ahead
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 2); // 2 days ago
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() + 7); // 7 days ahead
        return date.toISOString().split('T')[0];
    });

    // column visibility
    const [visibleCols, setVisibleCols] = useState(() =>
        COLUMN_DEFS.reduce(
            (acc, c) => ({ ...acc, [c.key]: true }),
            {}
        )
    );
    const [anchorEl, setAnchorEl] = useState(null);

    // Açılıp kapanma durumu
    const [isExpanded, setIsExpanded] = useState(false);

    const filteredRows = useMemo(() => {
        if (!searchTerm.trim()) return rows;
        const q = searchTerm.toLowerCase().trim();
        return rows.filter(item =>
            (item.user_name || '').toLowerCase().includes(q) ||
            (item.description || '').toLowerCase().includes(q)
        );
    }, [rows, searchTerm]);

    const filteredTotal = filteredRows.length;

    // Client-side sorting
    const sortedRows = useMemo(() => {
        const sorted = [...filteredRows];
        sorted.sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];

            // Date sorting
            if (sortBy === 'start_date' || sortBy === 'end_date') {
                aVal = aVal ? new Date(aVal).getTime() : 0;
                bVal = bVal ? new Date(bVal).getTime() : 0;
            }

            // String sorting
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();

            if (aVal < bVal) return sortOrder === 'ASC' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'ASC' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [filteredRows, sortBy, sortOrder]);

    const paginatedRows = useMemo(() => {
        const start = page * limit;
        const end = start + limit;
        return sortedRows.slice(start, end);
    }, [sortedRows, page, limit]);

    const authHeaders = useMemo(
        () => ({
            headers: {
                'x-access-token': token,
                'Content-Type': 'application/json',
            },
        }),
        [token]
    );

    const fetchAllowedDays = useCallback(async () => {
        if (!companyId) {
            setErrorMsg('companyId gerekli');
            return;
        }
        try {
            setLoading(true);
            setErrorMsg('');

            const params = {
                companyId,
                startDate: `${startDate} 00:00:00`,
                endDate: `${endDate} 23:59:59`,
            };

            const { data } = await axios.get(API_URL, {
                ...authHeaders,
                params,
            });

            if (data?.status === 'success') {
                const allowedDaysData = (data.allowedDays ?? []).map(item => ({
                    ...item,
                    user_name: item.user ? `${item.user.name} ${item.user.surname}`.trim() : '-',
                    duration: calculateDuration(item.start_date, item.end_date)
                }));
                setRows(allowedDaysData);
                setTotal(allowedDaysData.length);
            } else {
                setRows([]);
                setTotal(0);
                setErrorMsg(data?.error || 'Mazeret günleri alınamadı');
            }
            setHasFetched(true);
        } catch (err) {
            setRows([]);
            setTotal(0);
            setErrorMsg(err?.response?.data?.error || err.message || 'Beklenmeyen bir hata oluştu');
        } finally {
            setLoading(false);
        }
    }, [API_URL, authHeaders, companyId, startDate, endDate]);

    useEffect(() => {
        if (isExpanded && !hasFetched) {
            fetchAllowedDays();
        }
        // eslint-disable-next-line
    }, [isExpanded]);

    useEffect(() => {
        if (isExpanded && hasFetched) {
            const timeoutId = setTimeout(() => {
                fetchAllowedDays();
            }, 2000);

            return () => clearTimeout(timeoutId);
        }
        // eslint-disable-next-line
    }, [startDate, endDate]);

    React.useImperativeHandle(ref, () => ({ refresh: fetchAllowedDays }));

    useEffect(() => { setPage(0); }, [searchTerm]);

    // column view menu
    const openColsMenu = (e) => setAnchorEl(e.currentTarget);
    const closeColsMenu = () => setAnchorEl(null);
    const toggleCol = (key) => setVisibleCols(prev => ({ ...prev, [key]: !prev[key] }));

    const formatDateTime = (d) => {
        if (!d) return '-';
        const date = new Date(d);
        const dateStr = date.toLocaleDateString(i18n.language, {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        const dayStr = date.toLocaleDateString(i18n.language, { weekday: 'long' });
        const timeStr = date.toLocaleTimeString(i18n.language, {
            hour: '2-digit',
            minute: '2-digit'
        });
        return (
            <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {dateStr}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {dayStr}, {timeStr}
                </Typography>
            </Box>
        );
    };

    const calculateDuration = (startDate, endDate) => {
        if (!startDate || !endDate) return '-';
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const handleRowClick = (allowedDayId) => {
        navigate(`/allowed-day/${allowedDayId}`);
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
                    px: { xs: 1.5, sm: 2.5 },
                    py: { xs: 1.25, sm: 2 },
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    rowGap: { xs: 1, sm: 1.5 },
                    columnGap: { xs: 1, sm: 1.5 },
                    boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                    borderBottom: '1px solid rgba(255,255,255,0.15)',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    position: 'relative',
                }}
            >
                {/* Sol ikon */}
                <Avatar
                    sx={{
                        color: 'white',
                        bgcolor: 'rgba(255,255,255,0.18)',
                        width: { xs: 36, sm: 42 },
                        height: { xs: 36, sm: 42 },
                        backdropFilter: 'blur(4px)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                        flexShrink: 0,
                        order: 0,
                    }}
                >
                    <EventAvailable />
                </Avatar>

                {/* Başlık */}
                <Box sx={{ flex: 1, minWidth: 0, order: 1 }}>
                    <Typography
                        variant="h6"
                        noWrap
                        sx={{
                            fontWeight: 600,
                            letterSpacing: 0.3,
                            textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        }}
                    >
                        {t('allowedDays.title')}
                    </Typography>
                    {total > 0 && (
                        <Typography
                            variant="caption"
                            sx={{
                                opacity: 0.9,
                                textShadow: '0 1px 2px rgba(0,0,0,0.25)',
                                display: 'block',
                                whiteSpace: { xs: 'normal', sm: 'nowrap' },
                            }}
                        >
                            {t('allowedDays.total', { total })} • {t('allowedDays.rowsPerPage')} {limit}
                        </Typography>
                    )}
                </Box>

                {/* Sağ aksiyonlar */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flexWrap: 'wrap',
                        justifyContent: { xs: 'flex-end', sm: 'flex-end' },
                        width: { xs: 'auto', sm: 'auto' },
                        order: 2,
                    }}
                >
                    {/* Görünüm menüsü */}
                    <Tooltip title={t('allowedDays.view.tooltip')}>
                        <IconButton
                            onClick={openColsMenu}
                            size="small"
                            sx={{
                                color: '#fff',
                                bgcolor: 'rgba(255,255,255,0.18)',
                                border: '1px solid rgba(255,255,255,0.25)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' },
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <ViewColumn />
                        </IconButton>
                    </Tooltip>

                    {/* Yenile düğmesi */}
                    <Tooltip title={t('allowedDays.refresh')}>
                        <IconButton
                            onClick={fetchAllowedDays}
                            size="small"
                            sx={{
                                color: '#fff',
                                bgcolor: 'rgba(255,255,255,0.18)',
                                border: '1px solid rgba(255,255,255,0.25)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' },
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <Refresh />
                        </IconButton>
                    </Tooltip>

                    {/* Açılıp kapanma butonu */}
                    <Tooltip title={isExpanded ? t('common:close') : t('common:open')}>
                        <IconButton
                            onClick={() => setIsExpanded(!isExpanded)}
                            size="small"
                            sx={{
                                color: '#fff',
                                bgcolor: 'rgba(255,255,255,0.18)',
                                border: '1px solid rgba(255,255,255,0.25)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' },
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Araç Çubuğu - Yalnızca açıksa göster */}
            {isExpanded && (
                <>
                    {/* Date Filters */}
                    <Box sx={{ px: 2.5, py: 2 }}>
                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                            <TextField
                                size="small"
                                type="date"
                                label={t('workTimelineChart:startDate')}
                                InputLabelProps={{ shrink: true }}
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                sx={{ flex: '1 1 180px', minWidth: 180 }}
                            />

                            <TextField
                                size="small"
                                type="date"
                                label={t('workTimelineChart:endDate')}
                                InputLabelProps={{ shrink: true }}
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                sx={{ flex: '1 1 180px', minWidth: 180 }}
                            />
                        </Box>
                    </Box>

                    <Divider />

                    <Box
                        sx={{
                            px: 2.5,
                            py: 1.5,
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            columnGap: 1.2,
                            rowGap: 1.2,
                        }}
                    >
                        {/* Sol: Arama */}
                        <Box sx={{ flex: '1 1 320px', minWidth: { xs: '100%', sm: 320 } }}>
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
                                    width: '100%',
                                }}
                            >
                                <Search fontSize="small" style={{ opacity: 0.75 }} />
                                <TextField
                                    variant="standard"
                                    fullWidth
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={t('allowedDays.search.placeholder')}
                                    InputProps={{ disableUnderline: true }}
                                    sx={{ mx: 1 }}
                                />
                                {searchTerm && (
                                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                                        <Clear fontSize="small" />
                                    </IconButton>
                                )}
                            </Paper>
                        </Box>

                        {/* Sağ: Sıralama/Filtreler */}
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 1,
                                flex: '0 1 420px',
                                minWidth: { xs: '100%', sm: 320 },
                                justifyContent: { xs: 'flex-start', md: 'flex-end' },
                            }}
                        >
                            <FormControl size="small" sx={{ minWidth: 160, flex: '1 1 160px' }}>
                                <Select
                                    value={sortBy}
                                    onChange={(e) => { setSortBy(e.target.value); setPage(0); }}
                                >
                                    {SORT_FIELDS.map(f => (
                                        <MenuItem key={f.value} value={f.value}>{t(`users:${f.labelKey}`)}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl size="small" sx={{ minWidth: 120, flex: '1 1 120px' }}>
                                <Select
                                    value={sortOrder}
                                    onChange={(e) => { setSortOrder(e.target.value); setPage(0); }}
                                >
                                    {SORT_ORDERS.map(o => (
                                        <MenuItem key={o.value} value={o.value}>{t(`users:${o.labelKey}`)}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    <Divider />

                    {/* Hata */}
                    {errorMsg && <Alert severity="error" sx={{ m: 2 }}>{errorMsg}</Alert>}

                    {/* Tablo */}
                    <TableContainer sx={{ overflowX: 'auto' }}>
                        <Table size="small" sx={{
                            minWidth: { xs: 700, md: 'auto' },
                            tableLayout: 'auto',
                            'thead th': { fontWeight: 700, whiteSpace: 'nowrap', px: 1 },
                            'tbody td': { whiteSpace: 'nowrap', px: 1 },
                            'tbody tr': {
                                transition: 'background-color 120ms ease, transform 120ms ease',
                                '&:hover': { bgcolor: 'action.hover' }
                            },
                            '& thead th, & tbody td': { textAlign: 'center' }
                        }}>
                            <TableHead>
                                <TableRow>
                                    {COLUMN_DEFS.filter(c => visibleCols[c.key]).map(c => (
                                        <TableCell key={c.key}>{t(`users:${c.labelKey}`)}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={COLUMN_DEFS.filter(c => visibleCols[c.key]).length}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CircularProgress size={18} />
                                                <Typography variant="body2" color="text.secondary">{t('allowedDays.loading')}</Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedRows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={COLUMN_DEFS.filter(c => visibleCols[c.key]).length}>
                                            <Box
                                                sx={{
                                                    py: 6,
                                                    textAlign: 'center',
                                                    color: 'text.secondary'
                                                }}
                                            >
                                                <Box sx={{ display: 'inline-block', mb: 2 }}>
                                                    <svg width="96" height="96" viewBox="0 0 96 96" role="img" aria-label="Empty">
                                                        <circle cx="48" cy="48" r="44" fill="none" stroke="currentColor" opacity="0.2" strokeWidth="2"/>
                                                        <circle cx="36" cy="42" r="8" fill="currentColor" opacity="0.15"/>
                                                        <circle cx="60" cy="42" r="8" fill="currentColor" opacity="0.15"/>
                                                        <path d="M30 62c6 6 30 6 36 0" stroke="currentColor" strokeWidth="2" opacity="0.25" fill="none" strokeLinecap="round"/>
                                                    </svg>
                                                </Box>
                                                <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
                                                    {searchTerm ? t('allowedDays.noResultsForSearch') : t('allowedDays.noRecords')}
                                                </Typography>
                                                <Typography variant="body2">{t('allowedDays.search.placeholder')}</Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedRows.map((item, idx) => (
                                        <TableRow
                                            key={item.id || idx}
                                            hover
                                            onClick={() => handleRowClick(item.id)}
                                            sx={{ cursor: 'pointer' }}
                                        >
                                            {visibleCols.user_name && <TableCell>{item.user_name || '-'}</TableCell>}
                                            {visibleCols.start_date && <TableCell>{formatDateTime(item.start_date)}</TableCell>}
                                            {visibleCols.end_date && <TableCell>{formatDateTime(item.end_date)}</TableCell>}
                                            {visibleCols.duration && (
                                                <TableCell>
                                                    <Chip
                                                        label={`${item.duration} ${t('allowedDays.days')}`}
                                                        size="small"
                                                        color="info"
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                            )}
                                            {visibleCols.description && (
                                                <TableCell>
                                                    <Tooltip title={item.description || '-'}>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                maxWidth: 200,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            {item.description || '-'}
                                                        </Typography>
                                                    </Tooltip>
                                                </TableCell>
                                            )}
                                            {visibleCols.filesCount && (
                                                <TableCell>
                                                    {item.filesCount > 0 ? (
                                                        <Chip
                                                            size="small"
                                                            icon={<Description />}
                                                            label={item.filesCount}
                                                            color="primary"
                                                            variant="outlined"
                                                        />
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">-</Typography>
                                                    )}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Alt bar */}
                    <Box sx={{ px: 2, py: 1.5 }}>
                        <TablePagination
                            component="div"
                            count={filteredTotal}
                            page={page}
                            onPageChange={(_, newPage) => setPage(newPage)}
                            rowsPerPage={limit}
                            onRowsPerPageChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(0); }}
                            rowsPerPageOptions={[10, 20, 50, 100]}
                            labelRowsPerPage={t('allowedDays.rowsPerPage')}
                            labelDisplayedRows={({ from, to, count }) => t('allowedDays.displayedRows', { from, to, count })}
                            sx={{
                                '.MuiTablePagination-toolbar': { flexWrap: 'wrap', minHeight: { xs: 'auto', sm: 52 } },
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
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: { width: 260, p: 1 } }}
            >
                <Typography variant="subtitle2" sx={{ px: 1, pb: 0.5 }}>
                    {t('allowedDays.view.columnsTitle')}
                </Typography>
                <Divider sx={{ mb: 0.5 }} />
                {COLUMN_DEFS.map(c => (
                    <ListItemButton key={c.key} dense onClick={() => toggleCol(c.key)}>
                        <ListItemIcon>
                            <Checkbox edge="start" size="small" checked={!!visibleCols[c.key]} tabIndex={-1} disableRipple />
                        </ListItemIcon>
                        <ListItemText primary={t(`users:${c.labelKey}`)} />
                    </ListItemButton>
                ))}
            </Popover>
        </Card>
    );
});

UserAllowedDaysList.displayName = 'UserAllowedDaysList';
export default UserAllowedDaysList;
