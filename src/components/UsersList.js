// src/components/UsersList.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
    Box,
    Card,
    CardHeader,
    CardContent,
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
} from '@mui/material';
import { Refresh, ViewColumn, CheckCircleOutline, ErrorOutline, Search, Clear } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import PermissionsDisplay from './PermissionsDisplay';

// Kolon tanımları
const COLUMN_DEFS = [
    { key: 'name', label: 'Ad' },
    { key: 'surname', label: 'Soyad' },
    { key: 'email', label: 'E-posta' },
    { key: 'phone', label: 'Telefon' },
    { key: 'username', label: 'Kullanıcı adı' },
    { key: 'permissions', label: 'Yetkiler' },
    { key: 'emailverified', label: 'E-posta Onayı' },
    { key: 'created_at', label: 'Kayıt tarihi' }
];

const SORT_FIELDS = COLUMN_DEFS
    .filter(c => ['name', 'surname', 'email', 'phone', 'username', 'created_at'].includes(c.key))
    .map(c => ({ value: c.key, label: c.label }));

const SORT_ORDERS = [
    { value: 'ASC', label: 'Artan' },
    { value: 'DESC', label: 'Azalan' },
];

const UsersList = React.forwardRef(({ companyId, initialLimit = 20, sx }, ref) => {
    const { token } = useAuth();
    const API_URL = `${process.env.REACT_APP_API_URL}/search-users`;

    // tablo state
    const [rows, setRows] = useState([]);
    const [limit, setLimit] = useState(initialLimit);
    const [page, setPage] = useState(0);
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('ASC');
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // kolon görünürlük
    const [visibleCols, setVisibleCols] = useState(() =>
        COLUMN_DEFS.reduce(
            (acc, c) => ({ ...acc, [c.key]: !['created_at'].includes(c.key) }), // Sadece kayıt tarihi varsayılan kapalı
            {}
        )
    );
    const [anchorEl, setAnchorEl] = useState(null);

    const offset = useMemo(() => page * limit, [page, limit]);

    // Arama terimine göre filtrelenmiş satırlar
    const filteredRows = useMemo(() => {
        if (!searchTerm.trim()) {
            return rows;
        }

        const lowerSearch = searchTerm.toLowerCase().trim();
        return rows.filter(user => {
            return (
                user.name?.toLowerCase().includes(lowerSearch) ||
                user.surname?.toLowerCase().includes(lowerSearch) ||
                user.email?.toLowerCase().includes(lowerSearch) ||
                user.phone?.toLowerCase().includes(lowerSearch) ||
                user.username?.toLowerCase().includes(lowerSearch)
            );
        });
    }, [rows, searchTerm]);

    // Filtrelenmiş satırların toplam sayısı
    const filteredTotal = filteredRows.length;

    // Sayfalanmış satırlar
    const paginatedRows = useMemo(() => {
        const start = page * limit;
        const end = start + limit;
        return filteredRows.slice(start, end);
    }, [filteredRows, page, limit]);

    const authHeaders = useMemo(
        () => ({
            headers: {
                'x-access-token': token, // senin istediğin header
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
                searchScope: "company",
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

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Ref ile fetchUsers metodunu dışarı aç
    React.useImperativeHandle(ref, () => ({
        refresh: fetchUsers
    }));

    // Arama terimi değiştiğinde sayfayı sıfırla
    useEffect(() => {
        setPage(0);
    }, [searchTerm]);

    // Görünüm menüsü
    const openColsMenu = (e) => setAnchorEl(e.currentTarget);
    const closeColsMenu = () => setAnchorEl(null);
    const toggleCol = (key) => setVisibleCols(prev => ({ ...prev, [key]: !prev[key] }));

    // Yetkileri companyId'ye göre filtrele ve birleştir
    const getUserPermissions = (userPermissions) => {
        if (!userPermissions || !Array.isArray(userPermissions) || userPermissions.length === 0) {
            return '-';
        }

        const filtered = userPermissions
            .filter(item => item.companyId === companyId)
            .map(item => item.permissions);

        return filtered.length > 0 ? filtered.join('') : '-';
    };

    // Chip + Tarih
    const renderVerifyChip = (flag) =>
        flag ? (
            <Chip size="small" color="success" icon={<CheckCircleOutline />} label="Onaylandı" />
        ) : (
            <Chip size="small" color="warning" icon={<ErrorOutline />} label="Bekleniyor" />
        );

    const formatDate = (d) =>
        d
            ? new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
            : '-';

    return (
        <Card sx={{ ...sx }}>
            <CardHeader title="Kullanıcılar" />

            <CardContent>
                {/* Kontroller - Responsive */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: { xs: 2, md: 1 },
                        mb: 2,
                        alignItems: { xs: 'stretch', md: 'center' },
                    }}
                >
                    {/* Sol grup: Sıralama kontrolleri */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(0); }}>
                                {SORT_FIELDS.map(f => (
                                    <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 100 }}>
                            <Select value={sortOrder} onChange={(e) => { setSortOrder(e.target.value); setPage(0); }}>
                                {SORT_ORDERS.map(o => (
                                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Tooltip title="Görünüm">
                            <IconButton onClick={openColsMenu} size="small">
                                <ViewColumn />
                            </IconButton>
                        </Tooltip>
                        <Popover
                            open={Boolean(anchorEl)}
                            anchorEl={anchorEl}
                            onClose={closeColsMenu}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            PaperProps={{ sx: { width: 240, p: 1 } }}
                        >
                            <Typography variant="subtitle2" sx={{ px: 1, pb: 0.5 }}>Görünecek Sütunlar</Typography>
                            <Divider sx={{ mb: 0.5 }} />
                            {COLUMN_DEFS.map(c => (
                                <ListItemButton key={c.key} dense onClick={() => toggleCol(c.key)}>
                                    <ListItemIcon>
                                        <Checkbox edge="start" size="small" checked={!!visibleCols[c.key]} tabIndex={-1} disableRipple />
                                    </ListItemIcon>
                                    <ListItemText primary={c.label} />
                                </ListItemButton>
                            ))}
                        </Popover>
                    </Box>

                    {/* Sağ grup: Arama */}
                    <Box sx={{ display: 'flex', gap: 1, flex: { xs: '1', md: '0 1 auto' }, alignItems: 'center' }}>
                        <Box sx={{ flex: 1, minWidth: { xs: '100%', md: 320 }, maxWidth: { md: 480 } }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Tabloda ara (isim, email, tel, username)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search fontSize="small" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: searchTerm ? (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => setSearchTerm('')}>
                                                <Clear fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    ) : null,
                                }}
                            />
                        </Box>

                        <Tooltip title="Yenile">
                            <IconButton onClick={fetchUsers} size="small">
                                <Refresh />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Hata mesajı */}
                {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}

                <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: { xs: 600, md: 'auto' } }}>
                        <TableHead>
                            <TableRow>
                                {COLUMN_DEFS.filter(c => visibleCols[c.key]).map(c => (
                                    <TableCell key={c.key}>{c.label}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={COLUMN_DEFS.length}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CircularProgress size={18} />
                                            <Typography variant="body2" color="text.secondary">Yükleniyor…</Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedRows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={COLUMN_DEFS.length}>
                                        <Typography variant="body2" color="text.secondary">
                                            {searchTerm ? 'Arama sonucu bulunamadı.' : 'Kayıt bulunamadı.'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedRows.map(u => (
                                    <TableRow key={u.id}>
                                        {visibleCols.name && <TableCell>{u.name}</TableCell>}
                                        {visibleCols.surname && <TableCell>{u.surname}</TableCell>}
                                        {visibleCols.email && <TableCell>{u.email}</TableCell>}
                                        {visibleCols.phone && <TableCell>{u.phone || '-'}</TableCell>}
                                        {visibleCols.username && <TableCell>{u.username}</TableCell>}
                                        {visibleCols.permissions && (
                                            <TableCell>
                                                <PermissionsDisplay userPermissions={getUserPermissions(u.permissions)} />
                                            </TableCell>
                                        )}
                                        {visibleCols.emailverified && <TableCell>{renderVerifyChip(Boolean(u.emailverified))}</TableCell>}
                                        {visibleCols.created_at && <TableCell>{formatDate(u.created_at)}</TableCell>}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box 
                    sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' }, 
                        justifyContent: 'space-between', 
                        mt: 2,
                        gap: 1
                    }}
                >
                    <Typography variant="body2" color="text.secondary">
                        {searchTerm 
                            ? `Toplam: ${filteredTotal} (${total} içinden)` 
                            : `Toplam: ${total}`
                        }
                    </Typography>
                    <TablePagination
                        component="div"
                        count={filteredTotal}
                        page={page}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        rowsPerPage={limit}
                        onRowsPerPageChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(0); }}
                        rowsPerPageOptions={[10, 20, 50, 100]}
                        labelRowsPerPage="Sayfa başına"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
                        sx={{
                            '.MuiTablePagination-toolbar': {
                                flexWrap: 'wrap',
                                minHeight: { xs: 'auto', sm: 52 }
                            }
                        }}
                    />
                </Box>
            </CardContent>
        </Card>
    );
});

UsersList.displayName = 'UsersList';

export default UsersList;
