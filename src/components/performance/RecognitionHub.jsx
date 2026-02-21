import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Award } from 'lucide-react';

export default function RecognitionHub({ currentUser }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recognition Hub</h2>
          <p className="text-gray-600">Give and see recognition for great work.</p>
        </div>
      </div>
      <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl">
        <CardContent className="text-center py-12">
          <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold mb-2 text-gray-700">Feature Coming Soon</h3>
          <p className="text-gray-500">The recognition and rewards system is currently under development.</p>
        </CardContent>
      </Card>
    </div>
  );
}