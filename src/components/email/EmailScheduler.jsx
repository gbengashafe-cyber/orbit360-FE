import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScheduledEmail } from "@/api/entities";
import { Clock, Trash2, Calendar, Mail } from "lucide-react";
import { format } from "date-fns";

export default function EmailScheduler({ scheduledEmails, onRefresh }) {
  const handleCancel = async (emailId) => {
    if (window.confirm("Are you sure you want to cancel this scheduled email?")) {
      try {
        await ScheduledEmail.update(emailId, { status: "cancelled" });
        onRefresh();
      } catch (error) {
        console.error("Failed to cancel email:", error);
        alert("Could not cancel the email. Please try again.");
      }
    }
  };

  const statusColors = {
    scheduled: "bg-yellow-100 text-yellow-700",
    sent: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-700",
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-700" />
          Scheduled Emails
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Recipient</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Scheduled For</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scheduledEmails.map((email) => (
                <TableRow key={email.id}>
                  <TableCell>
                    <div className="font-medium">{email.recipient_name}</div>
                    <div className="text-sm text-gray-500">{email.recipient_email}</div>
                  </TableCell>
                  <TableCell>{email.subject}</TableCell>
                  <TableCell>
                    {format(new Date(email.scheduled_date), "MMM d, yyyy 'at' p")}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[email.status]}>
                      {email.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {email.status === 'scheduled' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleCancel(email.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {scheduledEmails.length === 0 && (
          <div className="text-center p-12 text-gray-500">
             <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2 text-gray-700">No Scheduled Emails</h3>
            <p>You have no emails scheduled to be sent.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}