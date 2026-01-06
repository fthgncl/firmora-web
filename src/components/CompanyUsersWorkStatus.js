import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export default function CompanyUsersWorkStatus({ companyId }) {
    const { token } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Date filters
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 1); // 1 month ago
        return date.toISOString().split('T')[0];
    });

    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });

    useEffect(() => {
        console.log(employees);
    }, [employees]);

    const fetchCompanyUsersWorkStatus = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/work-status/company-users-work-status`,
                {
                    companyId: companyId,
                    startDate: startDate,
                    endDate: endDate
                },
                {
                    headers: {
                        'x-access-token': token,
                    },
                }
            );

            setEmployees(response.data.employees || []);
        } catch (err) {
            console.error('Company users work status fetch error:', err);
            setError(err?.response?.data?.message || err.message || 'Beklenmeyen bir hata oluştu');
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line
    }, [startDate, endDate]);

    useEffect(() => {
        if (token && companyId) {
            fetchCompanyUsersWorkStatus();
        }
        // eslint-disable-next-line
    }, []);

    return null;
}