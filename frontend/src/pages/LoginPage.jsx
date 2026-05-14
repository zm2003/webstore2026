import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { getApiUrl } from '../utils/api.js';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState('');

    const handleSuccess = (credentialResponse) => {
        fetch(getApiUrl('/api/auth/google-login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: credentialResponse.credential })
        })
            .then(res => {
                if (!res.ok) throw new Error('Login failed on server');
                return res.json();
            })
            .then(data => {
                const token = data.token;
                
                // Decode JWT to get role
                // In flask-jwt-extended v4+, identity (sub) is a string user_id.
                // role and email are stored as additional_claims at the top level.
                const payloadJSON = atob(token.split('.')[1]);
                const payload = JSON.parse(payloadJSON);
                const role = payload.role;  // top-level claim, not payload.sub.role
                
                // Update global auth state
                login(token, role);

                // Redirect based on role
                if (role === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/shop');
                }
            })
            .catch(err => {
                setError(err.message);
            });
    };

    const handleFailure = () => {
        setError('Google Sign-In was unsuccessful. Try again.');
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>Welcome Back</h1>
                <p style={styles.subtitle}>Sign in to access your account</p>

                {error && <div style={styles.errorBox}>{error}</div>}

                <div style={styles.loginWrapper}>
                    <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={handleFailure}
                        useOneTap
                    />
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        fontFamily: "'Segoe UI', sans-serif",
        backgroundColor: '#f7f8fc',
        padding: '20px'
    },
    card: {
        backgroundColor: '#fff',
        padding: '40px 30px',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
        textAlign: 'center',
        width: '100%',
        maxWidth: '400px'
    },
    title: {
        margin: '0 0 8px 0',
        fontSize: '28px',
        color: '#1a202c',
        fontWeight: '800'
    },
    subtitle: {
        margin: '0 0 30px 0',
        color: '#718096',
        fontSize: '15px'
    },
    loginWrapper: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '20px'
    },
    errorBox: {
        backgroundColor: '#fff5f5',
        color: '#c53030',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '14px',
        marginBottom: '20px',
        fontWeight: '600'
    }
};
