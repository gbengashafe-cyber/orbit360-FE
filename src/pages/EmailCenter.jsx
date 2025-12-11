
import React, { useState, useEffect } from "react";
import { EmailTemplate, ScheduledEmail, Contact, Activity } from "@/api/entities";
import { SendEmail } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import {
  Mail,
  Send,
  Clock,
  Users,
  LayoutTemplate,
  Calendar as CalendarIcon,
  Plus,
  Inbox,
  CheckCircle
} from "lucide-react";

import EmailComposer from "../components/email/EmailComposer";
import EmailScheduler from "../components/email/EmailScheduler";
import EmailTemplates from "../components/email/EmailTemplates";

export default function EmailCenter() {
  const [activeTab, setActiveTab] = useState("compose");
  const [templates, setTemplates] = useState([]);
  const [scheduledEmails, setScheduledEmails] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [templatesData, scheduledData, contactsData] = await Promise.all([
        EmailTemplate.list('-created_date'),
        ScheduledEmail.list('-created_date'),
        Contact.list()
      ]);
      setTemplates(templatesData);
      setScheduledEmails(scheduledData);
      setContacts(contactsData);
    } catch (error) {
      console.error('Error loading email data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (emailData) => {
    try {
      await SendEmail({
        to: emailData.recipient,
        subject: emailData.subject,
        body: emailData.content,
        from_name: "Isaac-BernHR &PM"
      });
      
      // Log the sent email as an activity for the contact
      if (emailData.contact_id) {
        await Activity.create({
          contact_id: emailData.contact_id,
          type: "email",
          title: `Email Sent: ${emailData.subject}`,
          description: `Successfully sent an email to ${emailData.recipient}.`,
          completed: true,
        });
      }
    } catch (error) {
      console.error('Error sending email:', error);
      // Re-throw the error to be caught by the composer, which will show a summary alert.
      throw new Error(`Failed to send email to ${emailData.recipient}.`);
    }
  };

  const handleScheduleEmail = async (emailData) => {
    try {
      await ScheduledEmail.create(emailData);
      loadData();
      alert('Email scheduled successfully!');
    } catch (error) {
      console.error('Error scheduling email:', error);
      alert('Failed to schedule email. Please try again.');
    }
  };

  const tabs = [
    { id: "compose", label: "Compose", icon: Mail },
    { id: "scheduled", label: "Scheduled", icon: Clock },
    { id: "templates", label: "Templates", icon: LayoutTemplate },
    { id: "inbox", label: "Gmail Sync", icon: Inbox }
  ];

  if (loading) {
    return <div className="p-8 text-center">Loading email center...</div>;
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Email Center</h1>
              <p className="text-gray-600">Send, schedule, and manage your email communications</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id 
                ? "bg-gradient-to-r from-blue-700 to-blue-800 text-white" 
                : "border-gray-300 hover:bg-gray-50"
              }
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "compose" && (
          <EmailComposer 
            contacts={contacts} 
            templates={templates}
            onSend={handleSendEmail}
            onSchedule={handleScheduleEmail}
          />
        )}

        {activeTab === "scheduled" && (
          <EmailScheduler 
            scheduledEmails={scheduledEmails}
            onRefresh={loadData}
          />
        )}

        {activeTab === "templates" && (
          <EmailTemplates 
            templates={templates}
            onRefresh={loadData}
          />
        )}

        {activeTab === "inbox" && (
          <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="w-5 h-5 text-blue-700" />
                Gmail Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Inbox className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2 text-gray-700">Gmail Integration Coming Soon</h3>
                <p className="text-gray-500 mb-6">
                  Connect your Gmail account to sync emails, manage conversations, and get notifications directly in Isaac-BernHR &PM.
                </p>
                <Button 
                  variant="outline" 
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  disabled
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Connect Gmail (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
