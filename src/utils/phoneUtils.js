/**
 * Telefon numarasını tel: protokolü için formatlı hale getirir
 * @param {string|number} val - Telefon numarası
 * @returns {string|null} Formatlanmış telefon numarası veya null
 */
export const formatPhoneForTel = (val) => {
    if (!val) return null;
    let s = String(val).trim();
    if (s.startsWith('00')) s = '+' + s.slice(2);
    s = s.replace(/[^\d+]/g, '');
    if (!s.startsWith('+')) s = '+' + s;
    if (s.replace(/\D/g, '').length < 8) return null;
    return s;
};
