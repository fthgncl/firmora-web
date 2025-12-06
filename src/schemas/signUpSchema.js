import * as yup from 'yup';
import {TEXT_ONLY_REGEX, USERNAME_REGEX, PASSWORD_REGEX, isValidEmail, hasMaxNumberCount} from '../utils/regex';

const signUpSchema = (t) => yup.object().shape({
    name: yup
        .string()
        .required(t('signup:validation.nameRequired'))
        .min(3, t('signup:validation.nameMin'))
        .max(20, t('signup:validation.nameMax'))
        .matches(TEXT_ONLY_REGEX, t('signup:validation.nameLettersOnly')),

    surname: yup
        .string()
        .required(t('signup:validation.surnameRequired'))
        .min(3, t('signup:validation.surnameMin'))
        .max(20, t('signup:validation.surnameMax'))
        .matches(TEXT_ONLY_REGEX, t('signup:validation.surnameLettersOnly')),

    username: yup
        .string()
        .required(t('signup:validation.usernameRequired'))
        .min(6, t('signup:validation.usernameMin'))
        .max(15, t('signup:validation.usernameMax'))
        .matches(USERNAME_REGEX, t('signup:validation.usernameFormat'))
        .test('max-numbers', t('signup:validation.usernameMaxNumbers'), (value) => {
            return hasMaxNumberCount(value, 4);
        }),
    // NOT: USERNAME_REGEX zaten özel karakter kontrolünü içeriyor,

    email: yup
        .string()
        .required(t('signup:validation.emailRequired'))
        .test('valid-email', t('signup:validation.emailInvalid'), (value) => {
            return isValidEmail(value);
        }),

    password: yup
        .string()
        .required(t('signup:validation.passwordRequired'))
        .min(8, t('signup:validation.passwordMin'))
        .max(20, t('signup:validation.passwordMax'))
        .matches(PASSWORD_REGEX, t('signup:validation.passwordFormat')),

    confirmpassword: yup
        .string()
        .required(t('signup:validation.confirmPasswordRequired'))
        .oneOf([yup.ref('password'), null], t('signup:validation.passwordMismatch'))
});

export default signUpSchema;
