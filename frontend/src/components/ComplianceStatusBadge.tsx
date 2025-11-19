import React from 'react';

interface ComplianceStatusBadgeProps {
  complianceRequired?: boolean;
  isAcknowledged?: boolean;
  acknowledgedAt?: Date | string;
  size?: 'small' | 'medium';
}

const ComplianceStatusBadge: React.FC<ComplianceStatusBadgeProps> = ({
  complianceRequired,
  isAcknowledged,
  acknowledgedAt,
  size = 'small',
}) => {
  // If compliance is not required, don't show anything
  if (!complianceRequired) {
    return <span className="compliance-badge compliance-not-required">-</span>;
  }

  // If acknowledged, show success badge
  if (isAcknowledged) {
    const tooltipText = acknowledgedAt
      ? `Acknowledged on ${new Date(acknowledgedAt).toLocaleString()}`
      : 'Acknowledged';

    return (
      <span 
        className={`compliance-badge compliance-acknowledged ${size === 'small' ? 'badge-small' : ''}`}
        title={tooltipText}
      >
        ✓ Compliant
      </span>
    );
  }

  // If not acknowledged, show pending badge
  return (
    <span 
      className={`compliance-badge compliance-pending ${size === 'small' ? 'badge-small' : ''}`}
      title="Acknowledgement required"
    >
      ⏳ Pending
    </span>
  );
};

export default ComplianceStatusBadge;
