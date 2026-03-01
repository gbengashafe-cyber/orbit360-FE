import React, { useState, useEffect } from 'react';
import { JobPosting } from '@/api/entities';
import PublicApplicationForm from '../components/recruitment/PublicApplicationForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, DollarSign, Clock, Building } from 'lucide-react';
import Logo from '../components/Logo';

export default function PublicJobView() {
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const jobId = urlParams.get('id');

        if (jobId) {
            loadJob(jobId);
        } else {
            setError('No job ID provided.');
            setLoading(false);
        }
    }, []);

    const loadJob = async (id) => {
        try {
            const jobData = await JobPosting.get(id);
            if (jobData && jobData.status === 'active') {
                setJob(jobData);
            } else {
                setError('This job posting is not currently active or does not exist.');
            }
        } catch (err) {
            console.error('Error fetching job posting:', err);
            setError('Could not load the job posting. It may have been removed.');
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-red-600">Job Not Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-700">{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-10">
                    <Logo size="large" />
                    <h1 className="text-4xl font-extrabold text-gray-900 mt-4">Join Our Team</h1>
                    <p className="mt-2 text-lg text-gray-600">We are looking for talented individuals to grow with us.</p>
                </header>

                <Card className="bg-white shadow-2xl rounded-2xl overflow-hidden">
                    <CardHeader className="p-8 bg-gradient-to-r from-blue-700 to-blue-800 text-white">
                        <Badge variant="secondary" className="bg-white text-blue-800 mb-2">{job.department.charAt(0).toUpperCase() + job.department.slice(1)}</Badge>
                        <CardTitle className="text-3xl font-bold">{job.title}</CardTitle>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-blue-100">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                <span>{job.location || 'Not specified'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                <span>{job.employment_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-3">Job Description</h2>
                                <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
                            </div>
                             <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-3">Key Responsibilities</h2>
                                <p className="text-gray-700 whitespace-pre-wrap">{job.responsibilities}</p>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-3">Requirements</h2>
                                <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
                            </div>
                        </div>
                        <div className="md:col-span-1 space-y-6">
                             <Card className="bg-gray-50/70 border">
                                <CardHeader>
                                    <CardTitle className="text-lg">Salary Range</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {job.salary_range_min && job.salary_range_max ? (
                                        <p className="text-lg font-semibold text-green-700">
                                            ₦{job.salary_range_min.toLocaleString()} - ₦{job.salary_range_max.toLocaleString()}
                                        </p>
                                    ) : (
                                        <p className="text-gray-600">Not Disclosed</p>
                                    )}
                                </CardContent>
                            </Card>
                            <Card className="bg-gray-50/70 border">
                                <CardHeader>
                                    <CardTitle className="text-lg">Application Deadline</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600">
                                        {job.application_deadline ? new Date(job.application_deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Open until filled'}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-12">
                    <PublicApplicationForm job={job} />
                </div>
            </div>
        </div>
    );
}