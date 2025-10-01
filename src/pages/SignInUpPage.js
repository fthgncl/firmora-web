import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import AppBar from '../components/AppBar';
import { styled } from '@mui/material/styles';
import { useFormik } from "formik";
import axios from "axios";
import {useEffect, useState} from "react";
import SignUpSchema from "../schemas/signUpSchema";
import { useNavigate } from "react-router-dom";
import Link from '@mui/material/Link';

const Card = styled(MuiCard)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'center',
    width: '100%',
    padding: theme.spacing(4),
    gap: theme.spacing(2),
    margin: 'auto',
    boxShadow:
        'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
    [theme.breakpoints.up('sm')]: {
        width: '450px',
    },
    ...theme.applyStyles('dark', {
        boxShadow:
            'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
    }),
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
    height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
    minHeight: '100%',
    padding: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
        padding: theme.spacing(4),
    }
}));

export default function SignUp() {
    const [apiErrors, setApiErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();


    const onSubmit = async (values, actions) => {
        setIsLoading(true);
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/sign-up`, values);
            if (response.data.status === 'success') {


            }
            actions.resetForm();
        } catch (error) {
            if (error.response && error.response.data.errors) {
                setApiErrors(error.response.data.errors);
            } else {
                console.error('İstemci hatası:', error.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const { values , errors, handleSubmit, handleChange, setErrors, touched, handleBlur, validateForm } = useFormik({
        initialValues: {
            name: '',
            surname: '',
            username: '',
            email: '',
            password: '',
            confirmpassword: ''
        },
        onSubmit,
        validationSchema: SignUpSchema
    });

    useEffect(() => {
        setErrors(apiErrors);
        // eslint-disable-next-line
    }, [apiErrors]);

    return (
        <>
            <AppBar/>
            <SignUpContainer sx={{ mt: 11, mb: 5, height: '100%' }} direction="column" justifyContent="space-between">
                <Card variant="outlined">
                    <Typography
                        component="h1"
                        variant="h4"
                        sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
                    >
                        Kayıt Ol
                    </Typography>
                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                    >
                        <FormControl>
                            <FormLabel htmlFor="name">Ad</FormLabel>
                            <TextField
                                autoComplete="name"
                                name="name"
                                required
                                fullWidth
                                id="name"
                                value={values.name}
                                onBlur={handleBlur}
                                onChange={handleChange}
                                error={!!errors.name}
                                helperText={touched.name && errors.name}
                                disabled={isLoading}
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel htmlFor="name">Soyad</FormLabel>
                            <TextField
                                autoComplete="surname"
                                name="surname"
                                required
                                fullWidth
                                id="surname"
                                value={values.surname}
                                onBlur={handleBlur}
                                onChange={handleChange}
                                error={!!errors.surname}
                                helperText={touched.surname && errors.surname}
                                disabled={isLoading}
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel htmlFor="name">Kullanıcı Adı</FormLabel>
                            <TextField
                                autoComplete="username"
                                name="username"
                                required
                                fullWidth
                                id="username"
                                value={values.username}
                                onBlur={handleBlur}
                                onChange={handleChange}
                                error={!!errors.username}
                                helperText={touched.username && errors.username}
                                disabled={isLoading}
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel htmlFor="email">E-posta</FormLabel>
                            <TextField
                                required
                                fullWidth
                                id="email"
                                placeholder="adres@email.com"
                                value={values.email}
                                name="email"
                                autoComplete="email"
                                variant="outlined"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                error={!!errors.email}
                                helperText={touched.email && errors.email}
                                disabled={isLoading}
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel htmlFor="password">Şifre</FormLabel>
                            <TextField
                                required
                                fullWidth
                                name="password"
                                placeholder="••••••"
                                value={values.password}
                                type="password"
                                id="password"
                                autoComplete="new-password"
                                variant="outlined"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                error={!!errors.password}
                                helperText={touched.password && errors.password}
                                disabled={isLoading}
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel htmlFor="confirmpassword">Şifre Tekrarı</FormLabel>
                            <TextField
                                required
                                fullWidth
                                name="confirmpassword"
                                placeholder="••••••"
                                value={values.confirmpassword}
                                type="password"
                                id="confirmpassword"
                                autoComplete="new-password"
                                variant="outlined"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                error={!!errors.confirmpassword}
                                helperText={touched.confirmpassword && errors.confirmpassword}
                                disabled={isLoading}
                            />
                        </FormControl>
                        <Button
                            type="submit"
                            fullWidth
                            variant={isLoading ? "outlined" : "contained"}
                            onClick={validateForm}
                            disabled={isLoading}
                            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                            {isLoading ? 'Kayıt Yapılıyor...' : 'Kaydol'}
                        </Button>
                        <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
                            Hesabınız var mı?{' '}
                            <Link
                                component="button"
                                variant="body2"
                                onClick={() => navigate('/sign-in')}
                                sx={{ cursor: 'pointer' }}
                            >
                                Giriş yapın
                            </Link>
                        </Typography>
                    </Box>
                </Card>
            </SignUpContainer>
        </>
    );
}