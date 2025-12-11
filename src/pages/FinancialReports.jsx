import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, FileText, Download, Calendar as CalendarIcon, Filter, BarChart3 } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';

const CHART_COLORS = ['#1976D2', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#00BCD4'];

export default function FinancialReports() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ contacts: [], deals: [], expenses: [] });
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(subMonths(new Date(), 5)),
    to: endOfMonth(new Date())
  });
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    customerGrowth: [],
    revenueVsExpenses: [],
    dealsByStage: [],
    expensesByCategory: [],
    topCustomers: [],
    conversionRate: 0,
    avgDealValue: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      processAnalytics();
    }
  }, [data, dateRange, departmentFilter, loading]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [contactsData, dealsData, expensesData] = await Promise.all([
        base44.entities.Contact.list('-created_date'),
        base44.entities.Deal.list('-created_date'),
        base44.entities.ExpenseRequest.list('-created_date')
      ]);
      setData({ contacts: contactsData, deals: dealsData, expenses: expensesData });
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalytics = () => {
    const { contacts, deals, expenses } = data;

    // Filter by date range
    const filteredDeals = deals.filter(d => {
      const closeDate = new Date(d.close_date || d.created_date);
      return closeDate >= dateRange.from && closeDate <= dateRange.to;
    });

    const filteredExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date_incurred || e.created_date);
      const deptMatch = departmentFilter === 'all' || e.department === departmentFilter;
      return deptMatch && expenseDate >= dateRange.from && expenseDate <= dateRange.to;
    });

    const filteredContacts = contacts.filter(c => {
      const contactDate = new Date(c.created_date);
      return contactDate >= dateRange.from && contactDate <= dateRange.to;
    });

    // Calculate totals
    const totalRevenue = filteredDeals
      .filter(d => d.stage === 'won')
      .reduce((sum, d) => sum + (d.value || 0), 0);

    const totalExpenses = filteredExpenses
      .filter(e => ['final_approved', 'paid', 'settled'].includes(e.status))
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const netProfit = totalRevenue - totalExpenses;

    // Customer Growth (monthly)
    const months = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
    const customerGrowth = months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const newCustomers = contacts.filter(c => {
        const contactDate = new Date(c.created_date);
        return contactDate >= monthStart && contactDate <= monthEnd;
      }).length;
      return {
        month: format(month, 'MMM yyyy'),
        customers: newCustomers
      };
    });

    // Revenue vs Expenses (monthly)
    const revenueVsExpenses = months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthRevenue = deals
        .filter(d => {
          const closeDate = new Date(d.close_date || d.created_date);
          return d.stage === 'won' && closeDate >= monthStart && closeDate <= monthEnd;
        })
        .reduce((sum, d) => sum + (d.value || 0), 0);

      const monthExpenses = expenses
        .filter(e => {
          const expenseDate = new Date(e.date_incurred || e.created_date);
          const deptMatch = departmentFilter === 'all' || e.department === departmentFilter;
          return deptMatch && ['final_approved', 'paid', 'settled'].includes(e.status) && 
                 expenseDate >= monthStart && expenseDate <= monthEnd;
        })
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      return {
        month: format(month, 'MMM yyyy'),
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthRevenue - monthExpenses
      };
    });

    // Deals by Stage
    const dealsByStage = [
      { stage: 'Prospecting', count: deals.filter(d => d.stage === 'prospecting').length, value: deals.filter(d => d.stage === 'prospecting').reduce((s, d) => s + (d.value || 0), 0) },
      { stage: 'Qualification', count: deals.filter(d => d.stage === 'qualification').length, value: deals.filter(d => d.stage === 'qualification').reduce((s, d) => s + (d.value || 0), 0) },
      { stage: 'Proposal', count: deals.filter(d => d.stage === 'proposal').length, value: deals.filter(d => d.stage === 'proposal').reduce((s, d) => s + (d.value || 0), 0) },
      { stage: 'Negotiation', count: deals.filter(d => d.stage === 'negotiation').length, value: deals.filter(d => d.stage === 'negotiation').reduce((s, d) => s + (d.value || 0), 0) },
      { stage: 'Won', count: deals.filter(d => d.stage === 'won').length, value: deals.filter(d => d.stage === 'won').reduce((s, d) => s + (d.value || 0), 0) },
      { stage: 'Lost', count: deals.filter(d => d.stage === 'lost').length, value: deals.filter(d => d.stage === 'lost').reduce((s, d) => s + (d.value || 0), 0) }
    ];

    // Expenses by Category
    const categoryMap = {};
    filteredExpenses
      .filter(e => ['final_approved', 'paid', 'settled'].includes(e.status))
      .forEach(expense => {
        const cat = expense.category_id || 'Uncategorized';
        categoryMap[cat] = (categoryMap[cat] || 0) + expense.amount;
      });
    const expensesByCategory = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

    // Top Customers (by deal value)
    const customerMap = {};
    deals
      .filter(d => d.stage === 'won')
      .forEach(deal => {
        const contact = contacts.find(c => c.id === deal.contact_id);
        const customerName = contact ? contact.name : 'Unknown';
        customerMap[customerName] = (customerMap[customerName] || 0) + (deal.value || 0);
      });
    const topCustomers = Object.entries(customerMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Conversion Rate
    const totalDeals = deals.length;
    const wonDeals = deals.filter(d => d.stage === 'won').length;
    const conversionRate = totalDeals > 0 ? ((wonDeals / totalDeals) * 100) : 0;

    // Average Deal Value
    const avgDealValue = wonDeals > 0 ? (totalRevenue / wonDeals) : 0;

    setAnalytics({
      totalRevenue,
      totalExpenses,
      netProfit,
      customerGrowth,
      revenueVsExpenses,
      dealsByStage,
      expensesByCategory,
      topCustomers,
      conversionRate,
      avgDealValue
    });
  };

  const exportToCSV = (reportType) => {
    let csvContent = '';
    let filename = '';

    if (reportType === 'revenue') {
      csvContent = [
        ['Month', 'Revenue', 'Expenses', 'Profit'].join(','),
        ...analytics.revenueVsExpenses.map(row => 
          [row.month, row.revenue, row.expenses, row.profit].join(',')
        )
      ].join('\n');
      filename = `Revenue_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    } else if (reportType === 'expenses') {
      csvContent = [
        ['Category', 'Amount'].join(','),
        ...analytics.expensesByCategory.map(row => [row.name, row.value].join(','))
      ].join('\n');
      filename = `Expenses_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    } else if (reportType === 'customers') {
      csvContent = [
        ['Customer', 'Total Value'].join(','),
        ...analytics.topCustomers.map(row => [row.name, row.value].join(','))
      ].join('\n');
      filename = `Customers_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    } else if (reportType === 'deals') {
      csvContent = [
        ['Stage', 'Count', 'Total Value'].join(','),
        ...analytics.dealsByStage.map(row => [row.stage, row.count, row.value].join(','))
      ].join('\n');
      filename = `Deals_Pipeline_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading financial reports...</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Financial Reports & Analytics</h1>
              <p className="text-gray-600">Track revenue, expenses, and customer growth with comprehensive insights</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="it">IT</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-72">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
                    ) : format(dateRange.from, "LLL dd, y")
                  ) : "Pick a date range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range) => setDateRange(range || dateRange)}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">
                    ₦{analytics.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Total Expenses</p>
                  <p className="text-3xl font-bold text-red-900 mt-2">
                    ₦{analytics.totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </p>
                </div>
                <TrendingDown className="w-10 h-10 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${analytics.netProfit >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-orange-50 to-orange-100 border-orange-200'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${analytics.netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Net Profit</p>
                  <p className={`text-3xl font-bold mt-2 ${analytics.netProfit >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                    ₦{analytics.netProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </p>
                </div>
                <DollarSign className={`w-10 h-10 ${analytics.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Total Customers</p>
                  <p className="text-3xl font-bold text-purple-900 mt-2">{data.contacts.length}</p>
                  <p className="text-xs text-purple-600 mt-1">
                    Conversion: {analytics.conversionRate.toFixed(1)}%
                  </p>
                </div>
                <Users className="w-10 h-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Reports */}
        <Tabs defaultValue="revenue" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="revenue">Revenue & Profit</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="deals">Deals Pipeline</TabsTrigger>
          </TabsList>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Revenue vs Expenses Trend</CardTitle>
                <Button onClick={() => exportToCSV('revenue')} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.revenueVsExpenses}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" stackId="1" stroke="#4CAF50" fill="#4CAF50" fillOpacity={0.6} name="Revenue" />
                      <Area type="monotone" dataKey="expenses" stackId="2" stroke="#F44336" fill="#F44336" fillOpacity={0.6} name="Expenses" />
                      <Line type="monotone" dataKey="profit" stroke="#1976D2" strokeWidth={3} name="Net Profit" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Key Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-700 font-medium">Average Deal Value</span>
                    <span className="text-xl font-bold text-blue-700">₦{analytics.avgDealValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-700 font-medium">Profit Margin</span>
                    <span className="text-xl font-bold text-green-700">
                      {analytics.totalRevenue > 0 ? ((analytics.netProfit / analytics.totalRevenue) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-700 font-medium">Expense Ratio</span>
                    <span className="text-xl font-bold text-red-700">
                      {analytics.totalRevenue > 0 ? ((analytics.totalExpenses / analytics.totalRevenue) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {analytics.revenueVsExpenses.slice().reverse().map((month, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">{month.month}</span>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">₦{month.revenue.toLocaleString()}</div>
                          <div className={`text-xs font-semibold ${month.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {month.profit >= 0 ? '+' : ''}₦{month.profit.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Expenses by Category</CardTitle>
                <Button onClick={() => exportToCSV('expenses')} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.expensesByCategory}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {analytics.expensesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Customer Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.customerGrowth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="customers" fill="#1976D2" name="New Customers" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Top 10 Customers by Revenue</CardTitle>
                  <Button onClick={() => exportToCSV('customers')} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {analytics.topCustomers.map((customer, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                            {idx + 1}
                          </div>
                          <span className="font-medium text-gray-900">{customer.name}</span>
                        </div>
                        <span className="text-green-700 font-bold">₦{customer.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Deals Pipeline Tab */}
          <TabsContent value="deals" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Sales Pipeline Overview</CardTitle>
                <Button onClick={() => exportToCSV('deals')} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.dealsByStage} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="stage" type="category" />
                      <Tooltip formatter={(value) => value.toLocaleString()} />
                      <Legend />
                      <Bar dataKey="count" fill="#1976D2" name="Number of Deals" />
                      <Bar dataKey="value" fill="#4CAF50" name="Total Value (₦)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
              {analytics.dealsByStage.map((stage, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-lg">{stage.stage}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Deals:</span>
                        <span className="font-bold">{stage.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Value:</span>
                        <span className="font-bold text-green-700">₦{stage.value.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}