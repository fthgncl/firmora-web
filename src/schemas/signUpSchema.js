import * as yup from 'yup';
import {TEXT_ONLY_REGEX, USERNAME_REGEX, PASSWORD_REGEX, isValidEmail, hasMaxNumberCount} from '../utils/regex';

const signUpSchema = yup.object().shape({
    name: yup
        .string()
        .required('Ad boş bırakılamaz.')
        .min(3, 'Ad en az 3 karakter uzunluğunda olmalıdır.')
        .max(20, 'Ad en fazla 20 karakter uzunluğunda olmalıdır.')
        .matches(TEXT_ONLY_REGEX, 'Ad sadece harflerden oluşmalıdır.'),

    surname: yup
        .string()
        .required('Soyad boş bırakılamaz.')
        .min(3, 'Soyad en az 3 karakter uzunluğunda olmalıdır.')
        .max(20, 'Soyad en fazla 20 karakter uzunluğunda olmalıdır.')
        .matches(TEXT_ONLY_REGEX, 'Soyad sadece harflerden oluşmalıdır.'),

    username: yup
        .string()
        .required('Kullanıcı adı boş bırakılamaz.')
        .min(6, 'Kullanıcı adı en az 6 karakter uzunluğunda olmalıdır.')
        .max(15, 'Kullanıcı adı en fazla 15 karakter uzunluğunda olmalıdır.')
        .matches(USERNAME_REGEX, 'Kullanıcı adı yalnızca harf, rakam ve alt çizgi içerebilir.')
        .test('max-numbers', 'Kullanıcı adı en fazla 4 rakam içerebilir.', (value) => {
            return hasMaxNumberCount(value, 4);
        }),
    // NOT: USERNAME_REGEX zaten özel karakter kontrolünü içeriyor,

    email: yup
        .string()
        .required('E-posta boş bırakılamaz.')
        .test('valid-email', 'Geçerli bir e-posta adresi girilmelidir.', (value) => {
            return isValidEmail(value);
        }),

    password: yup
        .string()
        .required('Şifre boş bırakılamaz.')
        .min(8, 'Şifre en az 8 karakter uzunluğunda olmalıdır.')
        .max(20, 'Şifre en fazla 20 karakter uzunluğunda olmalıdır.')
        .matches(PASSWORD_REGEX, 'Şifre büyük harf, küçük harf, rakam ve özel karakter içermelidir.'),

    confirmpassword: yup
        .string()
        .required('Şifre doğrulaması boş bırakılamaz.')
        .oneOf([yup.ref('password'), null], 'Şifreler eşleşmiyor.')
});

export default signUpSchema;
