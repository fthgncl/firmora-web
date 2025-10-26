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
    Button,
    Paper,
    Avatar
} from '@mui/material';
import {
    Refresh,
    ViewColumn,
    CheckCircleOutline,
    ErrorOutline,
    Search,
    Clear,
    PersonAdd,
    Group,
    Phone
} from '@mui/icons-material';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../contexts/AuthContext';
import PermissionsDisplay from './PermissionsDisplay';
import AddUserDialog from './AddUserDialog';
import { permissionsService } from '../services/permissionsService';

const COLUMN_DEFS = [
    { key: 'name',          labelKey: 'list.columns.name' },
    { key: 'surname',       labelKey: 'list.columns.surname' },
    { key: 'username',      labelKey: 'list.columns.username' },
    { key: 'balance',       labelKey: 'list.columns.balance' },
    { key: 'permissions',   labelKey: 'list.columns.permissions' },
    { key: 'phone',         labelKey: 'list.columns.phone' },
    { key: 'email',         labelKey: 'list.columns.email' },
    { key: 'emailverified', labelKey: 'list.columns.emailverified' },
    { key: 'created_at',    labelKey: 'list.columns.created_at' },
];

const SORT_FIELDS = COLUMN_DEFS
    .filter(c => ['name', 'surname', 'email', 'phone', 'username', 'created_at'].includes(c.key))
    .map(c => ({ value: c.key, labelKey: c.labelKey }));

const SORT_ORDERS = [
    { value: 'ASC',  labelKey: 'list.sort.asc'  },
    { value: 'DESC', labelKey: 'list.sort.desc' },
];

