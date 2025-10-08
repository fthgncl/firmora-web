// src/components/UsersList.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
    Box,
    Card,
    CardHeader,
    CardContent,
    TextField,
    InputAdornment,
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
    Paper,
    List,
    ListItemButton,
    ListItemText,
    Divider,
    Typography,
} from '@mui/material';
import { Search, Clear, Refresh } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const SORT_FIELDS = [
    { value: 'name', label: 'İsim' },
    { value: 'surname', label: 'Soyisim' },
    { value: 'email', label: 'E-posta' },
    { value: 'phone', label: 'Telefon' },
    { value: 'username', label: 'Kullanıcı adı' },
    { value: 'created_at', label: 'Kayıt tarihi' },
];

const SORT_ORDERS = [
    { value: 'ASC', label: 'Artan' },
    { value: 'DESC', label: 'Azalan' },
];

export default function UsersList({
                                      companyId,
                                      initialLimit = 20,
                                      sx,
                                  }) {
    const { token } = useAuth();
    const API_URL = `${process.env.REACT_APP_API_URL}/search-users`;

    // ---- table state ----
    const [rows, setRows] = useState([]);
    const [limit, setLimit] = useState(initialLimit);
    const [page, setPage] = useState(0); // zero-based
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('ASC');

    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // ---- search state ----
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [suggOpen, setSuggOpen] = useState(false);
    const [suggLoading, setSuggLoading] = useState(false);
    const searchRef = useRef(null);
    const suggAbortRef = useRef(null);

    // offset hesapla
    const offset = useMemo(() => page * limit, [page, limit]);

    const authHeaders = useMemo(
        () => ({
            headers: {
                'x-access-token': token, // not: kullanıcı örneği böyle istedi
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
                searchTerm,
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
    }, [API_URL, authHeaders, companyId, limit, offset, searchTerm, sortBy, sortOrder]);

    // ilk yükleme + her parametre değişiminde fetch
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // ---- debounced suggestions (typeahead) ----
    useEffect(() => {
        // 2 karakterden kısa ise kapat
        if (!searchTerm || searchTerm.trim().length < 2) {
            setSuggestions([]);
            setSuggOpen(false);
            return;
        }

        const handle = setTimeout(async () => {
            try {
                setSuggLoading(true);
                setSuggOpen(true);

                // önceki isteği iptal et
                if (suggAbortRef.current) suggAbortRef.current.abort();
                const controller = new AbortController();
                suggAbortRef.current = controller;

                const body = {
                    companyId,
                    searchTerm,
                    limit: 5,          // öneriler için küçük limit
                    offset: 0,
                    sortBy: 'name',
                    sortOrder: 'ASC',
                };

                const { data } = await axios.post(API_URL, body, {
                    ...authHeaders,
                    signal: controller.signal,
                });

                if (data?.success) {
                    setSuggestions(data.data?.users ?? []);
                } else {
                    setSuggestions([]);
                }
            } catch {
                // öneriler hatasını sessiz geçiyoruz
                setSuggestions([]);
            } finally {
                setSuggLoading(false);
            }
        }, 300); // debounce 300ms

        return () => clearTimeout(handle);
    }, [API_URL, authHeaders, companyId, searchTerm]);

    const handleClearSearch = () => {
        setSearchTerm('');
        setSuggOpen(false);
        setPage(0);
    };

    const handlePickSuggestion = (u) => {
        // Öneriye tıklanınca arama terimini isim/username ile güncelle,
        // tam listeyi o terimle çek.
        const nextTerm = u?.username || u?.email || u?.name || '';
        setSearchTerm(nextTerm);
        setSuggOpen(false);
        setPage(0);
    };

    const handleRefresh = () => {
        fetchUsers();
    };

    return (
        <Card sx={{ ...sx }}>
            <CardHeader
                title="Kullanıcılar"
                action={
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {/* Sort field */}
                        <FormControl size="small">
                            <Select
                                value={sortBy}
                                onChange={(e) => { setSortBy(e.target.value); setPage(0); }}
                            >
                                {SORT_FIELDS.map(f => (
                                    <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Sort order */}
                        <FormControl size="small">
                            <Select
                                value={sortOrder}
                                onChange={(e) => { setSortOrder(e.target.value); setPage(0); }}
                            >
                                {SORT_ORDERS.map(o => (
                                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Search box */}
                        <Box sx={{ position: 'relative' }}>
                            <TextField
                                inputRef={searchRef}
                                size="small"
                                placeholder="Ara (isim, email, tel, username)"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                                onFocus={() => {
                                    if (suggestions.length > 0) setSuggOpen(true);
                                }}
                                onBlur={() => {
                                    // Biraz geciktirip kapat ki tıklama yakalansın
                                    setTimeout(() => setSuggOpen(false), 150);
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search fontSize="small" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            {suggLoading ? (
                                                <CircularProgress size={16} />
                                            ) : searchTerm ? (
                                                <IconButton size="small" onClick={handleClearSearch}>
                                                    <Clear fontSize="small" />
                                                </IconButton>
                                            ) : null}
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            {/* Suggestions dropdown */}
                            {suggOpen && (
                                <Paper
                                    elevation={6}
                                    sx={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        mt: 0.5,
                                        width: 420,
                                        maxHeight: 360,
                                        overflowY: 'auto',
                                        zIndex: 10,
                                        borderRadius: 1.5,
                                    }}
                                >
                                    <List dense disablePadding>
                                        {suggestions.length === 0 && !suggLoading && (
                                            <Box sx={{ p: 1.5 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Sonuç yok
                                                </Typography>
                                            </Box>
                                        )}
                                        {suggestions.map((u, idx) => (
                                            <React.Fragment key={u.id || `${u.username}-${idx}`}>
                                                {idx > 0 && <Divider />}
                                                <ListItemButton onMouseDown={() => handlePickSuggestion(u)}>
                                                    <ListItemText
                                                        primary={
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                    {u.name} {u.surname}
                                                                </Typography>
                                                                {u.username && (
                                                                    <Chip size="small" label={`@${u.username}`} />
                                                                )}
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                                                <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                                                                {u.phone && (
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {u.phone}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        }
                                                    />
                                                </ListItemButton>
                                            </React.Fragment>
                                        ))}
                                    </List>
                                </Paper>
                            )}
                        </Box>

                        <Tooltip title="Yenile">
                            <IconButton onClick={handleRefresh}>
                                <Refresh />
                            </IconButton>
                        </Tooltip>
                    </Box>
                }
            />

            <CardContent sx={{ pt: 0 }}>
                {errorMsg && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {errorMsg}
                    </Alert>
                )}

                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Ad</TableCell>
                                <TableCell>Soyad</TableCell>
                                <TableCell>E-posta</TableCell>
                                <TableCell>Telefon</TableCell>
                                <TableCell>Kullanıcı adı</TableCell>
                                <TableCell>Kayıt tarihi</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CircularProgress size={18} />
                                            <Typography variant="body2" color="text.secondary">
                                                Yükleniyor…
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Kayıt bulunamadı.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rows.map((u) => (
                                    <TableRow key={u.id}>
                                        <TableCell>{u.name}</TableCell>
                                        <TableCell>{u.surname}</TableCell>
                                        <TableCell>{u.email}</TableCell>
                                        <TableCell>{u.phone || '-'}</TableCell>
                                        <TableCell>{u.username}</TableCell>
                                        <TableCell>
                                            {u.created_at
                                                ? new Date(u.created_at).toLocaleString()
                                                : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Toplam: {total}
                        </Typography>
                    </Box>

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
                        labelRowsPerPage="Sayfa başına"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count !== -1 ? count : `≥${to}`}`}
                    />
                </Box>
            </CardContent>
        </Card>
    );
}
