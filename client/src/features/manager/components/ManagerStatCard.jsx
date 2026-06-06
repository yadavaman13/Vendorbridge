import React from 'react';

const ManagerStatCard = ({ label, value, hint, tone = 'default' }) => {
    return (
        <article className={`manager-stat-card manager-stat-card--${tone}`}>
            <p className="manager-stat-card__label">{label}</p>
            <h3 className="manager-stat-card__value">{value}</h3>
            <p className="manager-stat-card__hint">{hint}</p>
        </article>
    );
};

export default ManagerStatCard;