const UsersList = React.forwardRef(({ companyId, initialLimit = 20, sx }, ref) => {
    const { t } = useTranslation(['users']);
    const { token, user } = useAuth();
    const API_URL = `${process.env.REACT_APP_API_URL}/search-users`;

    // Bakiye görüntüleme yetkisi kontrolü
    const [canViewBalance, setCanViewBalance] = useState(false);

    useEffect(() => {
        const checkPermission = async () => {
            if (token && user && companyId) {
                const hasPermission = await permissionsService.checkUserRoles(
                    token,
                    user,
                    companyId,
                    ['can_view_other_users_transfer_history']
                );
                setCanViewBalance(hasPermission);
            }
        };
        checkPermission();
    }, [token, user, companyId]);

    const formatPhoneForTel = (val) => {
        if (!val) return null;
        let s = String(val).trim();
        if (s.startsWith('00')) s = '+' + s.slice(2);
        s = s.replace(/[^\d+]/g, '');
        if (!s.startsWith('+')) s = '+' + s;
        if (s.replace(/\D/g, '').length < 8) return null;
        return s;
    };

    const [openAddDialog, setOpenAddDialog] = useState(false);

    // table state
    const [rows, setRows] = useState([]);
    const [limit, setLimit] = useState(initialLimit);
    const [page, setPage] = useState(0);
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('ASC');
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // column visibility
    const [visibleCols, setVisibleCols] = useState(() =>
        COLUMN_DEFS.reduce(
            (acc, c) => ({ ...acc, [c.key]: !['created_at', 'email', 'emailverified'].includes(c.key) }),
            {}
        )
    );
    const [anchorEl, setAnchorEl] = useState(null);

    const offset = useMemo(() => page * limit, [page, limit]);

    const filteredRows = useMemo(() => {
        if (!searchTerm.trim()) return rows;
        const q = searchTerm.toLowerCase().trim();
        return rows.filter(user =>
            (user.name || '').toLowerCase().includes(q) ||
            (user.surname || '').toLowerCase().includes(q) ||
            (user.email || '').toLowerCase().includes(q) ||
            (user.phone || '').toLowerCase().includes(q) ||
            (user.username || '').toLowerCase().includes(q)
        );
    }, [rows, searchTerm]);

    const filteredTotal = filteredRows.length;

    const paginatedRows = useMemo(() => {
        const start = page * limit;
        const end = start + limit;
        return filteredRows.slice(start, end);
    }, [filteredRows, page, limit]);

    // Bakiye kontrolü için filtrelenmiş kullanıcılar
    const hasAnyBalance = useMemo(() => {
        return canViewBalance && rows.some(u => u.balance != null);
    }, [canViewBalance, rows]);

    const authHeaders = useMemo(
        () => ({
            headers: {
                'x-access-token': token,
                'Content-Type': 'application/json',
            },
        }),
        [token]
    );

    const fetchUsers = useCallback(async () => {
        if (!companyId) {
            setErrorMsg('companyId gerekli');
            return;
        }
        try {
            setLoading(true);
            setErrorMsg('');

            const body = {
                companyId,
                searchTerm: '',
                searchScope: 'company',
                limit,
                offset,
                sortBy,
                sortOrder,
            };

            const { data } = await axios.post(API_URL, body, authHeaders);

            if (data?.success) {
                setRows(data.data?.users ?? []);
                setTotal(data.data?.pagination?.total ?? 0);
            } else {
                setRows([]);
                setTotal(0);
                setErrorMsg(data?.message || 'Kullanıcılar alınamadı');
            }
        } catch (err) {
            setRows([]);
            setTotal(0);
            setErrorMsg(err?.response?.data?.message || err.message || 'Beklenmeyen bir hata oluştu');
        } finally {
            setLoading(false);
        }
    }, [API_URL, authHeaders, companyId, limit, offset, sortBy, sortOrder]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    React.useImperativeHandle(ref, () => ({ refresh: fetchUsers }));

    useEffect(() => { setPage(0); }, [searchTerm]);

    // column view menu
    const openColsMenu = (e) => setAnchorEl(e.currentTarget);
    const closeColsMenu = () => setAnchorEl(null);
    const toggleCol = (key) => setVisibleCols(prev => ({ ...prev, [key]: !prev[key] }));

    const getUserPermissions = (userPermissions) => {
        if (!userPermissions || !Array.isArray(userPermissions) || userPermissions.length === 0) return '-';
        const filtered = userPermissions
            .filter(item => item.companyId === companyId)
            .map(item => item.permissions);
        return filtered.length > 0 ? filtered.join('') : '-';
    };

    const renderVerifyChip = (flag) =>
        flag ? (
            <Chip size="small" color="success" icon={<CheckCircleOutline />} label={t('list.verify.verified')} />
        ) : (
            <Chip size="small" color="warning" icon={<ErrorOutline />} label={t('list.verify.pending')} />
        );

    const formatDate = (d) =>
        d ? new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

    const formatBalance = (balance, currency) => {
        if (balance == null) return '-';
        try {
            const curr = currency && /^[A-Z]{3}$/.test(currency) ? currency : 'USD';
            return new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: curr,
                maximumFractionDigits: 2,
            }).format(Number(balance));
        } catch {
            return `${balance} ${currency || ''}`.trim();
        }
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
            {/* Başlık Şeridi (Tam Responsive + İkonlu Mobil Buton) */}
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
                    <Group />
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
                        {t('list.title')}
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            opacity: 0.9,
                            textShadow: '0 1px 2px rgba(0,0,0,0.25)',
                            display: 'block',
                            whiteSpace: { xs: 'normal', sm: 'nowrap' },
                        }}
                    >
                        {t('list.total', { total })} • {t('list.rowsPerPage')} {limit}
                    </Typography>
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
                    <Tooltip title={t('list.view.tooltip')}>
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
                    <Tooltip title={t('list.refresh')}>
                        <IconButton
                            onClick={fetchUsers}
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

                    {/* Kullanıcı Ekle (Responsive) */}
                    {/* 📱 Mobilde sadece ikon, 💻 Desktop'ta metinli */}
                    <Tooltip title={t('list.addUser', 'Kullanıcı Ekle')}>
                        <Box>
                            {/* Mobil görünüm (sadece ikon) */}
                            <IconButton
                                onClick={() => setOpenAddDialog(true)}
                                size="small"
                                sx={{
                                    display: { xs: 'inline-flex', sm: 'none' },
                                    color: '#fff',
                                    bgcolor: 'rgba(255,255,255,0.18)',
                                    border: '1px solid rgba(255,255,255,0.25)',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' },
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <PersonAdd />
                            </IconButton>

                            {/* Desktop görünüm (metinli) */}
                            <Button
                                variant="contained"
                                startIcon={<PersonAdd />}
                                onClick={() => setOpenAddDialog(true)}
                                sx={{
                                    display: { xs: 'none', sm: 'inline-flex' },
                                    borderRadius: 999,
                                    textTransform: 'none',
                                    px: 2.5,
                                    py: 0.75,
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    bgcolor: 'rgba(255,255,255,0.12)',
                                    border: '1px solid rgba(255,255,255,0.25)',
                                    color: '#fff',
                                    backdropFilter: 'blur(4px)',
                                    boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                                    '&:hover': {
                                        bgcolor: 'rgba(255,255,255,0.25)',
                                        borderColor: 'rgba(255,255,255,0.45)',
                                        boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
                                    },
                                }}
                            >
                                {t('list.addUser', 'Kullanıcı Ekle')}
                            </Button>
                        </Box>
                    </Tooltip>
                </Box>
            </Box>



            {/* Araç Çubuğu */}
            <Box
                sx={{
                    px: 2.5,
                    py: 1.5,
                    display: 'flex',
                    flexWrap: 'wrap',                 // ⭐ sığmayınca alt satıra geç
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
                            width: '100%',               // ⭐ genişliği ebeveyne yayılsın
                        }}
                    >
                        <Search fontSize="small" style={{ opacity: 0.75 }} />
                        <TextField
                            variant="standard"
                            fullWidth
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('list.search.placeholder')}
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
                        flex: '0 1 420px',              // ⭐ genişlik payı, sığmazsa alta
                        minWidth: { xs: '100%', sm: 320 }, // xs’de tam satır, sm’de esnek
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
                    'thead th': { fontWeight: 700, whiteSpace: 'nowrap' },
                    'tbody tr': {
                        transition: 'background-color 120ms ease, transform 120ms ease',
                        '&:hover': { bgcolor: 'action.hover' }
                    },
                    '& thead th, & tbody td': { textAlign: 'center' }
                }}>
                    <TableHead>
                        <TableRow>
                            {COLUMN_DEFS.filter(c => {
                                if (c.key === 'balance' && !hasAnyBalance) return false;
                                return visibleCols[c.key];
                            }).map(c => (
                                <TableCell key={c.key}>{t(`users:${c.labelKey}`)}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={COLUMN_DEFS.filter(c => {
                                    if (c.key === 'balance' && !hasAnyBalance) return false;
                                    return visibleCols[c.key];
                                }).length}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CircularProgress size={18} />
                                        <Typography variant="body2" color="text.secondary">{t('list.loading')}</Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : paginatedRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={COLUMN_DEFS.filter(c => {
                                    if (c.key === 'balance' && !hasAnyBalance) return false;
                                    return visibleCols[c.key];
                                }).length}>
                                    <Box
                                        sx={{
                                            py: 6,
                                            textAlign: 'center',
                                            color: 'text.secondary'
                                        }}
                                    >
                                        {/* Minimal inline SVG illüstrasyonu */}
                                        <Box sx={{ display: 'inline-block', mb: 2 }}>
                                            <svg width="96" height="96" viewBox="0 0 96 96" role="img" aria-label="Empty">
                                                <circle cx="48" cy="48" r="44" fill="none" stroke="currentColor" opacity="0.2" strokeWidth="2"/>
                                                <circle cx="36" cy="42" r="8" fill="currentColor" opacity="0.15"/>
                                                <circle cx="60" cy="42" r="8" fill="currentColor" opacity="0.15"/>
                                                <path d="M30 62c6 6 30 6 36 0" stroke="currentColor" strokeWidth="2" opacity="0.25" fill="none" strokeLinecap="round"/>
                                            </svg>
                                        </Box>
                                        <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
                                            {searchTerm ? t('list.noResultsForSearch') : t('list.noRecords')}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 2 }}>{t('list.search.placeholder')}</Typography>
                                        <Button
                                            startIcon={<PersonAdd />}
                                            variant="contained"
                                            onClick={() => setOpenAddDialog(true)}
                                            sx={{ borderRadius: 999 }}
                                        >
                                            {t('list.addUser', 'Kullanıcı Ekle')}
                                        </Button>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedRows.map(u => (
                                <TableRow key={u.id} hover>
                                    {visibleCols.name && <TableCell>{u.name}</TableCell>}
                                    {visibleCols.surname && <TableCell>{u.surname}</TableCell>}
                                    {visibleCols.username && <TableCell>{u.username}</TableCell>}
                                    {visibleCols.balance && hasAnyBalance && u.balance != null && (
                                        <TableCell sx={{ fontWeight: 600 }}>{formatBalance(u.balance, u.currency)}</TableCell>
                                    )}
                                    {visibleCols.permissions && (
                                        <TableCell>
                                            <PermissionsDisplay
                                                onEditedUser={fetchUsers}
                                                userId={u.id}
                                                companyId={companyId}
                                                userPermissions={getUserPermissions(u.permissions)}
                                            />
                                        </TableCell>
                                    )}
                                    {visibleCols.phone && (
                                        <TableCell>
                                            {u.phone ? (() => {
                                                const tel = formatPhoneForTel(u.phone);
                                                return tel ? (
                                                    <Tooltip title={u.phone}>
                                                        <IconButton
                                                            size="small"
                                                            component="a"
                                                            href={`tel:${tel}`}
                                                            onClick={(e) => e.stopPropagation()} // satır tıklamasını tetikleme
                                                            aria-label={t('list.callUser')}
                                                            sx={{
                                                                border: (theme) => `1px solid ${theme.palette.divider}`,
                                                                bgcolor: 'action.hover',
                                                                '&:hover': { bgcolor: 'action.selected' }
                                                            }}
                                                        >
                                                            <Phone fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">-</Typography>
                                                );
                                            })() : (
                                                <Typography variant="body2" color="text.secondary">-</Typography>
                                            )}
                                        </TableCell>
                                    )}
                                    {visibleCols.email && <TableCell>{u.email}</TableCell>}
                                    {visibleCols.emailverified && <TableCell>{renderVerifyChip(Boolean(u.emailverified))}</TableCell>}
                                    {visibleCols.created_at && <TableCell>{formatDate(u.created_at)}</TableCell>}
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
                    labelRowsPerPage={t('list.rowsPerPage')}
                    labelDisplayedRows={({ from, to, count }) => t('list.displayedRows', { from, to, count })}
                    sx={{
                        '.MuiTablePagination-toolbar': { flexWrap: 'wrap', minHeight: { xs: 'auto', sm: 52 } },
                    }}
                />
            </Box>

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
                    {t('list.view.columnsTitle')}
                </Typography>
                <Divider sx={{ mb: 0.5 }} />
                {COLUMN_DEFS.map(c => {
                    // Bakiye sütununu yetki yoksa veya hiç bakiye yoksa menüde gösterme
                    if (c.key === 'balance' && !hasAnyBalance) return null;
                    return (
                        <ListItemButton key={c.key} dense onClick={() => toggleCol(c.key)}>
                            <ListItemIcon>
                                <Checkbox edge="start" size="small" checked={!!visibleCols[c.key]} tabIndex={-1} disableRipple />
                            </ListItemIcon>
                            <ListItemText primary={t(`users:${c.labelKey}`)} />
                        </ListItemButton>
                    );
                })}
            </Popover>

            {/* AddUserDialog */}
            <AddUserDialog
                open={openAddDialog}
                onClose={() => setOpenAddDialog(false)}
                companyId={companyId}
                onUserAdded={fetchUsers}
            />
        </Card>
    );
});

UsersList.displayName = 'UsersList';
export default UsersList;
