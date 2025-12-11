
import React, { useState, useEffect } from 'react';
import { HRDocument, HRFolder } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Folder, File, ArrowLeft, Home, FileText, Loader2, FileBox } from 'lucide-react'; // Changed BookCopy to FileBox
import { Badge } from '@/components/ui/badge';

export default function CompanyDocuments() {
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState(null); // null is root

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [foldersData, documentsData] = await Promise.all([
        HRFolder.list(),
        HRDocument.filter({ access_level: 'public' })
      ]);
      setFolders(foldersData);
      setDocuments(documentsData);
    } catch (error) {
      console.error("Error loading company document data:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentFolderName = currentFolder ? folders.find(f => f.id === currentFolder)?.name : 'Root';
  const parentFolderId = currentFolder ? folders.find(f => f.id === currentFolder)?.parent_folder_id : null;

  const displayedFolders = folders.filter(f => f.parent_folder_id === currentFolder);
  const displayedDocuments = documents.filter(d => d.folder_id === currentFolder);

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
              <FileBox className="w-6 h-6 text-white" /> {/* Changed BookCopy to FileBox */}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Document Hub</h1> {/* Renamed to Document Hub */}
              <p className="text-gray-600">Access public company policies, handbooks, and documents.</p>
            </div>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              {currentFolder && (
                 <Button variant="ghost" size="icon" onClick={() => setCurrentFolder(parentFolderId)} title="Go to parent folder"><ArrowLeft className="w-4 h-4" /></Button>
              )}
               <Button variant="ghost" size="icon" onClick={() => setCurrentFolder(null)} title="Go to Root"><Home className="w-4 h-4" /></Button>
              <CardTitle>Current Folder: {currentFolderName}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
               <div className="text-center p-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-700" /></div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {displayedFolders.map(folder => (
                  <div key={folder.id} onClick={() => setCurrentFolder(folder.id)} className="p-4 border rounded-lg text-center cursor-pointer hover:bg-gray-50 flex flex-col items-center justify-center transition-all hover:shadow-lg hover:-translate-y-1 h-36">
                    <Folder className="w-12 h-12 text-yellow-500 mb-2" />
                    <span className="text-sm font-medium break-words w-full">{folder.name}</span>
                  </div>
                ))}
                 {displayedDocuments.map(doc => (
                  <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-4 border rounded-lg text-center cursor-pointer hover:bg-gray-50 flex flex-col items-center justify-center transition-all hover:shadow-lg hover:-translate-y-1 h-36">
                    {doc.name.toLowerCase().includes("template") || (doc.folder_id && folders.find(f=>f.id === doc.folder_id)?.name === "Templates") ? (
                      <FileText className="w-12 h-12 text-purple-500 mb-2" />
                    ) : (
                      <File className="w-12 h-12 text-blue-500 mb-2" />
                    )}
                    <span className="text-sm font-medium break-words w-full">{doc.name}</span>
                    <span className="text-xs text-gray-500 capitalize mt-1">{doc.document_type.replace('_', ' ')}</span>
                  </a>
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
