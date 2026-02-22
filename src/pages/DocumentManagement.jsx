
import React, { useState, useEffect, useCallback } from 'react';
import { userService } from '@/api';
import { apiClient, apiRoutes } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Folder, File, Plus, Upload, Loader2, FolderPlus, ArrowLeft, Home, FileText, MoreHorizontal, Globe, Lock, Trash2, Edit } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';


const defaultFolders = [
    "Employee Contracts",
    "Company Policies",
    "Performance Reviews",
    "Onboarding Documents",
    "Memos & Announcements",
    "Templates"
];

const documentTemplates = [
    { name: "Employment Offer Letter Template", type: "contract", folderName: "Templates", content: "This is a dummy employment offer letter template content.", access_level: "public" },
    { name: "Performance Review Form Template", type: "performance_review", folderName: "Templates", content: "This is a dummy performance review form template content.", access_level: "public" },
    { name: "Employee Handbook Template", type: "policy", folderName: "Templates", content: "This is a dummy employee handbook template content.", access_level: "public" },
];

export default function DocumentManagement() {
    const [folders, setFolders] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentFolder, setCurrentFolder] = useState(null); // null is root
    const [showFolderForm, setShowFolderForm] = useState(false);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [uploadData, setUploadData] = useState({ file: null, name: "", document_type: "other", access_level: "private" });
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const initializeDefaultStructure = useCallback(async () => {
        try {
            console.log("[initializeDefaultStructure] Calling backend to initialize default folders...");
            const response = await apiClient.post(apiRoutes.InitializeDocuments, {});
            console.log("[initializeDefaultStructure] Success:", response);
        } catch (error) {
            console.error('[initializeDefaultStructure] Error:', error);
        }
    }, []); // No dependencies for initializeDefaultStructure itself

    const loadData = useCallback(async (isInitialLoad = false) => {
        setLoading(true);
        try {
            const userResponse = await userService.getCurrentUser();
            const user = userResponse?.data || userResponse;
            setCurrentUser(user);
            
            console.log('[DocumentManagement] Current user:', { id: user?.id, email: user?.email, role: user?.role, jobRole: user?.jobRole });

            const foldersRes = await apiClient.get(apiRoutes.GetFolders);
            const documentsRes = await apiClient.get(apiRoutes.GetDocuments);

            const foldersData = foldersRes?.data?.data || foldersRes?.data || [];
            const documentsData = documentsRes?.data?.data || documentsRes?.data || [];

            console.log("Loaded folders:", foldersData.length, foldersData);
            console.log("Loaded documents:", documentsData.length, documentsData);

            if (isInitialLoad && foldersData.length === 0) {
                console.log("No folders found, initializing default structure...");
                await initializeDefaultStructure();
                // Refetch data after initialization
                const newFoldersRes = await apiClient.get(apiRoutes.GetFolders);
                const newDocsRes = await apiClient.get(apiRoutes.GetDocuments);
                
                const newFolders = newFoldersRes?.data?.data || newFoldersRes?.data || [];
                const newDocs = newDocsRes?.data?.data || newDocsRes?.data || [];
                console.log("After init - Folders:", newFolders.length, "Documents:", newDocs.length);
                setFolders(newFolders);
                setDocuments(newDocs);
            } else {
                setFolders(foldersData);
                setDocuments(documentsData);
            }
        } catch (error) {
            const errorMsg = error?.response?.data?.message || error?.message || 'Failed to load document data.';
            console.error("Error loading document data:", error);
            console.error("Error details:", { status: error?.response?.status, data: error?.response?.data });
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [initializeDefaultStructure]); // loadData depends on initializeDefaultStructure

    useEffect(() => {
        loadData(true);
    }, [loadData]); // useEffect depends on the memoized loadData function

    const handleCreateFolder = async () => {
        if (!newFolderName) return;
        try {
            await apiClient.post(apiRoutes.CreateFolder, { name: newFolderName, parent_folder_id: currentFolder });
            setNewFolderName("");
            setShowFolderForm(false);
            loadData();
            setSuccess(`Folder "${newFolderName}" created successfully.`);
        } catch (error) {
            console.error("Error creating folder:", error);
            setError('Failed to create folder.');
        }
    };

    const handleFileUpload = async () => {
        if (!uploadData.file || !uploadData.name) {
            setError("Please provide a document name and select a file.");
            return;
        }
        setError('');
        setSuccess('');
        setIsUploading(true);
        try {
            // Convert file to base64 for upload
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const file_url = e.target.result; // Base64 encoded file
                    const response = await apiClient.post(apiRoutes.CreateDocument, {
                        name: uploadData.name,
                        file_url: file_url,
                        document_type: uploadData.document_type,
                        folder_id: currentFolder,
                        access_level: uploadData.access_level,
                    });

                    const newDoc = response.data || response;
                    setDocuments(prev => [...prev, newDoc]);
                    setShowUploadForm(false);
                    setUploadData({ file: null, name: "", document_type: "other", access_level: "private" });
                    setSuccess(`Document "${newDoc.name}" uploaded successfully.`);
                    setIsUploading(false);
                } catch (error) {
                    console.error("Error uploading file:", error);
                    setError('Failed to upload file.');
                    setIsUploading(false);
                }
            };
            reader.readAsDataURL(uploadData.file);
        } catch (error) {
            console.error("Error uploading file:", error);
            setError('Failed to upload file.');
            setIsUploading(false);
        }
    };

    const handleAccessChange = async (doc, newLevel) => {
        try {
            await apiClient.put(apiRoutes.UpdateDocument(doc.id), { access_level: newLevel });
            setDocuments(prevDocs =>
                prevDocs.map(d => d.id === doc.id ? { ...d, access_level: newLevel } : d)
            );
            setSuccess(`Document status changed to ${newLevel}.`);
        } catch (error) {
            console.error("Error updating document access level:", error);
            setError('Failed to update document status.');
        }
    };

    const handleDeleteDocument = async (docId) => {
        if (window.confirm("Are you sure you want to permanently delete this document?")) {
            try {
                await apiClient.delete(apiRoutes.DeleteDocument(docId));
                setDocuments(prevDocs => prevDocs.filter(d => d.id !== docId));
                setSuccess('Document deleted successfully.');
            } catch (error) {
                console.error("Error deleting document:", error);
                setError('Failed to delete document.');
            }
        }
    };

    const currentFolderName = currentFolder ? folders.find(f => f.id === currentFolder)?.name : 'Root';
    const parentFolderId = currentFolder ? folders.find(f => f.id === currentFolder)?.parent_folder_id : null;

    const displayedFolders = folders.filter(f => f.parent_folder_id === currentFolder);
    const displayedDocuments = documents.filter(d => d.folder_id === currentFolder);

    const canManage = currentUser && (currentUser.role === 'admin' || currentUser.permissions?.includes('MANAGE_DOCUMENTS'));
    const canView = currentUser && (canManage || true); // All authenticated users can view (with filtering applied server-side)

    if (loading) {
        return (
            <div className="p-8 flex justify-center items-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
            </div>
        );
    }

    if (!canView) {
        return (
            <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
                <Alert variant="destructive">
                    <AlertDescription>{error || "Access Denied: You do not have permission to view documents."}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
                        <p className="text-gray-600">
                            {canManage ? 'Securely store and manage HR files and documents.' : 'View HR documents and resources.'}
                        </p>
                    </div>
                    {canManage && (
                    <div className="flex gap-3">
                        <Dialog open={showFolderForm} onOpenChange={setShowFolderForm}>
                            <DialogTrigger asChild>
                                <Button variant="outline"><FolderPlus className="w-4 h-4 mr-2" />Create Folder</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Create New Folder in {currentFolderName}</DialogTitle></DialogHeader>
                                <div className="space-y-4 pt-4">
                                    <Input placeholder="Folder Name" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} />
                                    <Button onClick={handleCreateFolder} className="w-full">Create</Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={showUploadForm} onOpenChange={setShowUploadForm}>
                            <DialogTrigger asChild>
                                <Button><Upload className="w-4 h-4 mr-2" />Upload Document</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Upload to {currentFolderName}</DialogTitle></DialogHeader>
                                <div className="space-y-4 pt-4">
                                    <Input placeholder="Document Name" value={uploadData.name} onChange={e => setUploadData({ ...uploadData, name: e.target.value })} />
                                    <Input type="file" onChange={e => {
                                        setUploadData({ ...uploadData, file: e.target.files[0] });
                                        if (!uploadData.name && e.target.files[0]) {
                                            setUploadData(prev => ({ ...prev, name: e.target.files[0].name.replace(/\.[^/.]+$/, "") }));
                                        }
                                    }} />
                                    <Select value={uploadData.document_type} onValueChange={val => setUploadData({ ...uploadData, document_type: val })}>
                                        <SelectTrigger><SelectValue placeholder="Select Document Type..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="contract">Contract</SelectItem>
                                            <SelectItem value="policy">Policy</SelectItem>
                                            <SelectItem value="memo">Memo</SelectItem>
                                            <SelectItem value="performance_review">Performance Review</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={uploadData.access_level} onValueChange={val => setUploadData({ ...uploadData, access_level: val })}>
                                        <SelectTrigger><SelectValue placeholder="Select Access Level..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="private">Private (HR Only)</SelectItem>
                                            <SelectItem value="public">Public (All Employees)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={handleFileUpload} disabled={isUploading} className="w-full">
                                        {isUploading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                        Upload
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                    )}
                </div>

                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                {success && <Alert className="border-green-500 text-green-700"><AlertDescription>{success}</AlertDescription></Alert>}

                <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            {currentFolder && (
                                <Button variant="ghost" size="icon" onClick={() => setCurrentFolder(parentFolderId)}><ArrowLeft className="w-4 h-4" /></Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => setCurrentFolder(null)}><Home className="w-4 h-4" /></Button>
                            <CardTitle>Current Folder: {currentFolderName}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center p-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-700" /></div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {displayedFolders.map(folder => (
                                    <div key={folder.id} onClick={() => setCurrentFolder(folder.id)} className="p-4 border rounded-lg text-center cursor-pointer hover:bg-gray-50 flex flex-col items-center justify-center transition-all hover:shadow-lg hover:-translate-y-1 h-40">
                                        <Folder className="w-12 h-12 text-yellow-500 mb-2" />
                                        <span className="text-sm font-medium break-words w-full">{folder.name}</span>
                                    </div>
                                ))}
                                {displayedDocuments.map(doc => (
                                    <div key={doc.id} className="relative group p-4 border rounded-lg text-center flex flex-col items-center justify-between transition-all hover:shadow-lg h-40">
                                        {canManage && (
                                        <div className="absolute top-1 right-1">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="w-7 h-7">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {doc.access_level === 'private' ? (
                                                        <DropdownMenuItem onClick={() => handleAccessChange(doc, 'public')}>
                                                            <Globe className="w-4 h-4 mr-2" /> Make Public
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem onClick={() => handleAccessChange(doc, 'private')}>
                                                            <Lock className="w-4 h-4 mr-2" /> Make Private
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleDeleteDocument(doc.id)} className="text-red-500">
                                                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        )}
                                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center cursor-pointer w-full mt-4">
                                            {doc.name.toLowerCase().includes("template") || (doc.folder_id && folders.find(f => f.id === doc.folder_id)?.name === "Templates") ? (
                                                <FileText className="w-12 h-12 text-purple-500 mb-2" />
                                            ) : (
                                                <File className="w-12 h-12 text-blue-500 mb-2" />
                                            )}
                                            <span className="text-sm font-medium break-words w-full">{doc.name}</span>
                                        </a>
                                        <div className="mt-auto flex items-center gap-2">
                                            {doc.access_level === 'public' ? (
                                                <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">
                                                    <Globe className="w-3 h-3 mr-1" /> Public
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-red-700 bg-red-50 border-red-200">
                                                    <Lock className="w-3 h-3 mr-1" /> Private
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {!loading && displayedFolders.length === 0 && displayedDocuments.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <Folder className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p>This folder is empty.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
