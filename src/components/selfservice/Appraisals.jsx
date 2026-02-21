
import React, { useState, useEffect, useCallback } from 'react';
import { Appraisal, AppraisalCycle, KPI, AppraisalKPI, Employee, User } from '@/api/entities';
import { appraisalService } from '@/api/appraisal.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Users, Star } from 'lucide-react';

const AppraisalForm = ({ appraisal, appraisalKPIs, onUpdate, employee, currentUser, isSupervisorView }) => {
    const [kpiData, setKpiData] = useState(appraisalKPIs);
    const [overallComments, setOverallComments] = useState(isSupervisorView ? appraisal.supervisor_overall_comments : appraisal.employee_overall_comments);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRatingChange = (id, rating) => {
        setKpiData(kpiData.map(kpi => kpi.id === id ? { ...kpi, [isSupervisorView ? 'supervisor_rating' : 'employee_rating']: parseInt(rating) } : kpi));
    };

    const handleCommentChange = (id, comment) => {
        setKpiData(kpiData.map(kpi => kpi.id === id ? { ...kpi, [isSupervisorView ? 'supervisor_comment' : 'employee_comment']: comment } : kpi));
    };

    const calculateWeightedScore = () => {
        const field = isSupervisorView ? 'supervisor_rating' : 'employee_rating';
        const totalScore = kpiData.reduce((acc, kpi) => {
            const rating = kpi[field] || 0;
            const weight = kpi.kpi_weight || 0;
            return acc + (rating * (weight / 100));
        }, 0);
        return (totalScore / 5 * 100).toFixed(2);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Update all KPIs
            const kpiUpdatePromises = kpiData.map(kpi =>
                appraisalService.updateAppraisalKPI(appraisal.id, kpi.id, kpi)
                    .catch(err => console.warn(`Could not update KPI ${kpi.id}:`, err))
            );
            await Promise.all(kpiUpdatePromises);

            const isCompleting = isSupervisorView && appraisal.status === 'pending_supervisor_review';
            const newStatus = isSupervisorView ? 'completed' : 'pending_supervisor_review';
            const totalScore = isCompleting ? parseFloat(calculateWeightedScore()) : appraisal.total_score;

            // Prepare update data
            const updateData = {
                status: newStatus,
                total_score: totalScore,
                [isSupervisorView ? 'supervisor_overall_comments' : 'employee_overall_comments']: overallComments,
                [isSupervisorView ? 'supervisor_approval_date' : 'submission_date']: new Date().toISOString(),
            };

            // Update appraisal status and comments via API
            await appraisalService.updateAppraisal(appraisal.id, updateData);

            onUpdate();
        } catch (error) {
            console.error("Error submitting appraisal:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const canEdit = (isSupervisorView && appraisal.status === 'pending_supervisor_review') || (!isSupervisorView && appraisal.status === 'pending_self_assessment');

    return (
        <div className="space-y-6">
            {kpiData.map(kpi => (
                <Card key={kpi.id}>
                    <CardHeader>
                        <CardTitle className="text-lg">{kpi.kpi_title} <span className="text-sm font-normal text-gray-500">- {kpi.kpi_weight}%</span></CardTitle>
                        <p className="text-sm text-gray-600">{kpi.kpi_description}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Employee Section */}
                        <div>
                            <h4 className="font-semibold text-gray-800">Employee Self-Assessment</h4>
                            <div className="grid grid-cols-5 gap-4 mt-2">
                                <div className="col-span-1">
                                    <label className="text-sm font-medium">Rating (1-5)</label>
                                    <Select value={kpi.employee_rating} onValueChange={(val) => handleRatingChange(kpi.id, val)} disabled={isSupervisorView || !canEdit}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{[1, 2, 3, 4, 5].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-4">
                                    <label className="text-sm font-medium">Comment</label>
                                    <Textarea value={kpi.employee_comment} onChange={(e) => handleCommentChange(kpi.id, e.target.value)} disabled={isSupervisorView || !canEdit} />
                                </div>
                            </div>
                        </div>

                        {/* Supervisor Section */}
                        {appraisal.status !== 'pending_self_assessment' && (
                            <div>
                                <h4 className="font-semibold text-gray-800">Supervisor Assessment</h4>
                                <div className="grid grid-cols-5 gap-4 mt-2">
                                    <div className="col-span-1">
                                        <label className="text-sm font-medium">Rating (1-5)</label>
                                        <Select value={kpi.supervisor_rating} onValueChange={(val) => handleRatingChange(kpi.id, val)} disabled={!isSupervisorView || !canEdit}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>{[1, 2, 3, 4, 5].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-4">
                                        <label className="text-sm font-medium">Comment</label>
                                        <Textarea value={kpi.supervisor_comment} onChange={(e) => handleCommentChange(kpi.id, e.target.value)} disabled={!isSupervisorView || !canEdit} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}

            {/* Overall Comments */}
            <Card>
                <CardHeader><CardTitle>Overall Comments</CardTitle></CardHeader>
                <CardContent>
                    <Textarea value={overallComments} onChange={(e) => setOverallComments(e.target.value)} rows={5} disabled={!canEdit} />
                </CardContent>
            </Card>

            {/* Final Score */}
            <Card>
                <CardHeader><CardTitle>Performance Score</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold text-blue-700">{calculateWeightedScore()}%</p>
                    <p className="text-sm text-gray-500">Based on {isSupervisorView ? 'supervisor' : 'your'} ratings.</p>
                </CardContent>
            </Card>

            {canEdit && <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Submit {isSupervisorView ? 'Final Appraisal' : 'to Supervisor'}</Button>}
        </div>
    );
};


export default function AppraisalsComponent({ employee, currentUser, onUpdate, isSupervisor, isHrAdmin, directReports }) {
    const [appraisals, setAppraisals] = useState([]);
    const [activeCycles, setActiveCycles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppraisalId, setSelectedAppraisalId] = useState(null);
    const [appraisalKPIs, setAppraisalKPIs] = useState([]);
    const [activeTab, setActiveTab] = useState('my_appraisal');
    const [teamAppraisals, setTeamAppraisals] = useState([]);

    const loadData = useCallback(async () => {
        if (!employee?.id) return;
        setLoading(true);
        try {
            // Fetch appraisals for current employee
            const appraisalResponse = await appraisalService.filterAppraisals({ employee_id: employee.id });
            const appraisalData = appraisalResponse.data || appraisalResponse;

            // Fetch active appraisal cycles
            const cycleResponse = await appraisalService.filterAppraisalCycles({ status: 'active' });
            const cycleData = cycleResponse.data || cycleResponse;

            setAppraisals(Array.isArray(appraisalData) ? appraisalData : []);
            setActiveCycles(Array.isArray(cycleData) ? cycleData : []);

            // Fetch team appraisals if user is supervisor
            if (isSupervisor) {
                const reportIds = directReports.map(r => r.id);
                if (reportIds.length > 0) {
                    const teamResponse = await appraisalService.filterAppraisals({
                        employee_id: reportIds.join(',')
                    });
                    const teamData = teamResponse.data || teamResponse;
                    setTeamAppraisals(Array.isArray(teamData) ? teamData : []);
                }
            }

        } catch (error) {
            console.error("Error loading appraisal data:", error);
        } finally {
            setLoading(false);
        }
    }, [employee?.id, isSupervisor, directReports]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (selectedAppraisalId) {
            loadKPIsForAppraisal(selectedAppraisalId);
        } else {
            setAppraisalKPIs([]);
        }
    }, [selectedAppraisalId]);

    const loadKPIsForAppraisal = async (appraisalId) => {
        setLoading(true);
        try {
            const response = await appraisalService.getAppraisalKPIs(appraisalId);
            const kpis = response.data || response;
            setAppraisalKPIs(Array.isArray(kpis) ? kpis : []);
        } catch (error) {
            console.error("Error loading appraisal KPIs:", error);
            setAppraisalKPIs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAppraisal = async (cycleId) => {
        setLoading(true);
        try {
            const cycle = activeCycles.find(c => c.id === cycleId);
            const supervisor = await Employee.get(employee.supervisor_id);

            // Prepare appraisal data matching the API contract
            const newAppraisalData = {
                appraisal_cycle_id: cycle.id,
                employee_id: employee.id,
                manager_id: supervisor?.id || null,
                performance_summary: '',
                strengths: '',
                areas_for_improvement: '',
            };

            // Create appraisal via API
            const response = await appraisalService.createAppraisal(newAppraisalData);
            const newAppraisal = response.data || response;

            // Fetch and associate KPI templates
            const kpiResponse = await appraisalService.filterKPIs({
                job_role: employee.position,
                department: employee.department,
                status: 'active'
            });
            const kpiTemplates = Array.isArray(kpiResponse.data) ? kpiResponse.data : kpiResponse;

            // Link KPIs to appraisal (if API supports it)
            if (Array.isArray(kpiTemplates) && kpiTemplates.length > 0) {
                const kpiUpdatePromises = kpiTemplates.map(kpi =>
                    appraisalService.updateAppraisalKPI(newAppraisal.id, kpi.id, {
                        kpi_id: kpi.id,
                        kpi_title: kpi.title,
                        kpi_description: kpi.description,
                        kpi_weight: kpi.weight,
                    }).catch(err => console.warn(`Could not link KPI ${kpi.id}:`, err))
                );
                await Promise.all(kpiUpdatePromises);
            }

            loadData();
            setSelectedAppraisalId(newAppraisal.id);
        } catch (error) {
            console.error("Error creating appraisal:", error);
        } finally {
            setLoading(false);
        }
    };

    const selectedAppraisal = appraisals.find(a => a.id === selectedAppraisalId);
    const isMyPortal = currentUser.email === employee.email;
    const isSupervisorView = !isMyPortal && (isSupervisor || isHrAdmin);

    const getStatusBadge = (status) => {
        const styles = {
            pending_self_assessment: 'bg-yellow-100 text-yellow-800',
            pending_supervisor_review: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
        };
        return styles[status] || 'bg-gray-100 text-gray-800';
    };

    const renderAppraisalList = (appraisalList, title) => (
        <Card>
            <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {appraisalList.map(appraisal => (
                        <div key={appraisal.id} className="p-3 border rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{appraisal.cycle_name} {appraisal.employee_name && ` - ${appraisal.employee_name}`}</p>
                                <Badge className={getStatusBadge(appraisal.status)}>{appraisal.status.replace(/_/g, ' ')}</Badge>
                            </div>
                            <Button variant="outline" onClick={() => setSelectedAppraisalId(appraisal.id)}>View</Button>
                        </div>
                    ))}
                    {appraisalList.length === 0 && <p className="text-gray-500">No appraisals found.</p>}
                </div>
            </CardContent>
        </Card>
    );

    if (loading) {
        return <div className="text-center p-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-700" /></div>;
    }

    if (selectedAppraisal && appraisalKPIs.length > 0) {
        return (
            <div>
                <Button variant="outline" onClick={() => setSelectedAppraisalId(null)} className="mb-4">← Back to List</Button>
                <AppraisalForm
                    appraisal={selectedAppraisal}
                    appraisalKPIs={appraisalKPIs}
                    onUpdate={() => { setSelectedAppraisalId(null); loadData(); }}
                    employee={employee}
                    currentUser={currentUser}
                    isSupervisorView={isSupervisorView}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {isSupervisor && (
                <div className="flex space-x-1 rounded-lg bg-gray-100 p-1">
                    <Button onClick={() => setActiveTab('my_appraisal')} variant={activeTab === 'my_appraisal' ? 'default' : 'ghost'} className="w-full">My Appraisals</Button>
                    <Button onClick={() => setActiveTab('team_appraisals')} variant={activeTab === 'team_appraisals' ? 'default' : 'ghost'} className="w-full">Team Appraisals</Button>
                </div>
            )}

            {activeTab === 'my_appraisal' && isMyPortal && (
                <Card>
                    <CardHeader><CardTitle>Start New Appraisal</CardTitle></CardHeader>
                    <CardContent>
                        {activeCycles.length > 0 ? (
                            <div className="flex items-center gap-4">
                                <Select onValueChange={handleCreateAppraisal}>
                                    <SelectTrigger className="w-[280px]"><SelectValue placeholder="Select an active appraisal cycle..." /></SelectTrigger>
                                    <SelectContent>
                                        {activeCycles.map(cycle => (
                                            <SelectItem key={cycle.id} value={cycle.id} disabled={appraisals.some(a => a.cycle_id === cycle.id)}>
                                                {cycle.name} {appraisals.some(a => a.cycle_id === cycle.id) && '(Completed)'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <p className="text-gray-500">No active appraisal cycles found.</p>
                        )}
                    </CardContent>
                </Card>
            )}

            {activeTab === 'my_appraisal' && renderAppraisalList(appraisals, 'My Appraisals')}

            {activeTab === 'team_appraisals' && isSupervisor && renderAppraisalList(teamAppraisals, 'My Team\'s Appraisals')}

        </div>
    );
}
