
import React, { useState, useEffect, useCallback } from 'react';
import { showToast } from '@/utils/toast';
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
    const [activeTab, setActiveTab] = useState('documents'); // 'documents' or 'pending-deletions'
    const [pendingDeletions, setPendingDeletions] = useState([]);
    const [loadingDeletions, setLoadingDeletions] = useState(false);
    const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({ open: false, itemId: null, itemName: '', itemType: 'document' });
    const [approvalDialog, setApprovalDialog] = useState({ open: false, deletionId: null, action: null });

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
            let documentsData = documentsRes?.data?.data || documentsRes?.data || [];

            console.log("Loaded folders:", foldersData.length, foldersData);
            console.log("Loaded documents (raw):", documentsData.length, documentsData);
            
            // Ensure each document has a proper id field
            documentsData = documentsData.map((doc, idx) => ({
                ...doc,
                id: doc.id || doc._id || `doc_${idx}`
            }));

            if (isInitialLoad && foldersData.length === 0) {
                console.log("No folders found, initializing default structure...");
                await initializeDefaultStructure();
                // Refetch data after initialization
                const newFoldersRes = await apiClient.get(apiRoutes.GetFolders);
                const newDocsRes = await apiClient.get(apiRoutes.GetDocuments);
                
                const newFolders = newFoldersRes?.data?.data || newFoldersRes?.data || [];
                let newDocs = newDocsRes?.data?.data || newDocsRes?.data || [];
                
                // Ensure each document has a proper id field
                newDocs = newDocs.map((doc, idx) => ({
                    ...doc,
                    id: doc.id || doc._id || `doc_${idx}`
                }));
                
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
            showToast.error(errorMsg);
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
            showToast.success(`Folder "${newFolderName}" created successfully.`);
        } catch (error) {
            console.error("Error creating folder:", error);
            showToast.error('Failed to create folder.');
        }
    };

    const handleFileUpload = async () => {
        if (!uploadData.file || !uploadData.name) {
            showToast.error("Please provide a document name and select a file.");
            return;
        }
        setIsUploading(true);
        try {
            // Create FormData for multipart upload
            const formData = new FormData();
            formData.append('name', uploadData.name);
            formData.append('document_type', uploadData.document_type);
            formData.append('access_level', uploadData.access_level);
            if (currentFolder) {
                formData.append('folder_id', currentFolder);
            }
            // Append file with field name 'file' (multer will use this)
            formData.append('file', uploadData.file);

            const response = await apiClient.post(apiRoutes.CreateDocument, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const newDoc = response.data?.data || response.data || response;
            setDocuments(prev => [...prev, newDoc]);
            setShowUploadForm(false);
            setUploadData({ file: null, name: "", document_type: "other", access_level: "private" });
            showToast.success(`Document "${newDoc.name}" uploaded successfully.`);
            setIsUploading(false);
        } catch (error) {
            console.error("Error uploading file:", error);
            showToast.error(error?.response?.data?.message || 'Failed to upload file.');
            setIsUploading(false);
        }
    };

    const handleAccessChange = async (doc, newLevel) => {
        // Skip for onboarding documents (they are read-only)
        if (doc.source === 'onboarding' || String(doc.id).startsWith('onboarding_')) {
            showToast.error('Onboarding documents are read-only and cannot be modified.');
            return;
        }

        try {
            console.log("Updating document:", { docId: doc.id, docName: doc.name, newLevel });
            const response = await apiClient.put(apiRoutes.UpdateDocument(doc.id), { access_level: newLevel });
            console.log("Update response:", response);
            
            setDocuments(prevDocs =>
                prevDocs.map(d => d.id === doc.id ? { ...d, access_level: newLevel } : d)
            );
            showToast.success(`Document status changed to ${newLevel}.`);
        } catch (error) {
            console.error("Error updating document access level:", error);
            console.error("Document object:", doc);
            showToast.error(error?.response?.data?.message || 'Failed to update document status.');
        }
    };

    const handleDeleteDocument = (docId) => {
        const doc = documents.find(d => d.id === docId);
        const docName = doc?.name || 'Document';
        setDeleteConfirmDialog({
            open: true,
            itemId: docId,
            itemName: docName,
            itemType: 'document'
        });
    };

    const handleConfirmDelete = async () => {
        const { itemId, itemType } = deleteConfirmDialog;
        
        // Check if item already has a pending deletion request
        const hasPendingDeletion = pendingDeletions.some(deletion => deletion.itemId === itemId);
        
        if (hasPendingDeletion) {
            showToast.error(`This ${itemType} already has a pending deletion request awaiting approval.`);
            setDeleteConfirmDialog({ open: false, itemId: null, itemName: '', itemType: 'document' });
            return;
        }
        
        try {
            if (itemType === 'document') {
                await apiClient.delete(apiRoutes.DeleteDocument(itemId), {
                    data: { requesterComment: '' }
                });
            } else if (itemType === 'folder') {
                await apiClient.delete(apiRoutes.DeleteFolder(itemId), {
                    data: { requesterComment: '' }
                });
            }
            showToast.success(`Deletion request for "${deleteConfirmDialog.itemName}" has been submitted to your HR manager for approval.`);
            setDeleteConfirmDialog({ open: false, itemId: null, itemName: '', itemType: 'document' });
        } catch (error) {
            console.error(`Error requesting ${itemType} deletion:`, error);
            
            // Handle 409 Conflict - pending deletion already exists
            if (error?.response?.status === 409) {
                showToast.error(`This ${itemType} has a pending deletion approval. Please wait for the approval decision.`);
            } else {
                const errorMsg = error?.response?.data?.message || `Failed to submit ${itemType} deletion request.`;
                showToast.error(errorMsg);
            }
        } finally {
            setDeleteConfirmDialog({ open: false, itemId: null, itemName: '', itemType: 'document' });
        }
    };

    const currentFolderName = currentFolder ? folders.find(f => f.id === currentFolder)?.name : 'Root';
    const parentFolderId = currentFolder ? folders.find(f => f.id === currentFolder)?.parent_folder_id : null;

    const displayedFolders = folders.filter(f => f.parent_folder_id === currentFolder);
    const displayedDocuments = documents.filter(d => d.folder_id === currentFolder);

    const canManage = currentUser && (currentUser.role === 'admin' || currentUser.permissions?.includes('MANAGE_DOCUMENTS'));
    const canApproveDeletions = currentUser && (currentUser.role === 'admin' || currentUser.permissions?.includes('APPROVE_DOCUMENT_DELETION'));
    const canView = currentUser && (canManage || true); // All authenticated users can view (with filtering applied server-side)

    const loadPendingDeletions = useCallback(async () => {
        console.log('[loadPendingDeletions] Called, canApproveDeletions:', canApproveDeletions);
        if (!canApproveDeletions) {
            console.log('[loadPendingDeletions] No approval permissions, returning early');
            return;
        }
        
        setLoadingDeletions(true);
        try {
            console.log('[loadPendingDeletions] Fetching from:', apiRoutes.hrDocumentDeletionRequests.pending);
            const response = await apiClient.get(`${apiRoutes.hrDocumentDeletionRequests.pending}?page=1&rows=50`);
            console.log('[loadPendingDeletions] Response:', response);
            const deletions = response?.data || [];
            console.log('[loadPendingDeletions] Deletions:', deletions);
            setPendingDeletions(deletions);
        } catch (error) {
            console.error('Error loading pending deletions:', error);
            showToast.error('Failed to load pending deletion requests.');
        } finally {
            setLoadingDeletions(false);
        }
    }, [canApproveDeletions]);

    // Helper function to check if item has pending deletion
    const hasPendingDeletion = (itemId) => {
        return pendingDeletions.some(deletion => deletion.itemId === itemId);
    };

    const handleApproveDeletion = (deletionId) => {
        setApprovalDialog({ open: true, deletionId, action: 'approve' });
    };

    const handleRejectDeletion = (deletionId) => {
        setApprovalDialog({ open: true, deletionId, action: 'reject' });
    };

    const handleConfirmApprovalAction = async () => {
        const { deletionId, action } = approvalDialog;
        
        try {
            const url = action === 'approve' 
                ? apiRoutes.hrDocumentDeletionRequests.approve(deletionId)
                : apiRoutes.hrDocumentDeletionRequests.reject(deletionId);
            
            await apiClient.post(url, {
                reviewerComment: ''
            });
            
            const message = action === 'approve' 
                ? 'Deletion request approved and document/folder deleted.'
                : 'Deletion request rejected.';
            
            showToast.success(message);
            // Refresh both pending deletions and documents lists
            await loadPendingDeletions();
            await loadData(); // Refresh documents to reflect deletion
            setApprovalDialog({ open: false, deletionId: null, action: null });
        } catch (error) {
            console.error(`Error ${approvalDialog.action}ing deletion:`, error);
            showToast.error(`Failed to ${approvalDialog.action} deletion request.`);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex justify-center items-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
            </div>
        );
    }

    // Delete confirmation dialog
    const DeleteConfirmationDialog = () => (
        <Dialog open={deleteConfirmDialog.open} onOpenChange={(open) => !open && setDeleteConfirmDialog({ ...deleteConfirmDialog, open: false })}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Deletion Request</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <p className="text-gray-700">
                        Are you sure you want to delete <span className="font-semibold">"{deleteConfirmDialog.itemName}"</span>? 
                        <br />
                        <span className="text-sm text-gray-600">An HR manager will review and approve this deletion request.</span>
                    </p>
                    <div className="flex gap-3 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteConfirmDialog({ open: false, itemId: null, itemName: '', itemType: 'document' })}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700"
                            onClick={handleConfirmDelete}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );

    // Approval action dialog (for HR managers approving/rejecting deletions)
    const ApprovalActionDialog = () => (
        <Dialog open={approvalDialog.open} onOpenChange={(open) => !open && setApprovalDialog({ open: false, deletionId: null, action: null })}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {approvalDialog.action === 'approve' ? 'Approve Deletion Request' : 'Reject Deletion Request'}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <p className="text-gray-700">
                        {approvalDialog.action === 'approve' 
                            ? 'This will permanently delete the document/folder. This action cannot be undone.'
                            : 'The deletion request will be rejected and the document/folder will remain intact.'}
                    </p>
                    <div className="flex gap-3 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setApprovalDialog({ open: false, deletionId: null, action: null })}
                        >
                            Cancel
                        </Button>
                        <Button
                            className={approvalDialog.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                            onClick={handleConfirmApprovalAction}
                        >
                            {approvalDialog.action === 'approve' ? 'Approve' : 'Reject'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );

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
                        {canApproveDeletions && (
                            <div className="flex gap-4 mt-4">
                                <Button
                                    variant={activeTab === 'documents' ? 'default' : 'outline'}
                                    onClick={() => setActiveTab('documents')}
                                >
                                    Documents
                                </Button>
                                <Button
                                    variant={activeTab === 'pending-deletions' ? 'default' : 'outline'}
                                    onClick={() => {
                                        setActiveTab('pending-deletions');
                                        loadPendingDeletions();
                                    }}
                                >
                                    Pending Deletions ({pendingDeletions.length})
                                </Button>
                            </div>
                        )}
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

                <DeleteConfirmationDialog />
                <ApprovalActionDialog />

                {activeTab === 'documents' ? (
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
                                {displayedFolders.map(folder => {
                                     const isDefaultFolder = defaultFolders.includes(folder.name);
                                     const isPending = hasPendingDeletion(folder.id);
                                     
                                     return (
                                     <div key={folder.id} className={`relative group p-4 border rounded-lg text-center flex flex-col items-center justify-center transition-all h-40 ${isPending ? 'opacity-50 bg-gray-100 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50 hover:shadow-lg hover:-translate-y-1'}`}>
                                         {isPending && (
                                         <div className="absolute top-2 left-2 z-10">
                                             <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                                 Pending Deletion
                                             </Badge>
                                         </div>
                                         )}
                                         {canManage && !isDefaultFolder && !isPending && (
                                         <div className="absolute top-1 right-1 z-10">
                                             <DropdownMenu>
                                                 <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                     <Button variant="ghost" size="icon" className="w-7 h-7">
                                                         <MoreHorizontal className="w-4 h-4" />
                                                     </Button>
                                                 </DropdownMenuTrigger>
                                                 <DropdownMenuContent align="end">
                                                     <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteConfirmDialog({ open: true, itemId: folder.id, itemName: folder.name, itemType: 'folder' }); }} className="text-red-500">
                                                         <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                     </DropdownMenuItem>
                                                 </DropdownMenuContent>
                                             </DropdownMenu>
                                         </div>
                                         )}
                                         <div onClick={() => !isPending && setCurrentFolder(folder.id)} className="flex flex-col items-center justify-center w-full">
                                             <Folder className="w-12 h-12 text-yellow-500 mb-2" />
                                             <span className="text-sm font-medium break-words w-full">{folder.name}</span>
                                         </div>
                                     </div>
                                     );
                                 })}
                                {displayedDocuments.map(doc => {
                                     const isOnboardingDoc = doc.source === 'onboarding' || String(doc.id).startsWith('onboarding_');
                                     const isPending = hasPendingDeletion(doc.id);
                                     
                                     return (
                                     <div key={doc.id} className={`relative group p-4 border rounded-lg text-center flex flex-col items-center justify-between transition-all h-40 ${isPending ? 'opacity-50 bg-gray-100' : 'hover:shadow-lg'}`}>
                                         {isPending && (
                                         <div className="absolute top-2 left-2 z-10">
                                             <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                                 Pending Deletion
                                             </Badge>
                                         </div>
                                         )}
                                         {canManage && !isOnboardingDoc && !isPending && (
                                         <div className="absolute top-1 right-1 z-20">
                                             <DropdownMenu>
                                                 <DropdownMenuTrigger asChild>
                                                     <Button variant="ghost" size="icon" className="w-7 h-7">
                                                         <MoreHorizontal className="w-4 h-4" />
                                                     </Button>
                                                 </DropdownMenuTrigger>
                                                 <DropdownMenuContent align="end" className="z-50">
                                                     {doc.access_level === 'private' || !doc.access_level ? (
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
                                         <a href={!isPending ? doc.file_url : '#'} target={!isPending ? '_blank' : undefined} rel="noopener noreferrer" className={`flex flex-col items-center justify-center w-full mt-4 ${isPending ? 'cursor-not-allowed' : 'cursor-pointer'}`} onClick={(e) => isPending && e.preventDefault()}>
                                             {doc.name.toLowerCase().includes("template") || (doc.folder_id && folders.find(f => f.id === doc.folder_id)?.name === "Templates") ? (
                                                 <FileText className="w-12 h-12 text-purple-500 mb-2" />
                                             ) : (
                                                 <File className="w-12 h-12 text-blue-500 mb-2" />
                                             )}
                                             <span className="text-sm font-medium break-words w-full">{doc.name}</span>
                                         </a>
                                         <div className="mt-auto flex items-center gap-2">
                                             {isPending ? (
                                                 <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                                     Pending Deletion
                                                 </Badge>
                                             ) : doc.access_level === 'public' ? (
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
                                     );
                                 })}
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
                ) : (
                <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
                    <CardHeader>
                        <CardTitle>Pending Deletion Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loadingDeletions ? (
                            <div className="text-center p-12">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-700" />
                            </div>
                        ) : pendingDeletions.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <File className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p>No pending deletion requests.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingDeletions.map((deletion) => (
                                    <div key={deletion.id} className="border rounded-lg p-4 flex justify-between items-center bg-gray-50">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">{deletion.itemName}</h3>
                                            <p className="text-sm text-gray-600">
                                                Type: <span className="font-medium">{deletion.deletionType}</span>
                                                {' '} • Requested by: <span className="font-medium">{deletion.requester ? `${deletion.requester.firstName} ${deletion.requester.lastName}` : `User #${deletion.requestedBy}`}</span>
                                            </p>
                                            {deletion.requesterComment && (
                                                <p className="text-sm text-gray-700 mt-2 italic">
                                                    Reason: {deletion.requesterComment}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => handleApproveDeletion(deletion.id)}
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-red-200 text-red-600 hover:bg-red-50"
                                                onClick={() => handleRejectDeletion(deletion.id)}
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
                )}
            </div>
        </div>
    );
}
