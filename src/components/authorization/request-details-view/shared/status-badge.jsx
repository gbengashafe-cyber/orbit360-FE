import { Badge } from '@/components/ui/badge';
import { getStatusColor } from '@/pages/authorization-center-new/authorization-center.util';

export const StatusBadge = ({ status }) => (status ? <Badge className={getStatusColor(status)}>{status}</Badge> : 'N/A');
