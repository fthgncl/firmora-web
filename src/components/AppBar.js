import * as React from 'react';
import {
    AppBar,
    Box,
    Toolbar,
    Typography,
    IconButton,
    Stack,
    MenuItem,
    Menu,
    Avatar,
    Divider,
    ListItemIcon,
    Tooltip,
    Slide,
    useScrollTrigger
} from '@mui/material';
import {
    Logout,
    Settings,
    Person,
    Menu as MenuIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppBar } from '../contexts/AppBarContext';
import ThemeSwitcher from './ThemeSwitcher';
import LanguageSelector from './LanguageSelector';

function HideOnScroll({ children }) {
    const trigger = useScrollTrigger();

    return (
        <Slide appear={false} direction="down" in={!trigger}>
            {children}
        </Slide>
    );
}

export default function MenuAppBar() {
    const {appBarOpen} = useAppBar();
    const { user, logout } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { toggleDrawer, drawerOpen } = useAppBar();
    const [anchorEl, setAnchorEl] = React.useState(null);

    if (!appBarOpen) return null;

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleProfile = () => {
        navigate('/profile');
        handleClose();
    };

    const handleSettings = () => {
        navigate('/settings');
        handleClose();
    };

    const handleLogout = () => {
        logout();
        handleClose();
    };

    const getUserInitials = () => {
        if (!user?.username) return '?';
        return user.username.charAt(0).toUpperCase();
    };

    return (
        <>
            <HideOnScroll>
                <AppBar
                    position="fixed"
                    sx={{
                        zIndex: (theme) => theme.zIndex.drawer + 1,
                    }}
                >
                    <Toolbar sx={{ gap: 1, minHeight: { xs: 56, sm: 64 } }}>
                    {/* Menu Toggle Button - Desktop */}
                    {user && (
                        <Tooltip title={drawerOpen ? t('appbar:menuClose') : t('appbar:menuOpen')}>
                        <IconButton
                                color="inherit"
                                aria-label="toggle drawer"
                                onClick={toggleDrawer}
                                edge="start"
                                sx={{
                                    mr: 1,
                                    display: { xs: 'none', md: 'flex' },
                                }}
                            >
                                <MenuIcon />
                            </IconButton>
                        </Tooltip>
                    )}

                    {/* App Title */}
                    <Typography
                        variant="h6"
                        component="div"
                        onClick={() => navigate('/')}
                        sx={{
                            fontSize: { xs: '1.1rem', sm: '1.25rem' },
                            fontWeight: 600,
                            letterSpacing: '0.5px',
                            cursor: 'pointer',
                            '&:hover': {
                                opacity: 0.8,
                            }
                        }}
                    >
                        {process.env.REACT_APP_NAME}
                    </Typography>

                    {/* Right Side Actions */}
                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ ml: 'auto' }}
                    >
                        <ThemeSwitcher />
                        <LanguageSelector />

                        {user && (
                            <>
                                {/* User Menu Button */}
                                <Tooltip title={t('appbar:account')}>
                                    <IconButton
                                        size="large"
                                        aria-label="kullanıcı menüsü"
                                        aria-controls="user-menu"
                                        aria-haspopup="true"
                                        onClick={handleMenu}
                                        sx={{
                                            ml: 1,
                                            p: 0.5,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                px: 1,
                                                py: 0.5,
                                                borderRadius: 2,
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                transition: 'all 0.2s',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                                }
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    display: { xs: 'none', sm: 'block' },
                                                    fontWeight: 600,
                                                    color: 'white',
                                                }}
                                            >
                                                {user.username}
                                            </Typography>
                                            <Avatar
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    bgcolor: 'white',
                                                    color: 'primary.main',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {getUserInitials()}
                                            </Avatar>
                                        </Box>
                                    </IconButton>
                                </Tooltip>

                                {/* User Menu */}
                                <Menu
                                    id="user-menu"
                                    anchorEl={anchorEl}
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'right',
                                    }}
                                    keepMounted
                                    transformOrigin={{
                                        vertical: 'top',
                                        horizontal: 'right',
                                    }}
                                    open={Boolean(anchorEl)}
                                    onClose={handleClose}
                                    sx={{
                                        mt: 1.5,
                                        '& .MuiMenu-paper': {
                                            minWidth: 200,
                                            borderRadius: 2,
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                        }
                                    }}
                                >
                                    {/* User Info Header */}
                                    <Box sx={{ px: 2, py: 1.5 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                            {user.username}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {user.email || 'Kullanıcı'}
                                        </Typography>
                                    </Box>

                                    <Divider />

                                    {/* Menu Items */}
                                    <MenuItem onClick={handleProfile} sx={{ py: 1.5 }}>
                                        <ListItemIcon>
                                            <Person fontSize="small" />
                                        </ListItemIcon>
                                        <Typography variant="body2">
                                            {t('appbar:profile')}
                                        </Typography>
                                    </MenuItem>

                                    <MenuItem onClick={handleSettings} sx={{ py: 1.5 }}>
                                        <ListItemIcon>
                                            <Settings fontSize="small" />
                                        </ListItemIcon>
                                        <Typography variant="body2">
                                            {t('appbar:settings')}
                                        </Typography>
                                    </MenuItem>

                                    <Divider />

                                    <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
                                        <ListItemIcon>
                                            <Logout fontSize="small" color="error" />
                                        </ListItemIcon>
                                        <Typography variant="body2">
                                            {t('auth:logout')}
                                        </Typography>
                                    </MenuItem>
                                </Menu>
                            </>
                        )}
                    </Stack>
                </Toolbar>
            </AppBar>
        </HideOnScroll>
        <Toolbar />
        </>
    );
}
