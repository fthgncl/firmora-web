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
import { Refresh, Visibility, CheckCircleOutline, ErrorOutline } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import UserSearchField from './UserSearchField';

// Kolon tanımları
const COLUMN_DEFS = [
    { key: 'name', label: 'Ad' },
    { key: 'surname', label: 'Soyad' },
    { key: 'email', label: 'E-posta' },
    { key: 'phone', label: 'Telefon' },
    { key: 'username', label: 'Kullanıcı adı' },
    { key: 'emailverified', label: 'E-posta Onay' },
    { key: 'created_at', label: 'Kayıt tarihi' },
];

const SORT_FIELDS = COLUMN_DEFS
    .filter(c => ['name', 'surname', 'email', 'phone', 'username', 'created_at'].includes(c.key))
    .map(c => ({ value: c.key, label: c.label }));

const SORT_ORDERS = [
    { value: 'ASC', label: 'Artan' },
    { value: 'DESC', label: 'Azalan' },
];

export default function UsersList({ companyId, initialLimit = 20, sx }) {
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

    // kolon görünürlük
    const [visibleCols, setVisibleCols] = useState(() =>
        COLUMN_DEFS.reduce(
            (acc, c) => ({ ...acc, [c.key]: c.key !== 'created_at' }), // Kayıt tarihi varsayılan kapalı
            {}
        )
    );
    const [anchorEl, setAnchorEl] = useState(null);

    const offset = useMemo(() => page * limit, [page, limit]);

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

    // Görünüm menüsü
    const openColsMenu = (e) => setAnchorEl(e.currentTarget);
    const closeColsMenu = () => setAnchorEl(null);
    const toggleCol = (key) => setVisibleCols(prev => ({ ...prev, [key]: !prev[key] }));

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
            <CardHeader
                title="Kullanıcılar"
                action={
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {/* Sıralama alanı */}
                        <FormControl size="small">
                            <Select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(0); }}>
                                {SORT_FIELDS.map(f => (
                                    <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Sıralama yönü */}
                        <FormControl size="small">
                            <Select value={sortOrder} onChange={(e) => { setSortOrder(e.target.value); setPage(0); }}>
                                {SORT_ORDERS.map(o => (
                                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Görünüm (kolon görünürlüğü) */}
                        <Tooltip title="Görünüm">
                            <IconButton onClick={openColsMenu}><Visibility /></IconButton>
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

                        {/* Arama */}
                        <UserSearchField 
                            companyId={companyId} 
                            minWidth={480}
                            onUserSelect={(user) => {
                                // Kullanıcı seçildiğinde yapılacak işlem
                                console.log('Seçilen kullanıcı:', user);
                            }}
                        />

                        <Tooltip title="Yenile">
                            <IconButton onClick={fetchUsers}><Refresh /></IconButton>
                        </Tooltip>
                    </Box>
                }
            />

            <CardContent sx={{ pt: 0 }}>
                {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}

                <TableContainer>
                    <Table size="small">
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
                            ) : rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={COLUMN_DEFS.length}>
                                        <Typography variant="body2" color="text.secondary">Kayıt bulunamadı.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rows.map(u => (
                                    <TableRow key={u.id}>
                                        {visibleCols.name && <TableCell>{u.name}</TableCell>}
                                        {visibleCols.surname && <TableCell>{u.surname}</TableCell>}
                                        {visibleCols.email && <TableCell>{u.email}</TableCell>}
                                        {visibleCols.phone && <TableCell>{u.phone || '-'}</TableCell>}
                                        {visibleCols.username && <TableCell>{u.username}</TableCell>}
                                        {visibleCols.emailverified && <TableCell>{renderVerifyChip(Boolean(u.emailverified))}</TableCell>}
                                        {visibleCols.created_at && <TableCell>{formatDate(u.created_at)}</TableCell>}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">Toplam: {total}</Typography>
                    <TablePagination
                        component="div"
                        count={total}
                        page={page}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        rowsPerPage={limit}
                        onRowsPerPageChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(0); }}
                        rowsPerPageOptions={[10, 20, 50, 100]}
                        labelRowsPerPage="Sayfa başına"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
                    />
                </Box>
            </CardContent>
        </Card>
    );
}
