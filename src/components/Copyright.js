import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

export default function Copyright() {
    const { t } = useTranslation();

    return (
        <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mt: 4, mb: 2 }}
        >
            © {new Date().getFullYear()} {process.env.REACT_APP_NAME}. {t('common.allRightsReserved')}
        </Typography>
    );
}
