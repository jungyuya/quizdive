import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard';

export const metadata = {
    title: 'QuizDive 운영 대시보드',
    robots: { index: false },
};

export default function MonitoringPage() {
    return <MonitoringDashboard />;
}
