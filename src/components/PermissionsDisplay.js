// PermissionsBadgePopover.pro.jsx
import React, { useMemo, useState, useCallback } from 'react';
import {
    Badge,
    Button,
    Popover,
    Box,
    Typography,
    Divider,
    List,
    ListItem,
    ListItemText,
    Chip,
    Stack,
    Link as MuiLink,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { usePermissions } from '../contexts/PermissionsContext';

// Kategori -> ikon eşleşmesi
const categoryIcon = (category) => {
    const key = (category || '').toLowerCase();
    if (key.includes('system') || key.includes('sistem')) return <SecurityIcon fontSize="small" sx={{ mr: 0.5 }} />;
    if (key.includes('personal') || key.includes('personel')) return <WorkspacesIcon fontSize="small" sx={{ mr: 0.5 }} />;
    if (key.includes('finanz') || key.includes('finans')) return <AccountBalanceIcon fontSize="small" sx={{ mr: 0.5 }} />;
    return <InfoOutlinedIcon fontSize="small" sx={{ mr: 0.5 }} />;
};

const PermissionsBadgePopover = ({ userPermissions, label = 'Yetkiler' }) => {
    const { permissions } = usePermissions();
    const [anchorEl, setAnchorEl] = useState(null);

    const userPermObjects = useMemo(() => {
        if (!permissions || !userPermissions) return [];
        const codes = String(userPermissions).split('');
        return Object.values(permissions).filter((p) => codes.includes(p.code));
    }, [permissions, userPermissions]);

    const groupedByCategory = useMemo(() => {
        const groups = {};
        for (const p of userPermObjects) {
            const cat = p.category || 'Genel';
            (groups[cat] ||= []).push(p);
        }
        return groups;
    }, [userPermObjects]);

    // 👇 Hook'lar (KOŞULSUZ) — erken dönüşten önce
    const handleOpen = useCallback((e) => setAnchorEl(e.currentTarget), []);
    const handleClose = useCallback(() => setAnchorEl(null), []);
    const open = Boolean(anchorEl);

    const totalCount = userPermObjects.length;

    // ✔️ Artık hook’lardan SONRA erken dönüş yapıyoruz
    if (!totalCount) return null;

    return (
        <>
            <Badge badgeContent={totalCount} color="primary" max={99} overlap="rectangular">
                <Button
                    size="small"
                    onClick={handleOpen}
                    startIcon={<SecurityIcon fontSize="small" />}
                    aria-label="Kullanıcı izinleri"
                    sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 1.25,
                        height: 32,
                        '&:hover': { backgroundColor: 'action.hover' },
                    }}
                    variant="text"
                >
                    <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                        {label}
                    </Typography>
                </Button>
            </Badge>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                    elevation: 6,
                    sx: { width: 360, maxWidth: '90vw', borderRadius: 2 }
                }}
            >
                {/* Üst başlık / özet */}
                <Box sx={{ p: 1.5, pb: 0.75 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Kullanıcı Yetkileri
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        Toplam {totalCount} izin • Kısa özet
                    </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />

                {/* Kategori başlıkları (chip olarak hızlı bakış) */}
                <Box sx={{ px: 1.5, pb: 1 }}>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        {Object.entries(groupedByCategory).map(([cat, items]) => (
                            <Chip key={cat} size="small" label={`${cat} • ${items.length}`} variant="outlined" />
                        ))}
                    </Stack>
                </Box>

                <Divider />

                {/* İçerik listesi */}
                <Box sx={{ p: 1, pt: 0.5, maxHeight: 320, overflowY: 'auto' }}>
                    {Object.entries(groupedByCategory).map(([cat, items], idx, arr) => (
                        <Box key={cat} sx={{ pb: idx < arr.length - 1 ? 1.25 : 0 }}>
                            <Stack direction="row" alignItems="center" sx={{ px: 0.5, py: 0.75 }}>
                                {categoryIcon(cat)}
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    {cat}
                                </Typography>
                            </Stack>

                            <List dense disablePadding>
                                {items.map((p) => (
                                    <ListItem key={p.code} disableGutters sx={{ px: 0.5 }}>
                                        <ListItemText
                                            primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{p.name}</Typography>}
                                            secondary={
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        opacity: 0.85,
                                                    }}
                                                >
                                                    {p.description}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>

                            {idx < arr.length - 1 && <Divider sx={{ mt: 1 }} />}
                        </Box>
                    ))}
                </Box>

                {/* Alt aksiyon satırı */}
                <Box sx={{ px: 1.5, py: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <MuiLink
                        component="button"
                        type="button"
                        onClick={handleClose}
                        underline="hover"
                        variant="caption"
                        sx={{ opacity: 0.9 }}
                    >
                        Kapat
                    </MuiLink>
                </Box>
            </Popover>
        </>
    );
};

export default PermissionsBadgePopover;
