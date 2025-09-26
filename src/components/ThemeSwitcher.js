import {useState, useContext} from 'react';
import Box from '@mui/material/Box';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Switch from '@mui/material/Switch';
import {useTheme} from '@mui/material/styles';
import ThemeContext from '../contexts/ThemeContext';

export default function ThemeSwitcher() {

    const {changeTheme} = useContext(ThemeContext);
    const darkMode = useTheme().palette.mode === 'dark';
    const [isSwitchOn, setIsSwitchOn] = useState(darkMode);

    const handleClick = () => {
        changeTheme(isSwitchOn ? 'light' : 'dark');
        setIsSwitchOn(!isSwitchOn);
    }


    return (
        <Box
            sx={{display: {xs: 'none', sm: 'flex'},alignItems:'center'}}
        >
            <Brightness7Icon/>
            <Switch checked={isSwitchOn} onClick={handleClick}/>
            <Brightness4Icon/>
        </Box>
    );
}