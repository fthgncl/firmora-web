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
    ShieldMoon,
} from '@mui/icons-material';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../contexts/AuthContext';
import PermissionsDisplay from './PermissionsDisplay';
import AddUserDialog from './AddUserDialog';

const COLUMN_DEFS = [
    { key: 'name',          labelKey: 'list.columns.name' },
    { key: 'surname',       labelKey: 'list.columns.surname' },
    { key: 'username',      labelKey: 'list.columns.username' },
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
    const { token } = useAuth();
    const API_URL = `${process.env.REACT_APP_API_URL}/search-users`;

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
            (acc, c) => ({ ...acc, [c.key]: !['created_at'].includes(c.key) }),
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
                    position: 'relative',
                    px: 2.5, py: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    background: (t) => `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.primary.light} 40%, transparent 100%)`,
                    color: 'primary.contrastText'
                }}
            >
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 40, height: 40 }}>
                    <ShieldMoon />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" noWrap>{t('list.title')}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        {t('list.total', { total })} • {t('list.rowsPerPage')} {limit}
                    </Typography>
                </Box>

                <Tooltip title={t('list.view.tooltip')}>
                    <IconButton
                        onClick={openColsMenu}
                        sx={{ color: 'inherit', bgcolor: 'rgba(255,255,255,0.12)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                    >
                        <ViewColumn />
                    </IconButton>
                </Tooltip>

                <Tooltip title={t('list.refresh')}>
                    <IconButton
                        onClick={fetchUsers}
                        sx={{ ml: 1, color: 'inherit', bgcolor: 'rgba(255,255,255,0.12)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                    >
                        <Refresh />
                    </IconButton>
                </Tooltip>

                {/* Yüzen Ekle Butonu */}
                 <Button
                   variant="contained"
                   startIcon={<PersonAdd />}
                   onClick={() => setOpenAddDialog(true)}
                   sx={{ borderRadius: 999, textTransform: 'none', px: 2, boxShadow: 2, ml: 1 }}
                 >
                   {t('list.addUser', 'Kullanıcı Ekle')}
                 </Button>
            </Box>

            {/* Araç Çubuğu */}
            <Box
                sx={{
                    px: 2.5, py: 1.5,
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr auto' },
                    gap: 1.2,
                    alignItems: 'center'
                }}
            >
                {/* Arama kapsülü */}
                <Paper
                    elevation={0}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 999,
                        border: (t) => `1px solid ${t.palette.divider}`,
                        bgcolor: 'background.paper'
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

                {/* Sıralama alanları */}
                <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'space-between', md: 'flex-end' } }}>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <Select
                            value={sortBy}
                            onChange={(e) => { setSortBy(e.target.value); setPage(0); }}
                        >
                            {SORT_FIELDS.map(f => (
                                <MenuItem key={f.value} value={f.value}>{t(`users:${f.labelKey}`)}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 120 }}>
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
                    }
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
                                <TableCell colSpan={COLUMN_DEFS.length}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CircularProgress size={18} />
                                        <Typography variant="body2" color="text.secondary">{t('list.loading')}</Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : paginatedRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={COLUMN_DEFS.length}>
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
                                    {visibleCols.phone && <TableCell>{u.phone || '-'}</TableCell>}
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
                {COLUMN_DEFS.map(c => (
                    <ListItemButton key={c.key} dense onClick={() => toggleCol(c.key)}>
                        <ListItemIcon>
                            <Checkbox edge="start" size="small" checked={!!visibleCols[c.key]} tabIndex={-1} disableRipple />
                        </ListItemIcon>
                        <ListItemText primary={t(`users:${c.labelKey}`)} />
                    </ListItemButton>
                ))}
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
