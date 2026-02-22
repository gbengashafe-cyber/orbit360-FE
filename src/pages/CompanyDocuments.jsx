import React, { useState, useEffect } from 'react';
import { apiClient, apiRoutes } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Folder, File, ArrowLeft, Home, FileText, Loader2, FileBox, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CompanyDocuments() {
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentFolder, setCurrentFolder] = useState(null); // null is root

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const foldersRes = await apiClient.get(apiRoutes.GetFolders);
      const docsRes = await apiClient.get(apiRoutes.GetDocuments);

      // Handle nested data structure from API response
      const foldersData = foldersRes?.data?.data || foldersRes?.data || [];
      const docsData = docsRes?.data?.data || docsRes?.data || [];

      setFolders(Array.isArray(foldersData) ? foldersData : []);
      setDocuments(Array.isArray(docsData) ? docsData : []);
    } catch (error) {
      console.error('Error loading company document data:', error);
      setError('Failed to load documents. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const currentFolderName = currentFolder 
    ? folders.find(f => f.id === currentFolder)?.name 
    : 'Root';
  const parentFolderId = currentFolder 
    ? folders.find(f => f.id === currentFolder)?.parent_folder_id 
    : null;

  const displayedFolders = folders.filter(f => f.parent_folder_id === currentFolder);
  const displayedDocuments = documents.filter(d => d.folder_id === currentFolder);

  const handleDownload = (doc) => {
    if (doc.file_url.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = doc.file_url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(doc.file_url, '_blank');
    }
  };

  const getDocumentIcon = (docType) => {
    const icons = {
      contract: '📋',
      policy: '📖',
      memo: '📝',
      performance_review: '⭐',
      other: '📄',
    };
    return icons[docType] || '📄';
  };

  const getDocumentBadgeColor = (docType) => {
    const colors = {
      contract: 'bg-blue-100 text-blue-800',
      policy: 'bg-green-100 text-green-800',
      memo: 'bg-yellow-100 text-yellow-800',
      performance_review: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[docType] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
            <FileBox className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Document Hub</h1>
            <p className="text-gray-600">Access public company policies, handbooks, and documents.</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Navigation */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              {currentFolder && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setCurrentFolder(parentFolderId)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setCurrentFolder(null)}
              >
                <Home className="w-4 h-4" />
              </Button>
              <CardTitle>Current Folder: {currentFolderName}</CardTitle>
            </div>
          </CardHeader>
        </Card>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : displayedFolders.length === 0 && displayedDocuments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">This folder is empty</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Folders */}
            {displayedFolders.map(folder => (
              <Card 
                key={folder.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setCurrentFolder(folder.id)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <Folder className="w-8 h-8 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{folder.name}</p>
                    <p className="text-sm text-gray-500">Folder</p>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Documents */}
            {displayedDocuments.map(doc => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl flex-shrink-0">
                      {getDocumentIcon(doc.document_type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p 
                        className="font-medium text-gray-900 truncate" 
                        title={doc.name}
                      >
                        {doc.name}
                      </p>
                      <Badge className={`${getDocumentBadgeColor(doc.document_type)} text-xs mt-1`}>
                        {doc.document_type}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDownload(doc)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
