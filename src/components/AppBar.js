import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import ThemeSwitcher from './ThemeSwitcher';
import LanguageSelector from "./LanguageSelector";

export default function MenuAppBar() {
    const { user, logout } = useAuth();
    const { t } = useTranslation();
    const [anchorEl, setAnchorEl] = React.useState(null);


    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
        handleClose();
    };

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar sx={{ gap: 1 }}>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{
                            flexGrow: 1,
                            fontSize: { xs: '1.1rem', sm: '1.25rem' }
                        }}
                    >
                        {process.env.REACT_APP_NAME}
                    </Typography>

                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ display: 'flex' }}
                    >
                        <ThemeSwitcher />
                        <LanguageSelector />

                        {user && (
                            <Box sx={{ ml: 1 }}>
                                <IconButton
                                    size="large"
                                    aria-label="account of current user"
                                    aria-controls="menu-appbar"
                                    aria-haspopup="true"
                                    onClick={handleMenu}
                                    color="inherit"
                                    sx={{
                                        borderRadius: 2,
                                        px: { xs: 1, sm: 2 },
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                        }
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        component="span"
                                        sx={{
                                            mr: 1,
                                            display: { xs: 'none', sm: 'block' },
                                            fontWeight: 500
                                        }}
                                    >
                                        {user.username}
                                    </Typography>
                                    <AccountCircle />
                                </IconButton>

                                <Menu
                                    id="menu-appbar"
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
                                        mt: 1,
                                        '& .MuiMenu-paper': {
                                            minWidth: 120
                                        }
                                    }}
                                >
                                    <MenuItem
                                        onClick={handleLogout}
                                        sx={{ px: 2, py: 1 }}
                                    >
                                        {t('auth.logout')}
                                    </MenuItem>
                                </Menu>
                            </Box>
                        )}
                    </Stack>
                </Toolbar>
            </AppBar>
        </Box>
    );
}
