import React from 'react';
import Layout from '../components/Layout';

const ComingSoon = ({ title }) => (
    <Layout title={title}>
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            gap: '16px',
            textAlign: 'center',
        }}>
            <div style={{
                fontSize: '48px',
                lineHeight: '1',
            }}>🚧</div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)' }}>
                {title}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '300px' }}>
                This section is under construction. Check back soon.
            </p>
        </div>
    </Layout>
);

export default ComingSoon;
