import React, { useState } from 'react';
import { JobApplication } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Send, CheckCircle, AlertTriangle } from 'lucide-react';

export default function PublicApplicationForm({ job }) {
    const [formData, setFormData] = useState({
        applicant_name: '',
        applicant_email: '',
        applicant_phone: '',
        cover_letter: '',
    });
    const [resumeFile, setResumeFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!resumeFile) {
            setError('A resume/CV is required to apply.');
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const uploadResult = await UploadFile({ file: resumeFile });
            const resume_url = uploadResult.file_url;

            await JobApplication.create({
                ...formData,
                job_posting_id: job.id,
                resume_url,
                status: 'submitted',
            });

            setSuccess(true);
        } catch (err) {
            console.error('Application submission failed:', err);
            setError('There was a problem submitting your application. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Card className="text-center shadow-lg border-green-200">
                <CardContent className="p-8">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800">Application Submitted!</h2>
                    <p className="mt-2 text-gray-600">Thank you for your interest. We have received your application and will be in touch if your qualifications match our needs.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl font-bold">Apply for this Position</CardTitle>
                <CardDescription>Fill out the form below to submit your application.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="applicant_name">Full Name *</Label>
                            <Input id="applicant_name" value={formData.applicant_name} onChange={e => handleInputChange('applicant_name', e.target.value)} required placeholder="John Doe" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="applicant_email">Email Address *</Label>
                            <Input id="applicant_email" type="email" value={formData.applicant_email} onChange={e => handleInputChange('applicant_email', e.target.value)} required placeholder="you@example.com" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="applicant_phone">Phone Number</Label>
                        <Input id="applicant_phone" type="tel" value={formData.applicant_phone} onChange={e => handleInputChange('applicant_phone', e.target.value)} placeholder="+1 (555) 123-4567" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cover_letter">Cover Letter (Optional)</Label>
                        <Textarea id="cover_letter" value={formData.cover_letter} onChange={e => handleInputChange('cover_letter', e.target.value)} rows={5} placeholder="Tell us why you're a great fit for this role..." />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="resume">Resume/CV *</Label>
                        <Input id="resume" type="file" onChange={e => setResumeFile(e.target.files[0])} required accept=".pdf,.doc,.docx" />
                        <p className="text-xs text-gray-500">PDF, DOC, or DOCX files are accepted.</p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-blue-700 hover:bg-blue-800 text-white shadow-md">
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                            {loading ? 'Submitting...' : 'Submit Application'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}