import React, { useState, useEffect, useCallback } from 'react';
import { Vendor, User } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Building, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Download,
  Upload,
  Star,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

export default function VendorManagement() {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    vendor_name: '',
    vendor_code: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
    postal_code: '',
    business_type: 'supplier',
    category: 'office_supplies',
    tax_id: '',
    bank_name: '',
    account_number: '',
    account_name: '',
    swift_code: '',
    payment_terms: 'net_30',
    credit_limit: '',
    status: 'pending_approval',
    notes: '',
    rating: 3
  });

  useEffect(() => {
    loadData();
  }, []);

  const filterVendors = useCallback(() => {
    let filtered = vendors;

    if (searchTerm) {
      filtered = filtered.filter(vendor =>
        vendor.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(vendor => vendor.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(vendor => vendor.status === statusFilter);
    }

    setFilteredVendors(filtered);
  }, [vendors, searchTerm, categoryFilter, statusFilter]);

  useEffect(() => {
    filterVendors();
  }, [filterVendors]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vendorsData, userData] = await Promise.all([
        Vendor.list('-created_date'),
        User.me()
      ]);
      setVendors(vendorsData);
      setCurrentUser(userData);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateVendorCode = () => {
    return 'V-' + Date.now().toString(36).toUpperCase();
  };

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      ...vendor,
      credit_limit: vendor.credit_limit || '',
      rating: vendor.rating || 3
    });
    setShowForm(true);
  };

  const handleNewVendor = () => {
    setEditingVendor(null);
    setFormData({
      vendor_name: '',
      vendor_code: generateVendorCode(),
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: 'Nigeria',
      postal_code: '',
      business_type: 'supplier',
      category: 'office_supplies',
      tax_id: '',
      bank_name: '',
      account_number: '',
      account_name: '',
      swift_code: '',
      payment_terms: 'net_30',
      credit_limit: '',
      status: 'pending_approval',
      notes: '',
      rating: 3
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const vendorData = {
        ...formData,
        credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : null,
        rating: parseInt(formData.rating)
      };

      if (editingVendor) {
        await Vendor.update(editingVendor.id, vendorData);
        setSuccess('Vendor updated successfully');
      } else {
        await Vendor.create(vendorData);
        setSuccess('Vendor created successfully');
      }

      setShowForm(false);
      setEditingVendor(null);
      loadData();
    } catch (error) {
      setError('Failed to save vendor. Please try again.');
      console.error('Error saving vendor:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (vendorId) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;

    try {
      await Vendor.delete(vendorId);
      setSuccess('Vendor deleted successfully');
      loadData();
    } catch (error) {
      setError('Failed to delete vendor');
      console.error('Error deleting vendor:', error);
    }
  };

  const updateVendorStatus = async (vendorId, newStatus) => {
    try {
      await Vendor.update(vendorId, { status: newStatus });
      setSuccess('Vendor status updated successfully');
      loadData();
    } catch (error) {
      setError('Failed to update vendor status');
      console.error('Error updating vendor status:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
      inactive: { color: 'bg-gray-100 text-gray-700', icon: <XCircle className="w-3 h-3" /> },
      suspended: { color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" /> },
      pending_approval: { color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3 h-3" /> }
    };

    const config = statusConfig[status] || statusConfig.pending_approval;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const canManageVendors = ['admin', 'admin_officer', 'finance_officer'].includes(currentUser?.role);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
      </div>
    );
  }

  if (!canManageVendors) {
    return (
      <div className="p-8 text-center">
        <Building className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
        <p className="text-gray-500">You don't have permission to manage vendors.</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-700 to-purple-800 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-700/25">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Vendor Management</h1>
              <p className="text-gray-600">Manage company vendors and supplier information</p>
            </div>
          </div>

          <Button 
            onClick={handleNewVendor}
            className="bg-gradient-to-r from-purple-700 to-purple-800 hover:from-purple-800 hover:to-purple-900 text-white shadow-lg shadow-purple-700/25"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Vendor
          </Button>
        </div>

        {/* Alerts */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Search & Filter Vendors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search vendors, contacts, or emails..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="office_supplies">Office Supplies</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="catering">Catering</SelectItem>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="professional_services">Professional Services</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="toiletries">Toiletries</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendor List */}
        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
          <CardHeader>
            <CardTitle>Vendors ({filteredVendors.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Vendor Details</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Terms</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.map(vendor => (
                    <TableRow key={vendor.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-gray-900">{vendor.vendor_name}</p>
                          <p className="text-sm text-gray-500">{vendor.vendor_code}</p>
                          <p className="text-xs text-gray-400">{vendor.business_type.replace('_', ' ')}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{vendor.contact_person}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{vendor.email}</span>
                          </div>
                          {vendor.city && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="text-sm">{vendor.city}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {vendor.category.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(vendor.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-3 h-3 text-gray-400" />
                          <span className="text-sm capitalize">{vendor.payment_terms.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < (vendor.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="text-xs text-gray-500 ml-1">({vendor.rating || 0})</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(vendor)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          {vendor.status === 'pending_approval' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateVendorStatus(vendor.id, 'active')}
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              <CheckCircle className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(vendor.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredVendors.length === 0 && (
              <div className="text-center p-12 text-gray-500">
                <Building className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold">No Vendors Found</h3>
                <p>No vendors match your current filters.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vendor Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="contact">Contact & Address</TabsTrigger>
                  <TabsTrigger value="financial">Financial Details</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vendor_name">Vendor Name *</Label>
                      <Input
                        id="vendor_name"
                        value={formData.vendor_name}
                        onChange={(e) => setFormData({...formData, vendor_name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vendor_code">Vendor Code</Label>
                      <Input
                        id="vendor_code"
                        value={formData.vendor_code}
                        onChange={(e) => setFormData({...formData, vendor_code: e.target.value})}
                        placeholder="Auto-generated"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="business_type">Business Type *</Label>
                      <Select value={formData.business_type} onValueChange={(value) => setFormData({...formData, business_type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="supplier">Supplier</SelectItem>
                          <SelectItem value="contractor">Contractor</SelectItem>
                          <SelectItem value="service_provider">Service Provider</SelectItem>
                          <SelectItem value="consultant">Consultant</SelectItem>
                          <SelectItem value="distributor">Distributor</SelectItem>
                          <SelectItem value="manufacturer">Manufacturer</SelectItem>
                          <SelectItem value="retailer">Retailer</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="office_supplies">Office Supplies</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="travel">Travel</SelectItem>
                          <SelectItem value="catering">Catering</SelectItem>
                          <SelectItem value="cleaning">Cleaning</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="professional_services">Professional Services</SelectItem>
                          <SelectItem value="utilities">Utilities</SelectItem>
                          <SelectItem value="transport">Transport</SelectItem>
                          <SelectItem value="toiletries">Toiletries</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                          <SelectItem value="pending_approval">Pending Approval</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rating">Rating (1-5)</Label>
                      <Select value={formData.rating?.toString()} onValueChange={(value) => setFormData({...formData, rating: parseInt(value)})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Star</SelectItem>
                          <SelectItem value="2">2 Stars</SelectItem>
                          <SelectItem value="3">3 Stars</SelectItem>
                          <SelectItem value="4">4 Stars</SelectItem>
                          <SelectItem value="5">5 Stars</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Additional notes about this vendor..."
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact_person">Contact Person *</Label>
                      <Input
                        id="contact_person"
                        value={formData.contact_person}
                        onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tax_id">Tax ID</Label>
                      <Input
                        id="tax_id"
                        value={formData.tax_id}
                        onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData({...formData, state: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData({...formData, country: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postal_code">Postal Code</Label>
                      <Input
                        id="postal_code"
                        value={formData.postal_code}
                        onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="financial" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bank_name">Bank Name</Label>
                      <Input
                        id="bank_name"
                        value={formData.bank_name}
                        onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account_number">Account Number</Label>
                      <Input
                        id="account_number"
                        value={formData.account_number}
                        onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="account_name">Account Name</Label>
                      <Input
                        id="account_name"
                        value={formData.account_name}
                        onChange={(e) => setFormData({...formData, account_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="swift_code">SWIFT Code</Label>
                      <Input
                        id="swift_code"
                        value={formData.swift_code}
                        onChange={(e) => setFormData({...formData, swift_code: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="payment_terms">Payment Terms</Label>
                      <Select value={formData.payment_terms} onValueChange={(value) => setFormData({...formData, payment_terms: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="net_7">Net 7 days</SelectItem>
                          <SelectItem value="net_15">Net 15 days</SelectItem>
                          <SelectItem value="net_30">Net 30 days</SelectItem>
                          <SelectItem value="net_60">Net 60 days</SelectItem>
                          <SelectItem value="net_90">Net 90 days</SelectItem>
                          <SelectItem value="cod">Cash on Delivery</SelectItem>
                          <SelectItem value="advance">Advance Payment</SelectItem>
                          <SelectItem value="custom">Custom Terms</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="credit_limit">Credit Limit (₦)</Label>
                      <Input
                        id="credit_limit"
                        type="number"
                        value={formData.credit_limit}
                        onChange={(e) => setFormData({...formData, credit_limit: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {submitting ? 'Saving...' : (editingVendor ? 'Update Vendor' : 'Create Vendor')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}