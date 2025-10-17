import axios from 'axios';
import i18n from './i18n';

// Environment variable'lardan cache ayarlarını al
const CACHE_KEY = process.env.REACT_APP_PERMISSIONS_CACHE_KEY || 'firmora-permissions-cache';
const CACHE_DURATION = parseInt(process.env.REACT_APP_PERMISSIONS_CACHE_DURATION || '86400000', 10); // Varsayılan: 1 gün (milisaniye cinsinden)

/**
 * Cache'teki yetki verilerini kontrol eder
 * @returns {Object|null} Cache'teki veriler veya null
 */
const getCachedPermissions = () => {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) {
            return null;
        }

        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();

        // Cache süresi dolmuş mu kontrol et
        if (now - timestamp > CACHE_DURATION) {
            localStorage.removeItem(CACHE_KEY);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Cache okuma hatası:', error);
        localStorage.removeItem(CACHE_KEY);
        return null;
    }
};

/**
 * Yetki verilerini cache'e kaydeder
 * @param {Object} data - Kaydedilecek yetki verileri
 */
const setCachedPermissions = (data) => {
    try {
        const cacheData = {
            data,
            timestamp: Date.now(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
        console.error('Cache kaydetme hatası:', error);
    }
};

/**
 * Cache'i temizler
 */
const clearPermissionsCache = () => {
    try {
        localStorage.removeItem(CACHE_KEY);
    } catch (error) {
        console.error('Cache temizleme hatası:', error);
    }
};

/**
 * Yetki yapılandırmasını getirir (önce cache'ten, yoksa API'den)
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Yetki yapılandırması
 */
const getPermissions = async (token) => {

    // Önce cache'e bak
    const cached = getCachedPermissions();

    if (cached && cached.lang && cached.lang === i18n.language) {
        return cached;
    }


    // Cache yoksa API'den çek
    try {
        const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/permissions`,
            {
                headers: {
                    'x-access-token': token,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (response.data.status === "success") {
            const permissions = response.data.permissions;
            setCachedPermissions(permissions);
            return permissions;
        } else {
            throw new Error(response.data.message || 'Yetki yapılandırması alınamadı');
        }
    } catch (error) {
        console.error('Yetki yapılandırması alma hatası:', error);
        throw error;
    }
};

/**
 * Belirli bir yetki kodunun bilgilerini getirir
 * @param {string} token - JWT token
 * @param {string} permissionKey - Yetki anahtarı (örn: 'sys_admin')
 * @returns {Promise<Object|null>} Yetki bilgisi veya null
 */
const getPermissionByKey = async (token, permissionKey) => {
    try {
        const permissions = await getPermissions(token);
        return permissions[permissionKey] || null;
    } catch (error) {
        console.error('Yetki bilgisi alma hatası:', error);
        return null;
    }
};

/**
 * Yetki kodundan yetki anahtarını bulur
 * @param {string} token - JWT token
 * @param {string} code - Yetki kodu (örn: 'a')
 * @returns {Promise<string|null>} Yetki anahtarı veya null
 */
const getPermissionKeyByCode = async (token, code) => {
    try {
        const permissions = await getPermissions(token);
        const entry = Object.entries(permissions).find(([_, value]) => value.code === code);
        return entry ? entry[0] : null;
    } catch (error) {
        console.error('Yetki kodu dönüştürme hatası:', error);
        return null;
    }
};

/**
 * Kullanıcının yetki string'ini yetki listesine çevirir
 * @param {string} token - JWT token
 * @param {string} permissionString - Yetki kodları string'i (örn: 'abc')
 * @returns {Promise<Array>} Yetki anahtarları dizisi
 */
const decodePermissionString = async (token, permissionString) => {
    if (!permissionString) return [];

    try {
        const permissions = await getPermissions(token);
        const codes = permissionString.split('');
        const permissionKeys = [];

        for (const code of codes) {
            const entry = Object.entries(permissions).find(([_, value]) => value.code === code);
            if (entry) {
                permissionKeys.push(entry[0]);
            }
        }

        return permissionKeys;
    } catch (error) {
        console.error('Yetki string çözümleme hatası:', error);
        return [];
    }
};

/**
 * Yetki anahtarlarını yetki string'ine çevirir
 * @param {string} token - JWT token
 * @param {Array<string>} permissionKeys - Yetki anahtarları dizisi
 * @returns {Promise<string>} Yetki kodları string'i
 */
const encodePermissionKeys = async (token, permissionKeys) => {
    if (!Array.isArray(permissionKeys) || permissionKeys.length === 0) return '';

    try {
        const permissions = await getPermissions(token);
        return permissionKeys
            .map(key => permissions[key]?.code)
            .filter(Boolean)
            .join('');

    } catch (error) {
        console.error('Yetki kodlama hatası:', error);
        return '';
    }
};

/**
 * Kullanıcının belirli bir firmadaki yetkilerini kontrol eder
 * @param {string} token - JWT token
 * @param {Object} user - Kullanıcı objesi (useAuth'dan gelen)
 * @param {string} companyId - Firma ID'si
 * @param {Array<string>} roles - Kontrol edilecek yetki anahtarları (örn: ['sys_admin', 'can_record_expense'])
 * @param {boolean} fullMatch - true: tüm yetkiler eşleşmeli, false: en az biri eşleşmeli
 * @returns {Promise<boolean>} Yetki kontrolü sonucu
 */
const checkUserRoles = async (token, user, companyId, roles = ['sys_admin'], fullMatch = false) => {
    try {
        // Kullanıcı veya permissions kontrolü
        if (!user || !user.permissions || !Array.isArray(user.permissions)) {
            console.warn('Kullanıcı veya yetki bilgisi bulunamadı');
            return false;
        }

        // Belirtilen firma için kullanıcının yetkilerini bul
        const companyPermission = user.permissions.find(p => p.companyId === companyId);

        if (!companyPermission || !companyPermission.permissions) {
            console.warn(`Kullanıcının ${companyId} firmasında yetkisi bulunamadı`);
            return false;
        }

        // Kullanıcının yetki kodlarını al (string -> array)
        const userPermissionCodes = companyPermission.permissions.split('');

        // Sys_admin kontrolü - 'a' kodu varsa tam erişim
        if (userPermissionCodes.includes('a')) {
            return true;
        }

        // Yetki yapılandırmasını al
        const permissions = await getPermissions(token);

        // İstenen yetkilerin kodlarını bul
        const requiredCodes = roles
            .map(role => permissions[role]?.code)
            .filter(Boolean);

        if (requiredCodes.length === 0) {
            console.warn('Geçerli yetki kodu bulunamadı');
            return false;
        }

        // fullMatch parametresine göre kontrol et
        if (fullMatch) {
            // Tüm yetkiler kullanıcıda bulunmalı
            return requiredCodes.every(code => userPermissionCodes.includes(code));
        } else {
            // En az bir yetki kullanıcıda bulunmalı
            return requiredCodes.some(code => userPermissionCodes.includes(code));
        }

    } catch (error) {
        console.error('Yetki kontrolü hatası:', error);
        return false;
    }
};


export const permissionsService ={
    getPermissions,
    getPermissionByKey,
    getPermissionKeyByCode,
    decodePermissionString,
    encodePermissionKeys,
    clearPermissionsCache,
    checkUserRoles,
};