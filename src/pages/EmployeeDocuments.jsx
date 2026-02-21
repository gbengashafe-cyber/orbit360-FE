import React, { useState, useEffect } from 'react';
import { apiClient, apiRoutes } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Folder, File, Download, Search, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function EmployeeDocuments() {
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentFolder, setCurrentFolder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'Root' }]);

  useEffect(() => {
    loadFolders();
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [currentFolder, searchQuery]);

  const loadFolders = async () => {
    try {
      const response = await apiClient.get(`${apiRoutes.GetFolders}?parent_id=${currentFolder || ''}`);
      const foldersData = response.data || response;
      setFolders(Array.isArray(foldersData) ? foldersData : []);
    } catch (err) {
      console.error('Error loading folders:', err);
      setError('Failed to load folders');
    }
  };

  const loadDocuments = async () => {
    setLoading(true);
    try {
      let url = apiRoutes.GetDocuments;
      const params = [];

      if (currentFolder) {
        params.push(`folder_id=${currentFolder}`);
      }
      if (searchQuery) {
        params.push(`search=${encodeURIComponent(searchQuery)}`);
      }

      if (params.length) {
        url += '?' + params.join('&');
      }

      const response = await apiClient.get(url);
      const docsData = response.data || response;
      setDocuments(Array.isArray(docsData) ? docsData : []);
      setError('');
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = async (folderId, folderName) => {
    setCurrentFolder(folderId);
    setBreadcrumbs([...breadcrumbs, { id: folderId, name: folderName }]);
    await loadFolders();
  };

  const handleBreadcrumbClick = async (folderId, index) => {
    setCurrentFolder(folderId);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    await loadFolders();
  };

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Company Documents</h1>
          <p className="text-gray-600">Access company policies, handbooks, and documents</p>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-600 flex-wrap">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <button
                onClick={() => handleBreadcrumbClick(crumb.id, index)}
                className="text-blue-600 hover:underline font-medium"
              >
                {crumb.name}
              </button>
              {index < breadcrumbs.length - 1 && <span>/</span>}
            </React.Fragment>
          ))}
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Content Area */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : folders.length === 0 && documents.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">This folder is empty</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Folders */}
            {folders.map((folder) => (
              <Card
                key={folder.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleFolderClick(folder.id, folder.name)}
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
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl">{getDocumentIcon(doc.document_type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate" title={doc.name}>
                        {doc.name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{doc.document_type}</p>
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
