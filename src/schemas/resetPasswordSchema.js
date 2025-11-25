import * as yup from 'yup';
import { PASSWORD_REGEX } from '../utils/regex';

const resetPasswordSchema = (t) => yup.object().shape({
    newPassword: yup
        .string()
        .required(t('resetPassword:validation.passwordRequired'))
        .matches(
            PASSWORD_REGEX,
            t('resetPassword:validation.passwordFormat')
        ),
    confirmPassword: yup
        .string()
        .required(t('resetPassword:validation.confirmPasswordRequired'))
        .oneOf([yup.ref('newPassword'), null], t('resetPassword:validation.passwordsNotMatch'))
});

export default resetPasswordSchema;
