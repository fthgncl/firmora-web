// Email regex desenleri
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Şifre regex deseni
export const PASSWORD_REGEX = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*.]).{8,20}$/;

// Metin regex deseni
export const TEXT_ONLY_REGEX = /^[a-zA-ZığüşöçİĞÜŞÖÇ\s]+$/;

// Özel karakterler regex deseni
export const SPECIAL_CHARS_REGEX = /^[^'";=<>!&%$#^/\\]+$/;

// Kullanıcı adı regex deseni
export const USERNAME_REGEX = /^[a-zA-ZığüşöçİĞÜŞÖÇ][a-zA-ZığüşöçİĞÜŞÖÇ0-9]{5,14}$/;

// Yardımcı fonksiyonlar
export const isValidEmail = (email) => {
    if (!email) return false;
    return EMAIL_REGEX.test(email);
};

export const hasMaxNumberCount = (value, maxCount) => {
    if (!value) return true;
    const numbers = value.match(/\d/g);
    return !numbers || numbers.length <= maxCount;
};

export const isValidUsername = (username) => {
    if (!username) return false;

    // En fazla 4 rakam kontrolü
    const digitCount = (username.match(/\d/g) || []).length;
    if (digitCount > 4) return false;

    // Regex kontrolü (harfle başlar, sadece harf ve rakam içerir)
    return USERNAME_REGEX.test(username);
};
