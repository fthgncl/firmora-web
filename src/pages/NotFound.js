import React from 'react';

function NotFound() {
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
            <h1 style={{ fontSize: '4rem', color: '#e74c3c', marginBottom: '20px' }}>404</h1>
            <h2 style={{ color: '#2c3e50', marginBottom: '15px' }}>Sayfa Bulunamadı</h2>
            <p style={{ color: '#7f8c8d', marginBottom: '30px', maxWidth: '500px' }}>
                Aradığınız sayfa mevcut değil veya taşınmış olabilir.
            </p>
            <a 
                href="/" 
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
                Ana Sayfaya Dön
            </a>
        </div>
    );
}

export default NotFound;
