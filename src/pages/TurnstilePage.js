import React, { useEffect } from 'react';

const TurnstilePage = () => {
    useEffect(() => {
        const turnstileToken = sessionStorage.getItem('turnstile_token');
        console.log('Turnstile Token:', turnstileToken);
    }, []);

    return (
        <div>
            <h1>Turnstile Page</h1>
        </div>
    );
};

export default TurnstilePage;
