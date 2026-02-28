import { Contact } from '@/api/entities';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Globe, Loader2, Mail, MapPin, Phone, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import Logo from '../components/Logo';

export default function ClientAuth({ onAuthenticated }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    company: '',
    job_title: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if contact already exists
      const existingContacts = await Contact.filter({ email: formData.email });

      let contact;
      if (existingContacts.length > 0) {
        // Update existing contact
        contact = existingContacts[0];
        await Contact.update(contact.id, {
          ...formData,
          is_client_user: true,
          status: contact.status || 'client',
        });
      } else {
        // Create new contact
        contact = await Contact.create({
          ...formData,
          is_client_user: true,
          status: 'client',
          lead_source: 'website',
        });
      }

      // Store client info in localStorage for session management
      localStorage.setItem(
        'clientAuth',
        JSON.stringify({
          contactId: contact.id,
          email: formData.email,
          name: `${formData.first_name} ${formData.last_name}`,
          timestamp: Date.now(),
        }),
      );

      onAuthenticated(contact);
    } catch (error) {
      console.error('Error authenticating client:', error);
      setError('Unable to process your information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Logo size="large" className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Isaac-Bern Associate Ltd</h1>
          <p className="text-gray-600">HR & Project Management Training Platform</p>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-2xl shadow-gray-200/60">
          <CardHeader className="text-center border-b border-gray-200">
            <CardTitle className="text-xl font-bold text-gray-900">Welcome! Please provide your details to continue</CardTitle>
            <p className="text-sm text-gray-600 mt-2">We need some basic information to personalize your experience</p>
          </CardHeader>
          <CardContent className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    First Name *
                  </Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={loading}
                  placeholder="Optional"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    City
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    disabled={loading}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Country
                  </Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    disabled={loading}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Company
                </Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  disabled={loading}
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_title">Job Title</Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => handleInputChange('job_title', e.target.value)}
                  disabled={loading}
                  placeholder="Optional"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white mt-6"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Continue to Platform'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                By continuing, you agree to our terms of service and privacy policy. Your information will be used to provide you
                with personalized training recommendations.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
