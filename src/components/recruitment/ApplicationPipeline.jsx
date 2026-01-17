
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, User, Mail, Phone, FileText } from "lucide-react";
import ApplicantForm from './ApplicantForm';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { recruitmentService } from "@/api";


const APPLICATION_STAGES = [
  { key: "submitted", label: "Submitted", color: "bg-blue-100 text-blue-700" },
  { key: "under_review", label: "Under Review", color: "bg-yellow-100 text-yellow-700" },
  { key: "shortlisted", label: "Shortlisted", color: "bg-purple-100 text-purple-700" },
  { key: "interview_scheduled", label: "Interview Scheduled", color: "bg-orange-100 text-orange-700" },
  { key: "interviewed", label: "Interviewed", color: "bg-indigo-100 text-indigo-700" },
  { key: "offer_made", label: "Offer Made", color: "bg-green-100 text-green-700" },
  { key: "hired", label: "Hired", color: "bg-emerald-100 text-emerald-700" },
  { key: "rejected", label: "Rejected", color: "bg-red-100 text-red-700" }
];

export default function ApplicationPipeline({ job, applications, onClose, onRefreshApplications }) {
  const [localApplications, setLocalApplications] = useState(applications);

  // Synchronize localApplications with prop applications if applications changes from parent
  React.useEffect(() => {
    setLocalApplications(applications);
  }, [applications]);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    // Check if the item was dropped in the same droppable and same position
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const applicant = localApplications.find(app => app.id === draggableId);
    if (!applicant) return;

    const originalStatus = applicant.status;
    const newStatus = destination.droppableId;
    
    if (originalStatus === newStatus) return;

    // Optimistic UI update
    const updatedApplications = localApplications.map(app =>
      app.id === draggableId ? { ...app, status: newStatus } : app
    );
    setLocalApplications(updatedApplications);

    try {
      await recruitmentService.updateApplicationStatus(draggableId, newStatus);
      // TODO: Re-enable email notifications after thorough testing
      // if (applicant) {
      //   const newStatusLabel = APPLICATION_STAGES.find(s => s.key === newStatus)?.label || newStatus.replace('_', ' ');
      //   await SendEmail({
      //     to: applicant.applicant_email,
      //     subject: `Update on your application for ${job.title}`,
      //     body: `<p>Dear ${applicant.applicant_name},</p><p>Your application status has been updated to: <strong>${newStatusLabel}</strong>.</p><p>Thank you for your interest in Isaac-Bern.</p>`,
      //     from_name: "Isaac-Bern HR"
      //   });
      // }
      onRefreshApplications();
    } catch (error) {
      console.error("Failed to update application status:", error);
      setLocalApplications(applications);
      alert("Failed to move applicant. Please try again.");
    }
  };

  const getStageApplications = (stageKey) => {
    return localApplications.filter(app => app.status === stageKey)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); // Maintain a consistent order
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm border-gray-200 h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
           <ApplicantForm jobId={job.id} onApplicantAdded={onRefreshApplications} />
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <ScrollArea className="flex-grow">
          <div className="flex space-x-4 p-4">
            {APPLICATION_STAGES.map((stage) => (
              <Droppable key={stage.key} droppableId={stage.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`w-72 flex-shrink-0 bg-gray-50 rounded-lg transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
                  >
                    <div className="p-3 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 text-sm">{stage.label}</h3>
                        <Badge className={stage.color}>
                          {getStageApplications(stage.key).length}
                        </Badge>
                      </div>
                    </div>
                    <ScrollArea className="h-[calc(90vh-180px)]">
                      <div className="p-2 space-y-2">
                        {getStageApplications(stage.key).map((application, index) => (
                          <Draggable key={application.id} draggableId={application.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-3 rounded-lg bg-white transition-shadow ${snapshot.isDragging ? 'shadow-2xl scale-105' : 'shadow-md'} `}
                              >
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium text-sm">{application.applicant_name}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Mail className="w-3 h-3" />
                                    <span>{application.applicant_email}</span>
                                  </div>
                                  {application.applicant_phone && (
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <Phone className="w-3 h-3" />
                                      <span>{application.applicant_phone}</span>
                                    </div>
                                  )}
                                  {application.resume_url && (
                                    <div className="flex items-center gap-2 text-xs text-blue-600">
                                      <FileText className="w-3 h-3" />
                                      <a href={application.resume_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                        View Resume
                                      </a>
                                    </div>
                                  )}
                                  {application.salary_expectation && (
                                    <div className="text-xs text-gray-600">
                                      Expected: ₦{application.salary_expectation.toLocaleString()}
                                    </div>
                                  )}
                                  {application.rating && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-gray-500">Rating:</span>
                                      <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                          <span key={i} className={`text-xs ${i < application.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                            ★
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {getStageApplications(stage.key).length === 0 && (
                          <div className="text-center p-6 text-gray-400 text-sm">
                            No applications
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DragDropContext>

      {localApplications.length === 0 && (
        <div className="flex-grow flex items-center justify-center text-center py-12 text-gray-500">
          <div>
            <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
            <p>Applications for this job will appear here once candidates start applying.</p>
          </div>
        </div>
      )}
    </div>
  );
}
