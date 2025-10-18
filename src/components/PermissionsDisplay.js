import React, {useMemo, useState, useCallback, useEffect} from 'react';
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
    IconButton,
    Tooltip,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import {usePermissions} from '../contexts/PermissionsContext';
import {useAuth} from '../contexts/AuthContext';
import {permissionsService} from '../services/permissionsService';
import EditUserPermissionsDialog from './EditUserPermissionsDialog';

// Kategori -> ikon eşleşmesi
const categoryIcon = (category) => {
    const key = (category || '').toLowerCase();
    if (key.includes('system') || key.includes('sistem')) {
        return <SecurityIcon fontSize="small" sx={{mr: 0.5}}/>;
    }
    if (key.includes('personal') || key.includes('personel')) {
        return <WorkspacesIcon fontSize="small" sx={{mr: 0.5}}/>;
    }
    if (key.includes('finanz') || key.includes('finans')) {
        return <AccountBalanceIcon fontSize="small" sx={{mr: 0.5}}/>;
    }
    return <InfoOutlinedIcon fontSize="small" sx={{mr: 0.5}}/>;
};

const PermissionsBadgePopover = ({userId, companyId, userPermissions, label = 'Yetkiler', onEditedUser}) => {
    const {permissions} = usePermissions();
    const {user, token} = useAuth(); // giriş yapan kullanıcı ve token
    const [anchorEl, setAnchorEl] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [canEdit, setCanEdit] = useState(false);

    useEffect(() => {
        if (!userId || !companyId || !user || !token) {
            setCanEdit(false);
            return;
        }

        const controller = new AbortController();

        const checkPermission = async () => {
            try {
                const ok = await permissionsService.checkUserRoles(
                    token,
                    user,
                    companyId,
                    ['personnel_manager']
                );
                if (!controller.signal.aborted) {
                    setCanEdit(!!ok);
                }
            } catch (e) {
                if (!controller.signal.aborted) {
                    setCanEdit(false);
                }
            }
        };

        checkPermission();

        return () => controller.abort();
    }, [userId, companyId, user, token]);


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

    const handleOpen = useCallback((e) => setAnchorEl(e.currentTarget), []);
    const handleClose = useCallback(() => setAnchorEl(null), []);
    const open = Boolean(anchorEl);

    const handleOpenEditDialog = useCallback(() => setEditDialogOpen(true), []);
    const handleCloseEditDialog = useCallback(() => setEditDialogOpen(false), []);

    const totalCount = userPermObjects.length;
    if (!totalCount) return null;

    return (
        <>
            <Badge badgeContent={totalCount} color="primary" max={99} overlap="rectangular">
                <Button
                    size="small"
                    onClick={handleOpen}
                    startIcon={<SecurityIcon fontSize="small"/>}
                    aria-label="Kullanıcı izinleri"
                    sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 1.25,
                        height: 32,
                        '&:hover': {backgroundColor: 'action.hover'},
                    }}
                    variant="text"
                >
                    <Typography variant="subtitle2" sx={{opacity: 0.9}}>
                        {label}
                    </Typography>
                </Button>
            </Badge>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                transformOrigin={{vertical: 'top', horizontal: 'right'}}
                PaperProps={{
                    elevation: 6,
                    sx: {width: 380, maxWidth: '92vw', borderRadius: 2, overflow: 'hidden'},
                }}
            >
                {/* Üst şerit: başlık solda, aksiyonlar sağda */}
                <Box
                    sx={{
                        px: 1.25,
                        py: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        bgcolor: 'background.paper',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                        borderBottom: 1,
                        borderColor: 'divider',
                    }}
                >
                    <Box>
                        <Typography variant="subtitle1" sx={{fontWeight: 700, lineHeight: 1.2}}>
                            Kullanıcı Yetkileri
                        </Typography>
                        <Typography variant="caption" sx={{opacity: 0.7}}>
                            Toplam {totalCount} izin
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={0.5} alignItems="center">
                        {canEdit && (
                            <Tooltip title="Kullanıcı izinlerini düzenle" arrow enterDelay={300}>
                                <IconButton
                                    size="small"
                                    onClick={handleOpenEditDialog}
                                    aria-label="Kullanıcı izinlerini dialog ile düzenle"
                                >
                                    <EditOutlinedIcon fontSize="small"/>
                                </IconButton>
                            </Tooltip>
                        )}

                        {/* Kapat (SAĞ ÜST) */}
                        <Tooltip title="Kapat" arrow enterDelay={300}>
                            <IconButton size="small" onClick={handleClose} aria-label="Kapat">
                                <CloseRoundedIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Box>

                {/* Kategori başlıkları */}
                <Box sx={{px: 1.5, py: 1}}>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        {Object.entries(groupedByCategory).map(([cat, items]) => (
                            <Chip key={cat} size="small" label={`${cat} • ${items.length}`} variant="outlined"/>
                        ))}
                    </Stack>
                </Box>

                <Divider/>

                {/* İçerik listesi */}
                <Box sx={{p: 1, pt: 0.5, maxHeight: 320, overflowY: 'auto'}}>
                    {Object.entries(groupedByCategory).map(([cat, items], idx, arr) => (
                        <Box key={cat} sx={{pb: idx < arr.length - 1 ? 1.25 : 0}}>
                            <Stack direction="row" alignItems="center" sx={{px: 0.5, py: 0.75}}>
                                {categoryIcon(cat)}
                                <Typography variant="subtitle2" sx={{fontWeight: 700}}>
                                    {cat}
                                </Typography>
                            </Stack>

                            <List dense disablePadding>
                                {items.map((p) => (
                                    <ListItem key={p.code} disableGutters sx={{px: 0.5}}>
                                        <ListItemText
                                            primary={<Typography variant="body2"
                                                                 sx={{fontWeight: 600}}>{p.name}</Typography>}
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

                            {idx < arr.length - 1 && <Divider sx={{mt: 1}}/>}
                        </Box>
                    ))}
                </Box>
            </Popover>

            <EditUserPermissionsDialog
                onEditedUser={onEditedUser}
                open={editDialogOpen}
                onClose={handleCloseEditDialog}
                userId={userId}
                companyId={companyId}
            />
        </>
    );
};

export default PermissionsBadgePopover;
