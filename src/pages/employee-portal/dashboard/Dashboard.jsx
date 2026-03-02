import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useGlobalContext } from '@/state/context';
import { createPageUrl } from '@/utils';
import { HandCoins, Loader, PlaneTakeoff, Star } from 'lucide-react';
import { Link } from 'react-router';

// Material Design Color Palette
const MATERIAL_COLORS = {
  primary: '#1976D2', // Blue 700
  primaryLight: '#42A5F5', // Blue 400
  primaryDark: '#0D47A1', // Blue 900
  secondary: '#388E3C', // Green 600
  secondaryLight: '#66BB6A', // Green 400
  error: '#D32F2F', // Red 700
  warning: '#F57C00', // Orange 700
  success: '#388E3C', // Green 600
  info: '#0288D1', // Light Blue 600
  surface: '#FFFFFF',
  background: '#FAFAFA', // Grey 50
  onSurface: '#212121', // Grey 900
  onBackground: '#212121',
};

export function Dashboard() {
  const { currentUser, isLoadingUser } = useGlobalContext();

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: MATERIAL_COLORS.background }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {isLoadingUser ? (
          <Loader />
        ) : (
          <div className="grid mx-20 mt-20 p-10 lg:grid-cols-3 gap-4 bg-blue-100/70 rounded-2xl">
            <div>
              <h1 className="text-4xl text-gray-900 mb-2">Welcome, {currentUser?.employeeData?.firstName ?? ''}</h1>
              <p className="text-gray-500 font-medium">{currentUser?.employeeData?.jobRole?.title ?? ''}</p>
            </div>
            <div className="grid gap-2 justify-end col-span-2 ">
              <p>
                <EmployeeDetailsLabel>Staff ID:</EmployeeDetailsLabel> {currentUser?.employeeData?.staffId ?? ''}
              </p>
              <p>
                <EmployeeDetailsLabel>Supervisor:</EmployeeDetailsLabel> {currentUser?.employeeData?.supervisor?.firstName ?? ''}{' '}
                {currentUser?.employeeData?.supervisor?.lastName ?? ''}
              </p>
              <p>
                <EmployeeDetailsLabel>Department:</EmployeeDetailsLabel> {currentUser?.employeeData?.department?.name ?? ''}
              </p>
              <p>
                <EmployeeDetailsLabel>SBU:</EmployeeDetailsLabel> {currentUser?.employeeData?.company?.name ?? ''}
              </p>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <p className="flex text-gray-500">
              <Star className="text-blue-400 w-3 me-2" />
              Shortcuts
            </p>
          </CardHeader>
          <CardContent className="grid md:grid-flow-col lg:justify-start gap-4">
            {SHORTCUTS.map((_shortcut) => (
              <Link
                key={_shortcut.title}
                to={_shortcut.url}
                className="flex items-center gap-3 font- min-w-40 p-4 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                <_shortcut.icon className="w-5 text-blue-600" />
                <span role="link">{_shortcut.title}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const EmployeeDetailsLabel = ({ children }) => {
  return <Label className="text-gray-500 w-24 mr-2 inline-block text-right">{children}</Label>;
};

const SHORTCUTS = [
  { title: 'Leave Management', url: createPageUrl('leave-management'), icon: PlaneTakeoff },
  { title: 'Loan Requests', url: createPageUrl('employee-cooperative'), icon: HandCoins },
];
