import { StatusBadge as SharedStatusBadge } from '@/components/system';

export const StatusBadge = ({ status }) => (status ? <SharedStatusBadge status={status} /> : 'N/A');
