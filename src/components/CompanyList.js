import React, { useEffect, useMemo, useState } from "react";
import {
    Container,
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardActionArea,
    CardContent,
    Avatar,
    Chip,
    Tooltip,
    CircularProgress,
    Alert,
    Button,
    useTheme
} from "@mui/material";
import {Business, Add, ChevronRight} from "@mui/icons-material";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import CreateCompanyDialog from "./CreateCompanyDialog";

export default function CompanyList() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();

    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [openDialog, setOpenDialog] = useState(false);

    const canCreateMore = useMemo(() => {
        if (!user) return false;
        if (typeof user.max_companies !== "number") return true;
        return companies.length < user.max_companies;
    }, [companies.length, user]);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/companies`, {
                headers: { "x-access-token": token }
            });
            if (response.data.status === "success") {
                setCompanies(response.data.companies || []);
            } else {
                setError(response.data.message || "Firmalar yüklenemedi.");
            }
        } catch {
            setError("Bağlantı hatası: Sunucuya ulaşılamadı.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchCompanies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const handleCompanyClick = (c) => navigate(`/company/${c.id}`);
    const handleAddCompany = () => setOpenDialog(true);
    const handleCloseDialog = () => setOpenDialog(false);
    const handleCompanyCreated = () => {
        handleCloseDialog();
        fetchCompanies();
    };

    if (!loading && companies.length === 0 && user?.max_companies === 0) return null;

    const Shell = ({ children }) => (
        <Paper
            elevation={0}
            sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                p: { xs: 2, sm: 3 },
                mt: { xs: 2, sm: 3 },
                bgcolor: theme.palette.background.default
            }}
        >
            {children}
        </Paper>
    );

    const CompanyCard = ({ company }) => (
        <Card
            variant="outlined"
            sx={{
                borderRadius: 3,
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all .25s ease',
                borderColor: (t) => t.palette.divider,
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                    borderColor: (t) => t.palette.primary.light,
                },
                // Üstte ince premium şerit
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    height: 3,
                    background:
                        'linear-gradient(90deg, rgba(99,102,241,0.9), rgba(236,72,153,0.9))',
                },
            }}
        >
            <CardActionArea onClick={() => handleCompanyClick(company)} sx={{ height: '100%' }}>
                <CardContent
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.75,
                        py: { xs: 1.8, sm: 2.1 },
                        px: { xs: 1.8, sm: 2.1 },
                    }}
                >
                    {/* Sol ikon */}
                    <Avatar
                        sx={{
                            bgcolor: (t) => t.palette.primary.main,
                            color: (t) => t.palette.primary.contrastText,
                            width: 42,
                            height: 42,
                            flexShrink: 0,
                            boxShadow: (t) =>
                                t.palette.mode === 'light'
                                    ? '0 0 0 3px rgba(0,0,0,0.04)'
                                    : '0 0 0 3px rgba(255,255,255,0.06)',
                        }}
                    >
                        <Business fontSize="small" />
                    </Avatar>

                    {/* Orta metinler */}
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Tooltip title={company.company_name || ''} placement="top" arrow>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    fontWeight: 700,
                                    color: 'text.primary',
                                    lineHeight: 1.1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {company.company_name}
                            </Typography>
                        </Tooltip>

                        {/* Sektör: varsa çok düşük vurgu ile */}
                        {company.sector && (
                            <Typography
                                variant="body2"
                                sx={{
                                    color: 'text.secondary',
                                    opacity: 0.55,
                                    mt: 0.3,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {company.sector}
                            </Typography>
                        )}
                    </Box>

                    {/* Sağ rozet + ok */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                            label={company.currency}
                            size="small"
                            sx={{
                                fontWeight: 600,
                                fontSize: '0.72rem',
                                height: 24,
                                color: 'text.primary',
                                bgcolor: (t) => (t.palette.mode === 'light' ? 'grey.100' : 'grey.800'),
                                borderColor: (t) => t.palette.divider,
                                borderWidth: 1,
                                borderStyle: 'solid',
                            }}
                        />
                        <ChevronRight
                            sx={{
                                fontSize: 22,
                                color: 'text.secondary',
                                opacity: 0.7,
                                transition: 'transform .2s ease',
                                '.MuiCardActionArea-root:hover &': { transform: 'translateX(2px)' },
                            }}
                        />
                    </Box>
                </CardContent>
            </CardActionArea>
        </Card>
    );

    const AddCompanyCard = () => (
        <Card
            variant="outlined"
            sx={{
                height: '100%',
                borderRadius: 3,
                borderStyle: 'dashed',
                borderColor: (t) => t.palette.divider,
                bgcolor: 'transparent',
                transition: 'all .2s ease',
                '&:hover': {
                    borderColor: (t) => t.palette.mode === 'light' ? 'grey.400' : 'grey.600',
                    boxShadow: 2,
                    bgcolor: (t) => t.palette.action.hover,
                },
            }}
        >
            <CardActionArea
                onClick={handleAddCompany}
                sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    p: 3,
                    gap: 1,
                    '&:focus-visible': {
                        outline: '2px solid',
                        outlineColor: (t) => t.palette.primary.main,
                        outlineOffset: 2,
                    },
                }}
            >
                {/* İkon: dolu arka plan yerine çizgisel, düşük vurgu */}
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        border: '1px solid',
                        borderColor: (t) => t.palette.divider,
                        color: 'text.secondary',
                        opacity: 0.8,
                    }}
                >
                    <Add fontSize="small" />
                </Box>

                <Typography
                    variant="body2"
                    sx={{
                        color: 'text.secondary',
                        fontWeight: 600,
                        letterSpacing: 0.2,
                        opacity: 0.8,
                    }}
                >
                    Yeni Firma Oluştur
                </Typography>
            </CardActionArea>
        </Card>
    );


    return (
        <Container maxWidth="lg">
            <Shell>
                {/* Üst Başlık (açıklama satırı kaldırıldı) */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: { xs: "start", sm: "center" },
                        justifyContent: "space-between",
                        flexDirection: { xs: "column", sm: "row" },
                        gap: 1.5,
                        mb: 2
                    }}
                >
                    <Typography variant="h5" fontWeight={700}>
                        Firmalarım
                    </Typography>

                    {canCreateMore && (
                        <Button variant="contained" startIcon={<Add />} onClick={handleAddCompany}>
                            Yeni Firma
                        </Button>
                    )}
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                        <CircularProgress />
                    </Box>
                ) : companies.length === 0 ? (
                    <Box
                        sx={{
                            textAlign: "center",
                            py: 6,
                            px: 2,
                            bgcolor:
                                theme.palette.mode === "light"
                                    ? "rgba(25,118,210,.04)"
                                    : "rgba(144,202,249,.06)",
                            border: `1px dashed ${theme.palette.divider}`,
                            borderRadius: 3
                        }}
                    >
                        <Avatar
                            sx={{
                                bgcolor: theme.palette.primary.main,
                                color: theme.palette.primary.contrastText,
                                width: 56,
                                height: 56,
                                mb: 1.5,
                                mx: "auto"
                            }}
                        >
                            <Business />
                        </Avatar>
                        <Typography variant="h6" fontWeight={700} gutterBottom>
                            Henüz firmanız yok
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Başlamak için yeni bir firma oluşturun.
                        </Typography>
                        {canCreateMore && (
                            <Button variant="contained" startIcon={<Add />} onClick={handleAddCompany}>
                                Yeni Firma Oluştur
                            </Button>
                        )}
                    </Box>
                ) : (
                    <Grid container spacing={2}>
                        {companies.map((c) => (
                            <Grid key={c.id} item xs={12} sm={6} md={4} lg={3} xl={3}>
                                <CompanyCard company={c} />
                            </Grid>
                        ))}

                        {canCreateMore && (
                            <Grid item xs={12} sm={6} md={4} lg={3} xl={3}>
                                <AddCompanyCard />
                            </Grid>
                        )}
                    </Grid>
                )}
            </Shell>

            <CreateCompanyDialog
                open={openDialog}
                onClose={handleCloseDialog}
                onCompanyCreated={handleCompanyCreated}
                token={token}
            />
        </Container>
    );
}
