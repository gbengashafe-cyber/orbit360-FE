import { dashboardService } from '@/api/dashboard-service';
import { departmentService } from '@/api/department.service';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader, StatCard, formatDate } from '@/components/system';
import { logger } from '@/utils';
import { startOfMonth, subMonths } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
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

// Material Design Chart Colors
const CHART_COLORS = {
  gender: ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'],
  attrition: 'hsl(var(--status-danger))',
};

const MaterialTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-popover p-3 text-popover-foreground shadow-overlay">
        <p className="mb-2 font-medium text-foreground">{label}</p>
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

const ChartCard = ({ title, subtitle, children, actions }) => (
  <section className="rounded-lg border bg-card">
    <div className="p-4 pb-2 sm:p-6 sm:pb-2">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-card-title text-foreground">{title}</h2>
          {subtitle && <p className="mt-1 text-body text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
    <div className="px-4 pb-4 sm:px-6 sm:pb-6">{children}</div>
  </section>
);

export function HRDashboard() {
  const [loading, setLoading] = useState(true);

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
        const departmentsData = await departmentService.getDepartments({ rows: 1000 });

        const analytics = await dashboardService.getHRDashboard({
          department: filters.department,
          startDate: filters.dateRange.from,
          endDate: filters.dateRange.to,
        });

        setDepartments(departmentsData.data);
        setMetrics((prev) => ({ ...prev, ...analytics.data }));
      } catch (error) {
        logger.error({ caller: 'Error loading HR dashboard data:', payload: error });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters]);

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><div className="text-center"><div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /><p className="text-body font-medium text-foreground">Loading analytics dashboard…</p></div></div>;
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        <PageHeader title="Analytics dashboard" description="Workforce and request insights for the selected period" actions={<div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-2">
            <div>
              <Select value={filters.department} onValueChange={(val) => setFilters((f) => ({ ...f, department: val }))}>
                <SelectTrigger className="w-48">
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
                <Button variant="secondary" className="w-72 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange?.from ? (
                    filters.dateRange.to ? `${formatDate(filters.dateRange.from)} – ${formatDate(filters.dateRange.to)}` : formatDate(filters.dateRange.from)
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  defaultMonth={filters.dateRange?.from}
                  selected={filters.dateRange}
                  onSelect={(range) => setFilters((f) => ({ ...f, dateRange: range || f.dateRange }))}
                />
              </PopoverContent>
            </Popover>
          </div>} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active headcount" value={metrics?.overview?.totalHeadcount || 0} />
          <StatCard label="Leave requests" value={metrics?.overview?.pendingLeaveRequests || 0} tone="pending" />
          <StatCard label="Attrition rate" value={`${metrics?.overview?.attritionRate || '0%'}`} tone="danger" />
          <StatCard label="Pending loan requests" value={`${metrics?.overview?.pendingLoanRequests || '0'}`} tone="pending" />
        </div>

        <div className="grid grid-cols-1 gap-6">
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
                <BarChart data={analytics.leaveByDepartment} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
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
