import React from 'react';
import { Tag as TagKind } from '../../engine/constants';

interface TagProps {
  kind: TagKind;
  className?: string;
}

export const Tag: React.FC<TagProps> = ({ kind, className = '' }) => {
  const styles: Record<TagKind, string> = {
    DATA: 'bg-sky/15 text-sky border-sky/30',
    COMPUTED: 'bg-chalk-faint/20 text-chalk-dim border-chalk-faint/30',
    ASSUMED: 'bg-saffron/15 text-saffron border-saffron/30',
    SCENARIO: 'bg-alert/15 text-alert border-alert/30',
  };

  const labels: Record<TagKind, string> = {
    DATA: 'Data',
    COMPUTED: 'Computed',
    ASSUMED: 'Assumed',
    SCENARIO: 'Scenario',
  };

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-[10px] leading-tight font-medium rounded-control border ${styles[kind]} ${className}`}
      title={`Truth ledger status: ${labels[kind]}`}
    >
      {labels[kind]}
    </span>
  );
};
