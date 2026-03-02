import { dashboardService } from '@/api/dashboard-service';
import { departmentService } from '@/api/department.service';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addDays, endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { Briefcase, Calendar as CalendarIcon, Coins, Filter, UserMinus, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MetricCard } from './metric-card';

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

// Material Design Elevation Shadows
const ELEVATION = {
  1: 'shadow-sm', // 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)
  2: 'shadow', // 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)
  4: 'shadow-md', // 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)
  8: 'shadow-lg', // 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)
  16: 'shadow-xl', // 0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)
};

// Material Design Chart Colors
const CHART_COLORS = {
  gender: ['#1976D2', '#FF7043', '#9C27B0'], // Blue, Deep Orange, Purple
  department: ['#4CAF50', '#FF9800', '#9C27B0', '#2196F3', '#F44336', '#607D8B'], // Green, Orange, Purple, Blue, Red, Blue Grey
  attrition: '#F44336', // Red
  budget: '#4CAF50', // Green
};

const MaterialTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="bg-white rounded-lg p-4 shadow-lg border-0"
        style={{
          boxShadow: '0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12), 0 5px 5px -3px rgba(0,0,0,0.20)',
        }}
      >
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {`${entry.name}: ${entry.dataKey.includes('Rate') ? `${entry.value.toFixed(2)}%` : entry.value.toLocaleString()}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Material Design Chart Card Component
const ChartCard = ({ title, subtitle, children, actions }) => (
  <div className={`bg-white rounded-lg ${ELEVATION[2]} hover:${ELEVATION[4]} transition-all duration-200`}>
    <div className="p-6 pb-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
    <div className="px-6 pb-6">{children}</div>
  </div>
);

export function HRDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ employees: [], leaves: [], expenses: [], budgets: [] });
  const [analytics, setAnalytics] = useState({
    genderDistribution: [],
    leaveByDept: [],
    attritionRate: [],
    budgetVsActual: { allocated: 0, actual: 0, progress: 0 },
    headcount: 0,
    leaveRequests: 0,
    totalSpent: 0,
  });

  const [filters, setFilters] = useState({
    department: 'all',
    dateRange: {
      from: startOfMonth(subMonths(new Date(), 1)),
      to: new Date(),
    },
  });
  const [departments, setDepartments] = useState([]);
  const [metrics, setMetrics] = useState({
    genderDistribution: [
      {
        gender: 'M',
        count: 0,
      },
      {
        gender: 'F',
        count: 0,
      },
    ],
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [departmentsData, employees, leaves, budgets] = await Promise.all([
          departmentService.getDepartments({ rows: 1000 }),
        ]);

        const analytics = await dashboardService.getHRDashboard({
          department: filters.department,
          startDate: filters.dateRange.from,
          endDate: filters.dateRange.to,
        });

        setDepartments(departmentsData.data);
        setMetrics((prev) => ({ ...prev, ...analytics.data }));
        setData({ employees, leaves, budgets });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setData({ employees: [], leaves: [], budgets: [] });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters]);

  const processData = useCallback(() => {
    if (loading) return;

    const { employees, leaves, budgets } = data;
    const { department, dateRange } = filters;

    // Filter data based on selections
    const filteredEmployees = department === 'all' ? employees : employees.filter((e) => e.department === department);

    // Calculate metrics
    const headcount = filteredEmployees.filter((e) => e.employment_status === 'active').length;
    const leaveRequests = filteredLeaves.length;

    // Gender Distribution
    const genderCounts = filteredEmployees.reduce((acc, emp) => {
      const gender = emp.gender ? emp.gender.charAt(0).toUpperCase() + emp.gender.slice(1) : 'Other';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});
    const genderDistribution = Object.keys(genderCounts).map((name) => ({ name, value: genderCounts[name] }));

    // Leave Requests by Department
    const leaveCountsByDept = filteredLeaves.reduce((acc, leave) => {
      const dept = leave.employee_department || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});
    const leaveByDept = Object.keys(leaveCountsByDept).map((name) => ({ name, requests: leaveCountsByDept[name] }));

    // Attrition Rate (Last 6 Months)
    const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
    const attritionData = [];
    for (let i = 0; i < 6; i++) {
      const monthDate = addDays(sixMonthsAgo, i * 30);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const terminationsThisMonth = employees.filter(
        (e) => e.termination_date && new Date(e.termination_date) >= monthStart && new Date(e.termination_date) <= monthEnd,
      ).length;

      const activeAtMonthStart = employees.filter(
        (e) => new Date(e.hire_date) < monthStart && (!e.termination_date || new Date(e.termination_date) >= monthStart),
      ).length;

      const activeAtMonthEnd = employees.filter(
        (e) => new Date(e.hire_date) <= monthEnd && (!e.termination_date || new Date(e.termination_date) > monthEnd),
      ).length;

      const avgEmployees = (activeAtMonthStart + activeAtMonthEnd) / 2;
      const rate = avgEmployees > 0 ? (terminationsThisMonth / avgEmployees) * 100 : 0;

      attritionData.push({
        month: format(monthStart, 'MMM yyyy'),
        'Attrition Rate': rate,
        Leavers: terminationsThisMonth,
      });
    }

    // Budget vs. Actual
    const period = format(filters.dateRange.from, 'yyyy-MM');
    const relevantBudgets = budgets.filter((b) => b.period === period && (b.department === department || department === 'all'));
    const allocated = relevantBudgets.reduce((sum, b) => sum + b.allocated_amount, 0);
    const actual = totalSpent;
    const progress = allocated > 0 ? Math.min((actual / allocated) * 100, 100) : 0;
    const budgetVsActual = { allocated, actual, progress };

    setAnalytics({
      headcount,
      leaveRequests,
      totalSpent,
      genderDistribution,
      leaveByDept,
      attritionRate: attritionData,
      budgetVsActual,
    });
  }, [data, filters, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: MATERIAL_COLORS.background }}>
        <div className="text-center">
          <div
            className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: MATERIAL_COLORS.primary }}
          ></div>
          <p className="text-lg font-medium text-gray-700">Loading Analytics Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: MATERIAL_COLORS.background }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Material Design Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-lg text-gray-600">Comprehensive HR Management Insights</p>
          </div>

          {/* Material Design Filters */}
          <div className={`flex items-center gap-4 bg-white rounded-lg p-4 ${ELEVATION[2]}`}>
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-500" />
              <Select value={filters.department} onValueChange={(val) => setFilters((f) => ({ ...f, department: val }))}>
                <SelectTrigger className="w-48 border-0 bg-gray-50 rounded-lg">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.length
                    ? departments.map((department) => (
                        <SelectItem key={department.id} value={department.name} className="capitalize">
                          {department.name}
                        </SelectItem>
                      ))
                    : null}
                </SelectContent>
              </Select>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-72 justify-start text-left font-normal border-0 bg-gray-50 rounded-lg">
                  <CalendarIcon className="mr-3 h-4 w-4" />
                  {filters.dateRange?.from ? (
                    filters.dateRange.to ? (
                      `${format(filters.dateRange.from, 'LLL dd, y')} - ${format(filters.dateRange.to, 'LLL dd, y')}`
                    ) : (
                      format(filters.dateRange.from, 'LLL dd, y')
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className={`w-auto p-0 ${ELEVATION[8]}`} align="end">
                <Calendar
                  mode="range"
                  defaultMonth={filters.dateRange?.from}
                  selected={filters.dateRange}
                  onSelect={(range) => setFilters((f) => ({ ...f, dateRange: range || f.dateRange }))}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Material Design KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Active Headcount"
            value={metrics?.overview?.totalHeadcount || 0}
            icon={Users}
            color={MATERIAL_COLORS.primary}
          />
          <MetricCard
            title="Leave Requests"
            value={metrics?.overview?.pendingLeaveRequests || 0}
            icon={Briefcase}
            color={MATERIAL_COLORS.warning}
          />

          <MetricCard
            title="Attrition Rate"
            value={`${metrics?.overview?.attritionRate || '0%'}`}
            icon={UserMinus}
            color={MATERIAL_COLORS.error}
          />

          <MetricCard
            title="Pending Loan Requests"
            value={`${metrics?.overview?.pendingLoanRequests || '0'}`}
            icon={Coins}
            color={MATERIAL_COLORS.info}
          />
        </div>

        {/* Material Design Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          {/* Gender Distribution */}
          <ChartCard title="Gender Distribution" subtitle="Workforce demographics overview">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.genderDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                      const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="white"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={14}
                          fontWeight="600"
                        >
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  >
                    {metrics.genderDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS.gender[index % CHART_COLORS.gender.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<MaterialTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Leave Requests */}
          {/* <ChartCard title="Leave Requests" subtitle="By department for selected period">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.leaveByDept} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                  <XAxis
                    dataKey="name"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<MaterialTooltip />} />
                  <Bar dataKey="requests" fill={MATERIAL_COLORS.secondary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard> */}

          {/* Budget Progress */}
          {/* <ChartCard title="Budget Utilization" subtitle={`${format(filters.dateRange.from, 'MMM yyyy')} performance`}>
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">{analytics.budgetVsActual.progress.toFixed(1)}%</div>
                <p className="text-gray-600">of budget utilized</p>
              </div>

              <div className="space-y-4">
                <Progress
                  value={analytics.budgetVsActual.progress}
                  className="h-3 bg-gray-100"
                  style={{
                    background: 'linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%)',
                  }}
                />

                <div className="flex justify-between text-sm text-gray-600">
                  <div>
                    <p className="font-medium">Spent</p>
                    <p className="text-lg font-bold text-gray-900">₦{analytics.budgetVsActual.actual.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">Budget</p>
                    <p className="text-lg font-bold text-gray-900">₦{analytics.budgetVsActual.allocated.toLocaleString()}</p>
                  </div>
                </div>

                <div className={`p-3 rounded-lg ${analytics.budgetVsActual.progress > 90 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <p
                    className={`text-sm font-medium ${
                      analytics.budgetVsActual.progress > 90 ? 'text-red-700' : 'text-green-700'
                    }`}
                  >
                    {analytics.budgetVsActual.progress > 90 ? '⚠️ Approaching budget limit' : '✅ Budget on track'}
                  </p>
                </div>
              </div>
            </div>
          </ChartCard> */}
        </div>

        {/* Attrition Rate Chart */}
        <ChartCard title="Employee Attrition Trend" subtitle="Monthly turnover rate over the last 6 months">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.attritionTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<MaterialTooltip />} />
                <Legend iconType="circle" />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={CHART_COLORS.attrition}
                  strokeWidth={3}
                  dot={{ r: 6, fill: CHART_COLORS.attrition }}
                  activeDot={{ r: 8, fill: CHART_COLORS.attrition }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
