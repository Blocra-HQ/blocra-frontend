import { useParams } from 'react-router-dom';
import { DashboardEditor } from '@/components/dashboard/DashboardEditor';

export default function DashboardEdit() {
  const { id } = useParams();
  
  return <DashboardEditor dashboardId={id} />;
}