import React, { useState, useEffect } from 'react';
import { KPI, AppraisalCycle } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Archive, Star, Calendar, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const KPIForm = ({ kpi, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState(kpi || {
        job_role: '',
        department: '',
        title: '',
        description: '',
        weight: '',
        measure_of_success: '',
        status: 'active'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="job_role">Job Role</Label>
                    <Input id="job_role" value={formData.job_role} onChange={(e) => setFormData({...formData, job_role: e.target.value})} placeholder="e.g., Loan Officer" required />
                </div>
                <div>
                    <Label htmlFor="department">Department</Label>
                    <Select value={formData.department} onValueChange={(value) => setFormData({...formData, department: value})}>
                        <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="hr">Human Resources</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="operations">Operations</SelectItem>
                            <SelectItem value="it">IT</SelectItem>
                            <SelectItem value="sales">Sales</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div>
                <Label htmlFor="title">KPI Title</Label>
                <Input id="title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g., Loan Portfolio Growth" required />
            </div>
            <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Describe the KPI in detail" required />
            </div>
             <div>
                <Label htmlFor="measure">Measure of Success</Label>
                <Input id="measure" value={formData.measure_of_success} onChange={(e) => setFormData({...formData, measure_of_success: e.target.value})} placeholder="e.g., Achieve 15% growth QoQ" required />
            </div>
            <div>
                <Label htmlFor="weight">Weight (%)</Label>
                <Input id="weight" type="number" min="0" max="100" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} placeholder="e.g., 25" required />
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save KPI</Button>
            </div>
        </form>
    );
};

const CycleForm = ({ cycle, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState(cycle || {
        name: '',
        start_date: '',
        end_date: '',
        status: 'active'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="name">Cycle Name</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g., 2024 Annual Review" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input id="start_date" type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} required />
                </div>
                <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input id="end_date" type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} required />
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save Cycle</Button>
            </div>
        </form>
    );
};


export default function KPIManagement() {
    const [kpis, setKpis] = useState([]);
    const [cycles, setCycles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showKpiForm, setShowKpiForm] = useState(false);
    const [showCycleForm, setShowCycleForm] = useState(false);
    const [editingKpi, setEditingKpi] = useState(null);
    const [editingCycle, setEditingCycle] = useState(null);
    const [kpiToDelete, setKpiToDelete] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [kpiData, cycleData] = await Promise.all([
                KPI.list('-created_date'),
                AppraisalCycle.list('-start_date')
            ]);
            setKpis(kpiData);
            setCycles(cycleData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleKpiSubmit = async (formData) => {
        try {
            if (editingKpi) {
                await KPI.update(editingKpi.id, formData);
            } else {
                await KPI.create(formData);
            }
            setShowKpiForm(false);
            setEditingKpi(null);
            loadData();
        } catch (error) {
            console.error('Error saving KPI:', error);
        }
    };

    const handleCycleSubmit = async (formData) => {
        try {
            if (editingCycle) {
                await AppraisalCycle.update(editingCycle.id, formData);
            } else {
                await AppraisalCycle.create(formData);
            }
            setShowCycleForm(false);
            setEditingCycle(null);
            loadData();
        } catch (error) {
            console.error('Error saving Cycle:', error);
        }
    };

    const handleDeleteKpi = async () => {
        if (!kpiToDelete) return;
        try {
            await KPI.delete(kpiToDelete.id);
            setKpiToDelete(null);
            loadData();
        } catch (error) {
            console.error('Error deleting KPI:', error);
        }
    };

    const handleEditKpi = (kpi) => {
        setEditingKpi(kpi);
        setShowKpiForm(true);
    };

    if (loading) {
        return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
    }

    return (
        <div className="p-4 lg:p-8 min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Appraisal Management</h1>
                </div>

                {/* Appraisal Cycles Section */}
                <Card>
                    <CardHeader className="flex flex-row justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-6 h-6 text-blue-700"/>
                          <CardTitle>Appraisal Cycles</CardTitle>
                        </div>
                        <Dialog open={showCycleForm} onOpenChange={setShowCycleForm}>
                            <DialogTrigger asChild>
                                <Button onClick={() => setEditingCycle(null)}>
                                    <Plus className="w-4 h-4 mr-2"/> New Cycle
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{editingCycle ? 'Edit' : 'Create'} Appraisal Cycle</DialogTitle>
                                </DialogHeader>
                                <CycleForm cycle={editingCycle} onSubmit={handleCycleSubmit} onCancel={() => setShowCycleForm(false)}/>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Period</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {cycles.map(cycle => (
                                    <TableRow key={cycle.id}>
                                        <TableCell>{cycle.name}</TableCell>
                                        <TableCell>{new Date(cycle.start_date).toLocaleDateString()} - {new Date(cycle.end_date).toLocaleDateString()}</TableCell>
                                        <TableCell><span className={`px-2 py-1 rounded-full text-xs ${cycle.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{cycle.status}</span></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* KPI Library Section */}
                <Card>
                    <CardHeader className="flex flex-row justify-between items-center">
                        <div className="flex items-center gap-2">
                           <Star className="w-6 h-6 text-blue-700"/>
                           <CardTitle>KPI Library</CardTitle>
                        </div>
                        <Dialog open={showKpiForm} onOpenChange={setShowKpiForm}>
                            <DialogTrigger asChild>
                                <Button onClick={() => setEditingKpi(null)}>
                                    <Plus className="w-4 h-4 mr-2"/> New KPI
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{editingKpi ? 'Edit' : 'Create'} KPI</DialogTitle>
                                </DialogHeader>
                                <KPIForm kpi={editingKpi} onSubmit={handleKpiSubmit} onCancel={() => setShowKpiForm(false)}/>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Job Role</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Weight</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {kpis.map(kpi => (
                                    <TableRow key={kpi.id}>
                                        <TableCell className="font-medium">{kpi.title}</TableCell>
                                        <TableCell>{kpi.job_role}</TableCell>
                                        <TableCell className="capitalize">{kpi.department}</TableCell>
                                        <TableCell>{kpi.weight}%</TableCell>
                                        <TableCell className="flex gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditKpi(kpi)}>
                                                <Edit className="w-4 h-4"/>
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setKpiToDelete(kpi)}>
                                                <Trash2 className="w-4 h-4"/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <AlertDialog open={!!kpiToDelete} onOpenChange={() => setKpiToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the KPI "{kpiToDelete?.title}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteKpi}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}