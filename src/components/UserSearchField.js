import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import {
    Box,
    TextField,
    InputAdornment,
    IconButton,
    CircularProgress,
    Typography,
    Chip,
    Paper,
} from '@mui/material';
import { Popper } from '@mui/material';
import { Search, Clear, ErrorOutline } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function UserSearchField({
                                            companyId,
                                            minWidth = 320,
                                            onUserSelect,
                                            searchScope = 'all',
                                        }) {
    const { token } = useAuth();
    const { t } = useTranslation(['users', 'common']);
    const API_URL = `${process.env.REACT_APP_API_URL}/search-users`;

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedTerm, setDebouncedTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [loading, setLoading] = useState(false);

    // Debounce
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Arama sonuçlarını getir
    const fetchSearchResults = useCallback(
        async (term) => {
            if (!term || !companyId) {
                setSearchResults([]);
                return;
            }

            try {
                setLoading(true);

                const body = {
                    companyId,
                    searchTerm: term,
                    searchScope: searchScope,
                    limit: 10,
                    offset: 0,
                    sortBy: 'name',
                    sortOrder: 'ASC',
                };

                const { data } = await axios.post(API_URL, body, {
                    headers: {
                        'x-access-token': token,
                        'Content-Type': 'application/json',
                    },
                });

                if (data?.success) {
                    setSearchResults(data.data?.users ?? []);
                } else {
                    setSearchResults([]);
                }
            } catch (err) {
                console.error('Arama hatası:', err);
                setSearchResults([]);
            } finally {
                setLoading(false);
            }
        },
        [API_URL, token, companyId, searchScope]
    );

    // Arama terimi değiştiğinde arama yap
    useEffect(() => {
        if (debouncedTerm) {
            fetchSearchResults(debouncedTerm);
        } else {
            setSearchResults([]);
        }
    }, [debouncedTerm, fetchSearchResults]);

    const handleClear = () => {
        setSearchTerm('');
        setAnchorEl(null);
    };

    const handleUserClick = (user) => {
        setAnchorEl(null);
        if (onUserSelect) onUserSelect(user);
    };

    const renderVerifyChip = (verified) => {
        if (verified) {
            return <Chip size="small" color="success" label={t('users:verify.verified')} />;
        }
        return (
            <Chip
                size="small"
                color="warning"
                icon={<ErrorOutline />}
                label={t('users:verify.pending')}
            />
        );
    };

    const open = Boolean(anchorEl) && !!searchTerm && !loading;

    return (
        <Box sx={{ position: 'relative', minWidth }}>
            <TextField
                fullWidth
                size="small"
                placeholder={t('users:search.placeholder')}
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (e.target.value && !anchorEl) setAnchorEl(e.currentTarget);
                    if (!e.target.value) setAnchorEl(null);
                }}
                onFocus={(e) => {
                    if (searchTerm && !anchorEl) {
                        setAnchorEl(e.currentTarget);
                    }
                }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Search fontSize="small" />
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position="end">
                            {loading ? (
                                <CircularProgress size={16} />
                            ) : searchTerm ? (
                                <IconButton size="small" onClick={handleClear}>
                                    <Clear fontSize="small" />
                                </IconButton>
                            ) : null}
                        </InputAdornment>
                    ),
                }}
            />

            <Popper
                open={open}
                anchorEl={anchorEl}
                placement="bottom-start"
                style={{
                    width: Math.max(anchorEl?.offsetWidth || 0, 480),
                    maxWidth: '95vw',
                    zIndex: 1300,
                }}
            >
                <Paper
                    elevation={6}
                    sx={{
                        p: 1,
                        maxHeight: 400,
                        overflowY: 'auto',
                        mt: 0.5,
                        borderRadius: 1.5,
                        minWidth: 320,
                    }}
                >
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ px: 1, pb: 1, display: 'block' }}
                    >
                        {searchResults.length > 0 
                            ? t('users:search.resultsFound', { count: searchResults.length })
                            : t('users:search.noResults')
                        }
                    </Typography>

                    {searchResults.map((user) => (
                        <Box
                            key={user.id}
                            sx={{
                                p: 1.5,
                                borderRadius: 1,
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'action.hover' },
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                '&:last-child': { borderBottom: 'none' },
                            }}
                            onMouseDown={(e) => e.preventDefault()} // input blur olmasın
                            onClick={() => handleUserClick(user)}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: 2,
                                }}
                            >
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                                        {user.name} {user.surname}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ wordBreak: 'break-word', display: 'block' }}
                                    >
                                        {user.email}
                                    </Typography>
                                    {user.phone && (
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ display: 'block', mt: 0.25 }}
                                        >
                                            • {user.phone}
                                        </Typography>
                                    )}
                                </Box>
                                {renderVerifyChip(Boolean(user.emailverified))}
                            </Box>
                        </Box>
                    ))}
                </Paper>
            </Popper>
        </Box>
    );
}
