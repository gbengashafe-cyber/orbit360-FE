
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const IMAGE_CATEGORIES = {
  business: {
    name: 'Business & Teamwork',
    images: [
      { name: 'Team Spirit', url: 'https://images.undraw.co/undraw_team_spirit_re_yl1v.svg' },
      { name: 'Collaboration', url: 'https://images.undraw.co/undraw_connecting_teams_re_hno7.svg' },
      { name: 'Growth Analytics', url: 'https://images.undraw.co/undraw_growth_analytics_re_kq5p.svg' },
      { name: 'Target', url: 'https://images.undraw.co/undraw_target_re_fi8j.svg' },
      { name: 'Business Deal', url: 'https://images.undraw.co/undraw_business_deal_re_8v6d.svg' },
      { name: 'On the way', url: 'https://images.undraw.co/undraw_on_the_way_re_swjt.svg' },
    ],
  },
  ideas: {
    name: 'Ideas & Problem Solving',
    images: [
      { name: 'Lightbulb Moment', url: 'https://images.undraw.co/undraw_lightbulb_moment_re_ulyo.svg' },
      { name: 'Questions', url: 'https://images.undraw.co/undraw_questions_re_1f7v.svg' },
      { name: 'Problem Solving', url: 'https://images.undraw.co/undraw_problem_solving_re_4gq3.svg' },
      { name: 'Task List', url: 'https://images.undraw.co/undraw_add_tasks_re_s5kg.svg' },
      { name: 'Taking Notes', url: 'https://images.undraw.co/undraw_taking_notes_re_bux3.svg' },
      { name: 'Mind Map', url: 'https://images.undraw.co/undraw_mind_map_re_3mbd.svg' },
    ],
  },
  technology: {
    name: 'Technology & Home',
    images: [
      { name: 'Working from anywhere', url: 'https://images.undraw.co/undraw_working_from_anywhere_re_9obt.svg' },
      { name: 'Work from home', url: 'https://images.undraw.co/undraw_work_from_home_re_l2i3.svg'},
      { name: 'Online Connection', url: 'https://images.undraw.co/undraw_online_connection_re_gx0c.svg' },
      { name: 'Web developer', url: 'https://images.undraw.co/undraw_web_developer_re_h7ie.svg' },
      { name: 'Data Processing', url: 'https://images.undraw.co/undraw_data_processing_re_jodp.svg' },
      { name: 'Setup wizard', url: 'https://images.undraw.co/undraw_setup_wizard_re_nday.svg' },
    ]
  },
};

export default function ImageLibrary({ onImageSelect }) {
  return (
    <ScrollArea className="h-[70vh] pr-4">
      <div className="space-y-8">
        {Object.entries(IMAGE_CATEGORIES).map(([key, category]) => (
          <div key={key}>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">{category.name}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {category.images.map((image) => (
                <Card
                  key={image.name}
                  onClick={() => onImageSelect(image.url)}
                  className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group"
                >
                  <CardContent className="p-3 flex flex-col items-center justify-center aspect-square">
                    <img src={image.url} alt={image.name} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-200" />
                    <p className="text-xs text-center mt-2 text-gray-600 font-medium truncate">{image.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
