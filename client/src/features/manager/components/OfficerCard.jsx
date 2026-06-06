import React from 'react';

const OfficerCard = ({ name, email, workload, status }) => {
    return (
        <article className="officer-card">
            <div>
                <p className="officer-card__name">{name}</p>
                <p className="officer-card__email">{email}</p>
            </div>

            <div className="officer-card__meta">
                <span className="officer-card__workload">{workload}</span>
                <span className="officer-card__status">{status}</span>
            </div>
        </article>
    );
};

export default OfficerCard;
