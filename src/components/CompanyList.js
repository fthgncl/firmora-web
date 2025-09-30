import React, { useState } from 'react';
import { Container, Box, Typography, Paper, IconButton } from '@mui/material';
import { Business, Add } from '@mui/icons-material';

const companyCardStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '160px',
    height: '130px',
    margin: '10px',
    padding: '12px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: '#fff',
    '&:hover': {
        backgroundColor: '#f8f9fa',
        boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
        transform: 'translateY(-2px)',
    },
    '@media (max-width:768px)': {
        width: '140px',
        height: '110px',
        margin: '8px',
    },
    '@media (max-width:480px)': {
        width: '120px',
        height: '100px',
        margin: '6px',
    },
};


const containerStyle = {
    border: '1px solid #e0e0e0',
    borderRadius: '16px',
    padding: '24px',
    backgroundColor: '#fafafa',
    marginTop: '32px',
    '@media (max-width:768px)': {
        padding: '16px',
        marginTop: '24px',
    },
};

export default function CompanyList() {
    const [companies] = useState([
        { id: 1, name: 'ABC Teknoloji A.Ş.', description: 'Yazılım ve Danışmanlık' },
        { id: 2, name: 'XYZ Ticaret Ltd.', description: 'İthalat ve İhracat' },
        { id: 3, name: 'DEF İnşaat A.Ş.', description: 'Yapı ve İnşaat Hizmetleri' }
    ]);

    const handleCompanyClick = (company) => {
        console.log('Firma seçildi:', company);
        // Buraya firma detayına yönlendirme kodu eklenebilir
    };

    const handleAddCompany = () => {
        console.log('Yeni firma oluştur');
        // Buraya yeni firma oluşturma modalı veya sayfası açma kodu eklenebilir
    };

    return (
        <Container maxWidth="lg">
            <Paper sx={containerStyle}>
                <Typography 
                    variant="h5" 
                    component="h2" 
                    sx={{ 
                        textAlign: 'center', 
                        mb: 3, 
                        color: '#333',
                        fontWeight: 600 
                    }}
                >
                    Firmalarım
                </Typography>

                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        alignItems: 'flex-start'
                    }}
                >
                    {companies.map((company) => (
                        <Paper
                            key={company.id}
                            sx={companyCardStyle}
                            onClick={() => handleCompanyClick(company)}
                            elevation={2}
                        >
                            <Business 
                                sx={{ 
                                    fontSize: '36px', 
                                    color: '#1976d2', 
                                    mb: 0.5 
                                }} 
                            />
                            <Typography 
                                variant="h6" 
                                sx={{ 
                                    fontWeight: 600,
                                    color: '#333',
                                    mb: 0.3,
                                    fontSize: '0.85rem',
                                    lineHeight: 1.2,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    width: '100%'
                                }}
                            >
                                {company.name}
                            </Typography>
                            <Typography 
                                variant="body2" 
                                sx={{ 
                                    color: '#666',
                                    fontSize: '0.7rem',
                                    lineHeight: 1.1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    width: '100%'
                                }}
                            >
                                {company.description}
                            </Typography>
                        </Paper>
                    ))}

                    <Box
                        sx={{
                            ...companyCardStyle,
                            border: '2px dashed #1976d2',
                            backgroundColor: 'transparent',
                            boxShadow: 'none',
                            '&:hover': {
                                backgroundColor: 'rgba(25, 118, 210, 0.04)',
                                borderColor: '#1565c0',
                                boxShadow: 'none',
                                transform: 'translateY(-2px)',
                            }
                        }}
                        onClick={handleAddCompany}
                    >
                        <IconButton
                            sx={{
                                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                                color: '#1976d2',
                                width: '40px',
                                height: '40px',
                                mb: 0.5,
                                '&:hover': {
                                    backgroundColor: 'rgba(25, 118, 210, 0.2)',
                                }
                            }}
                        >
                            <Add sx={{ fontSize: '24px' }} />
                        </IconButton>
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                color: '#1976d2',
                                fontWeight: 500,
                                fontSize: '0.75rem',
                                lineHeight: 1.2,
                                textAlign: 'center'
                            }}
                        >
                            Yeni Firma Oluştur
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}
