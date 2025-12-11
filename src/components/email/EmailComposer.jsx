import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Send, Clock, Calendar as CalendarIcon, Users, LayoutTemplate, Sparkles, X, UserPlus } from "lucide-react";
import { InvokeLLM } from "@/api/integrations";

export default function EmailComposer({ contacts, templates, onSend, onSchedule }) {
  const [emailData, setEmailData] = useState({
    recipients: [], // Changed to array for multiple recipients
    subject: "",
    content: "",
    template_id: ""
  });
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [scheduledDate, setScheduledDate] = useState(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [showBulkSelect, setShowBulkSelect] = useState(false);

  const handleInputChange = (field, value) => {
    setEmailData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setEmailData(prev => ({
        ...prev,
        subject: template.subject,
        content: template.content,
        template_id: templateId
      }));
    }
  };

  const handleContactSelect = (contactId) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact && !selectedContacts.find(c => c.id === contactId)) {
      const newContact = {
        id: contact.id,
        email: contact.email,
        name: `${contact.first_name} ${contact.last_name}`,
        first_name: contact.first_name,
        last_name: contact.last_name
      };
      setSelectedContacts(prev => [...prev, newContact]);
      setEmailData(prev => ({
        ...prev,
        recipients: [...prev.recipients, contact.email]
      }));
    }
  };

  const handleBulkContactToggle = (contact) => {
    const isSelected = selectedContacts.find(c => c.id === contact.id);
    
    if (isSelected) {
      setSelectedContacts(prev => prev.filter(c => c.id !== contact.id));
      setEmailData(prev => ({
        ...prev,
        recipients: prev.recipients.filter(email => email !== contact.email)
      }));
    } else {
      const newContact = {
        id: contact.id,
        email: contact.email,
        name: `${contact.first_name} ${contact.last_name}`,
        first_name: contact.first_name,
        last_name: contact.last_name
      };
      setSelectedContacts(prev => [...prev, newContact]);
      setEmailData(prev => ({
        ...prev,
        recipients: [...prev.recipients, contact.email]
      }));
    }
  };

  const removeContact = (contactId) => {
    const contact = selectedContacts.find(c => c.id === contactId);
    setSelectedContacts(prev => prev.filter(c => c.id !== contactId));
    setEmailData(prev => ({
      ...prev,
      recipients: prev.recipients.filter(email => email !== contact?.email)
    }));
  };

  const handleManualEmailAdd = (email) => {
    if (email && !emailData.recipients.includes(email)) {
      // Try to find contact info for this email
      const contact = contacts.find(c => c.email === email);
      const newContact = contact ? {
        id: contact.id,
        email: contact.email,
        name: `${contact.first_name} ${contact.last_name}`,
        first_name: contact.first_name,
        last_name: contact.last_name
      } : {
        id: `manual-${Date.now()}`,
        email: email,
        name: email.split('@')[0], // Use part before @ as name
        first_name: email.split('@')[0],
        last_name: ""
      };

      setSelectedContacts(prev => [...prev, newContact]);
      setEmailData(prev => ({
        ...prev,
        recipients: [...prev.recipients, email]
      }));
    }
  };
  
  const handleGenerateContent = async () => {
    if (!emailData.subject) {
      alert("Please enter a subject first to generate relevant email content.");
      return;
    }
    setGeneratingContent(true);
    try {
      // Determine how to address recipients
      let greeting = "there";
      if (selectedContacts.length === 1) {
        greeting = selectedContacts[0].first_name;
      } else if (selectedContacts.length > 1) {
        greeting = "team"; // Generic greeting for multiple recipients
      }
      
      const prompt = `Write a warm, professional, and beautifully formatted email for the subject: "${emailData.subject}". 

RECIPIENT CONTEXT:
- Number of recipients: ${selectedContacts.length}
- Greeting to use: "${greeting}"
- This email is going to ${selectedContacts.length === 1 ? 'one person' : `${selectedContacts.length} people`}

IMPORTANT FORMATTING REQUIREMENTS:
- Use clear, friendly, and warm tone
- Start with a personalized greeting using "Hi ${greeting}," or "Dear ${greeting},"
- Use proper paragraph breaks for readability
- NO special characters like asterisks (*), hashtags (#), or excessive punctuation
- Use simple, clean formatting with line breaks between paragraphs
- End with a warm, professional closing
- Make it feel personal and human, not robotic
- Keep sentences clear and easy to read
- If multiple recipients, use inclusive language that works for a group
- Use bullet points sparingly and only when necessary (use simple dashes -)

The email should feel warm, welcoming, and professional - like it's coming from a trusted colleague or business partner.`;

      const response = await InvokeLLM({ prompt });
      if (response) {
        // Clean up any unwanted characters that might slip through
        const cleanedContent = response
          .replace(/\*\*/g, '') // Remove bold asterisks
          .replace(/\*/g, '') // Remove single asterisks
          .replace(/#{1,6}\s/g, '') // Remove markdown headers
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert markdown links to plain text
          .replace(/`([^`]+)`/g, '$1') // Remove code backticks
          .replace(/_{2,}/g, '') // Remove underscores
          .replace(/\n{3,}/g, '\n\n') // Limit to double line breaks max
          .trim();
        
        handleInputChange("content", cleanedContent);
      }
    } catch (error) {
      console.error("Error generating email content:", error);
      alert("Failed to generate content. Please try again.");
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleSend = async () => {
    if (selectedContacts.length === 0) {
      alert("Please select at least one recipient.");
      return;
    }

    try {
      // Send individual emails to each recipient with personalized content
      for (const contact of selectedContacts) {
        // Personalize content for each recipient
        let personalizedContent = emailData.content;
        
        // Replace generic greetings with personalized ones
        personalizedContent = personalizedContent
          .replace(/Hi there,/g, `Hi ${contact.first_name},`)
          .replace(/Dear there,/g, `Dear ${contact.first_name},`)
          .replace(/Hi team,/g, `Hi ${contact.first_name},`)
          .replace(/Dear team,/g, `Dear ${contact.first_name},`);

        const emailToSend = {
          recipient: contact.email,
          subject: emailData.subject,
          content: personalizedContent,
          contact_id: contact.id
        };

        if (isScheduling && scheduledDate) {
          await onSchedule({
            ...emailToSend,
            scheduled_date: scheduledDate.toISOString(),
            recipient_email: contact.email,
            recipient_name: contact.name
          });
        } else {
          await onSend(emailToSend);
        }
      }

      // Reset form
      setEmailData({
        recipients: [],
        subject: "",
        content: "",
        template_id: ""
      });
      setSelectedContacts([]);
      setScheduledDate(null);
      setIsScheduling(false);
      setShowBulkSelect(false);

      alert(`Email ${isScheduling ? 'scheduled' : 'sent'} successfully to ${selectedContacts.length} recipient(s)!`);
    } catch (error) {
      console.error("Error sending emails:", error);
      alert("Failed to send emails. Please try again.");
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-700" />
          Compose Email
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recipient Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Recipients *</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkSelect(!showBulkSelect)}
                className="text-blue-700 border-blue-200"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {showBulkSelect ? 'Hide' : 'Bulk Select'}
              </Button>
              <Select onValueChange={handleContactSelect}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Add contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts
                    .filter(contact => !selectedContacts.find(c => c.id === contact.id))
                    .map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name} ({contact.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Manual Email Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Or enter email addresses manually (press Enter to add)"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleManualEmailAdd(e.target.value);
                  e.target.value = '';
                }
              }}
              className="flex-1"
            />
          </div>

          {/* Selected Recipients */}
          {selectedContacts.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Selected Recipients ({selectedContacts.length})</Label>
              <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                {selectedContacts.map((contact) => (
                  <Badge key={contact.id} variant="secondary" className="flex items-center gap-2 px-3 py-1">
                    <span>{contact.name}</span>
                    <button
                      onClick={() => removeContact(contact.id)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Bulk Contact Selection */}
          {showBulkSelect && (
            <Card className="border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Select Multiple Contacts</CardTitle>
              </CardHeader>
              <CardContent className="max-h-60 overflow-y-auto space-y-2">
                {contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      id={`contact-${contact.id}`}
                      checked={!!selectedContacts.find(c => c.id === contact.id)}
                      onCheckedChange={() => handleBulkContactToggle(contact)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`contact-${contact.id}`} className="cursor-pointer text-sm font-medium">
                        {contact.first_name} {contact.last_name}
                      </Label>
                      <p className="text-xs text-gray-500">{contact.email}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Template Selection */}
        <div className="space-y-2">
          <Label>Use Template (Optional)</Label>
          <Select onValueChange={handleTemplateSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <LayoutTemplate className="w-4 h-4 mr-2" />
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Email Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={emailData.subject}
              onChange={(e) => handleInputChange("subject", e.target.value)}
              placeholder="Email subject"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="content">Message *</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateContent}
                disabled={generatingContent || !emailData.subject}
                className="text-xs bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:from-purple-100 hover:to-blue-100"
              >
                <Sparkles className="w-3 h-3 mr-2 text-purple-600" />
                {generatingContent ? "Generating..." : "Generate with AI"}
              </Button>
            </div>
            <Textarea
              id="content"
              value={emailData.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
              placeholder="Write your email message here... or generate personalized content with AI"
              rows={12}
              required
              className="font-sans leading-relaxed"
            />
            <p className="text-xs text-gray-500">
              AI will generate warm, personalized content with proper names and beautiful formatting. Each recipient will get a personalized version.
            </p>
          </div>

          {/* Scheduling Options */}
          <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="schedule"
                checked={isScheduling}
                onChange={(e) => setIsScheduling(e.target.checked)}
              />
              <Label htmlFor="schedule" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Schedule for later
              </Label>
            </div>

            {isScheduling && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {scheduledDate ? format(scheduledDate, 'PPP p') : 'Pick date & time'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Send Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSend}
              className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white"
              disabled={selectedContacts.length === 0 || !emailData.subject || !emailData.content}
            >
              {isScheduling ? (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Schedule Email{selectedContacts.length > 1 ? 's' : ''}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send to {selectedContacts.length} Recipient{selectedContacts.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}