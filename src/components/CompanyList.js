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
import { Business, Add } from "@mui/icons-material";
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
                height: "100%",
                transition: "all .25s ease",
                "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: theme.shadows[4],
                    borderColor: theme.palette.primary.light
                }
            }}
        >
            <CardActionArea onClick={() => handleCompanyClick(company)} sx={{ height: "100%" }}>
                <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                        sx={{
                            bgcolor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                            width: 46,
                            height: 46,
                            flexShrink: 0
                        }}
                    >
                        <Business fontSize="small" />
                    </Avatar>

                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Tooltip title={company.company_name || ""} placement="top" arrow>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    fontWeight: 700,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap"
                                }}
                            >
                                {company.company_name}
                            </Typography>
                        </Tooltip>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                            }}
                        >
                            {company.sector || "—"}
                        </Typography>

                        <Chip
                            label={company.currency}
                            size="small"
                            sx={{
                                mt: 0.8,
                                fontWeight: 600,
                                fontSize: "0.7rem",
                                bgcolor: theme.palette.mode === "light" ? "grey.100" : "grey.800"
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
                height: "100%",
                borderRadius: 3,
                borderStyle: "dashed",
                borderColor: theme.palette.primary.main,
                bgcolor: "transparent"
            }}
        >
            <CardActionArea
                onClick={handleAddCompany}
                sx={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    p: 3
                }}
            >
                <Avatar
                    sx={{
                        bgcolor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        width: 48,
                        height: 48,
                        mb: 1
                    }}
                >
                    <Add />
                </Avatar>
                <Typography variant="body2" color="primary.main" fontWeight={600}>
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
                            <Grid key={c.id} item xs={12} sm={6} md={4} lg={3} xl={2.4}>
                                <CompanyCard company={c} />
                            </Grid>
                        ))}

                        {canCreateMore && (
                            <Grid item xs={12} sm={6} md={4} lg={3} xl={2.4}>
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
