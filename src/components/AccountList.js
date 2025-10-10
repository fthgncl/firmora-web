import React, {useState, useEffect} from 'react';
import {
    Container,
    Box,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    useTheme
} from '@mui/material';
import {AccountBalance} from '@mui/icons-material';
import axios from 'axios';
import {useAuth} from '../contexts/AuthContext';

export default function AccountList() {
    const {token} = useAuth();
    const theme = useTheme();

    const accountCardStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '160px',
        height: '130px',
        margin: '10px',
        padding: '12px',
        borderRadius: '12px',
        boxShadow: theme.shadows[2],
        transition: 'all 0.3s ease',
        textAlign: 'center',
        backgroundColor: theme.palette.background.paper,
        '@media (max-width:768px)': {
            width: '140px',
            height: '110px',
            margin: '8px',
        },
        '@media (max-width:480px)': {
            width: '120px',
            height: '100px',
            margin: '6px',
        },
    };

    const containerStyle = {
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '16px',
        padding: '24px',
        backgroundColor: theme.palette.background.default,
        marginTop: '32px',
        '@media (max-width:768px)': {
            padding: '16px',
            marginTop: '24px',
        },
    };

    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/accounts`,
                    {
                        headers: {
                            'x-access-token': token
                        }
                    }
                );

                if (response.data.status === "success") {
                    setAccounts(response.data.accounts);
                }
            } catch (err) {
                console.error('Hesap listesi yüklenirken hata:', err);
                if (err.response) {
                    setError(err.response.data.message || 'Hesaplar yüklenirken bir hata oluştu');
                } else if (err.request) {
                    setError('Sunucuya ulaşılamıyor');
                } else {
                    setError('Beklenmeyen bir hata oluştu');
                }
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchAccounts();
        }
    }, [token]);

    if (loading) {
        return (
            <Container maxWidth="lg">
                <Paper sx={containerStyle}>
                    <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px'}}>
                        <CircularProgress/>
                    </Box>
                </Paper>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg">
                <Paper sx={containerStyle}>
                    <Alert severity="error">{error}</Alert>
                </Paper>
            </Container>
        );
    }

    if (accounts.length === 0) {
        return null;
    }

    return (
        <Container maxWidth="lg">
            <Paper sx={containerStyle}>
                <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                        textAlign: 'center',
                        mb: 3,
                        color: 'text.primary',
                        fontWeight: 600
                    }}
                >
                    Hesaplarım
                </Typography>

                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        alignItems: 'flex-start'
                    }}
                >
                    {accounts.map((account) => (
                        <Paper
                            key={account.id}
                            sx={accountCardStyle}
                            elevation={2}
                        >
                            <AccountBalance
                                sx={{
                                    fontSize: '36px',
                                    color: 'primary.main',
                                    mb: 0.5
                                }}
                            />
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 600,
                                    color: 'text.primary',
                                    mb: 0.3,
                                    fontSize: '0.85rem',
                                    lineHeight: 1.2
                                }}
                            >
                                {account.balance.toFixed(2)}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: 'text.secondary',
                                    fontSize: '0.7rem',
                                    lineHeight: 1.1
                                }}
                            >
                                {account.currency}
                            </Typography>
                        </Paper>
                    ))}
                </Box>
            </Paper>
        </Container>
    );
}
