import React from 'react';
import { useTranslation } from 'react-i18next';

function Unauthorized() {
    const { t } = useTranslation(['unauthorized']);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            textAlign: 'center',
            padding: '20px'
        }}>
            <h1 style={{ fontSize: '4rem', color: '#f39c12', marginBottom: '20px' }}>403</h1>
            <h2 style={{ color: '#2c3e50', marginBottom: '15px' }}>
                {t('unauthorized:title')}
            </h2>
            <p style={{ color: '#7f8c8d', marginBottom: '30px', maxWidth: '500px' }}>
                {t('unauthorized:description')}
            </p>
            <a
                href="/"
                aria-label={t('unauthorized:backHome')}
                style={{
                    backgroundColor: '#3498db',
                    color: 'white',
                    padding: '12px 24px',
                    textDecoration: 'none',
                    borderRadius: '5px',
                    fontSize: '16px',
                    transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
            >
                {t('unauthorized:backHome')}
            </a>
        </div>
    );
}

export default Unauthorized;
