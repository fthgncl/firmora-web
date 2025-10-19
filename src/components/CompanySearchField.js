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
import { Search, Clear, Business } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function CompanySearchField({ minWidth = 320, onCompanySelect, excludeCompanyId = null }) {
    const { t } = useTranslation(['companySearch']);
    const { token } = useAuth();
    const API_URL = `${process.env.REACT_APP_API_URL}/companies/search`;

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
            if (!term) {
                setSearchResults([]);
                return;
            }

            try {
                setLoading(true);

                const params = {
                    searchTerm: term,
                    limit: 10,
                    offset: 0,
                    page: 1,
                    sortBy: 'company_name',
                    sortOrder: 'ASC',
                };

                const { data } = await axios.get(API_URL, {
                    params,
                    headers: {
                        'x-access-token': token,
                    },
                });

                if (data?.status === 200 && data?.data?.companies) {
                    // excludeCompanyId varsa onu filtrele
                    let companies = data.data.companies;
                    if (excludeCompanyId) {
                        companies = companies.filter(c => c.id !== excludeCompanyId);
                    }
                    setSearchResults(companies);
                } else {
                    setSearchResults([]);
                }
            } catch (err) {
                console.error('Firma arama hatası:', err);
                setSearchResults([]);
            } finally {
                setLoading(false);
            }
        },
        [API_URL, token, excludeCompanyId]
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

    const handleCompanyClick = (company) => {
        setAnchorEl(null);
        if (onCompanySelect) onCompanySelect(company);
    };

    const open = Boolean(anchorEl) && !!searchTerm && !loading && searchResults.length > 0;

    return (
        <Box sx={{ position: 'relative', minWidth }}>
            <TextField
                fullWidth
                size="small"
                placeholder={t('placeholder')}
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (e.target.value && !anchorEl) setAnchorEl(e.currentTarget);
                    if (!e.target.value) setAnchorEl(null);
                }}
                onFocus={(e) => {
                    if (searchTerm && searchResults.length > 0 && !anchorEl) {
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
                                <IconButton size="small" onClick={handleClear} aria-label={t('actions.clear')}>
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
                    zIndex: 1300
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
                        minWidth: 320
                    }}
                >
                    <Typography variant="caption" color="text.secondary" sx={{ px: 1, pb: 1, display: 'block' }}>
                        {t('resultsFound', { count: searchResults.length })}
                    </Typography>

                    {searchResults.map((company) => (
                        <Box
                            key={company.id}
                            sx={{
                                p: 1.5,
                                borderRadius: 1,
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'action.hover' },
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                '&:last-child': { borderBottom: 'none' },
                            }}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleCompanyClick(company)}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Business sx={{ fontSize: 18, color: 'primary.main' }} />
                                <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                                    {company.company_name}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}>
                                <Chip
                                    label={company.sector}
                                    size="small"
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                                <Chip
                                    label={company.currency}
                                    size="small"
                                    color="primary"
                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                {t('labels.id')}: {company.id}
                            </Typography>
                        </Box>
                    ))}
                </Paper>
            </Popper>

            {/* Boş sonuç */}
            {!loading && searchTerm && searchResults.length === 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ position: 'absolute', mt: 0.5 }}>
                    {t('noResults')}
                </Typography>
            )}
        </Box>
    );
}
