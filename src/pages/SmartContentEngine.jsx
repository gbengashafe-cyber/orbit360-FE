
import React, { useState, useEffect } from "react";
import { SmartContent, ContentSchedule } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, addDays } from "date-fns";
import {
  Sparkles,
  Calendar as CalendarIcon,
  Plus,
  Edit,
  Share2,
  Linkedin,
  Facebook,
  MessageCircle,
  Wand2,
  Clock,
  Eye,
  Send,
  RefreshCw,
  ChevronRight,
  Copy,
  Check,
  X
} from "lucide-react";

const CONTENT_CATEGORIES = [
  { id: "hr_insights", label: "HR Insights", emoji: "👥" },
  { id: "capacity_building", label: "Capacity Building", emoji: "📈" },
  { id: "succession_planning", label: "Succession Planning", emoji: "🔄" },
  { id: "dream_job_strategies", label: "Dream Job Strategies", emoji: "💼" },
  { id: "productivity_hacks", label: "Productivity Hacks", emoji: "⚡" },
  { id: "leadership", label: "Leadership", emoji: "👑" },
  { id: "organization_skills", label: "Organization Skills", emoji: "📋" },
  { id: "staff_turnover_solutions", label: "Staff Turnover Solutions", emoji: "🔄" },
  { id: "cybersecurity", label: "Cybersecurity", emoji: "🔒" },
  { id: "ai", label: "Artificial Intelligence", emoji: "🤖" },
  { id: "career_growth", label: "Career Growth", emoji: "🚀" },
  { id: "christian_inspirational", label: "Christian Inspirational", emoji: "✝️" }
];

const PLATFORM_ICONS = {
  linkedin: { icon: Linkedin, color: "text-blue-600" },
  facebook: { icon: Facebook, color: "text-blue-800" },
  whatsapp: { icon: MessageCircle, color: "text-green-600" }
};

const TONE_OPTIONS = [
  { id: "formal", label: "Formal & Professional", desc: "Corporate, authoritative tone" },
  { id: "conversational", label: "Conversational & Friendly", desc: "Approachable, engaging tone" },
  { id: "motivational", label: "Motivational & Inspiring", desc: "Uplifting, energetic tone" }
];

export default function SmartContentEngine() {
  const [activeTab, setActiveTab] = useState("generator");
  const [contents, setContents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Generator State
  const [generatorSettings, setGeneratorSettings] = useState({
    category: "hr_insights",
    tone: "conversational",
    platforms: ["linkedin"],
    autoSchedule: false,
    frequency: "daily"
  });

  // Idea Converter State
  const [ideaInput, setIdeaInput] = useState("");
  const [ideaSettings, setIdeaSettings] = useState({
    tone: "conversational",
    platforms: ["linkedin"],
    includeHashtags: true,
    includeEmojis: true
  });

  // Content Calendar State
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Content Preview State
  const [previewContent, setPreviewContent] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState("linkedin");
  const [copiedStates, setCopiedStates] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [contentsData, schedulesData] = await Promise.all([
        SmartContent.list('-created_date'),
        ContentSchedule.list('-scheduled_date')
      ]);
      setContents(contentsData);
      setSchedules(schedulesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, contentId, platform = 'main') => {
    try {
      await navigator.clipboard.writeText(text);
      const key = `${contentId}-${platform}`;
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy to clipboard');
    }
  };

  const generateDailyContent = async () => {
    setGenerating(true);
    try {
      const category = CONTENT_CATEGORIES.find(c => c.id === generatorSettings.category);
      const prompt = createPrompt(category, generatorSettings.tone, "auto_generate");

      const response = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Engaging post title" },
            content: { type: "string", description: "Main post content" },
            hashtags: { type: "array", items: { type: "string" }, description: "Relevant hashtags" },
            linkedin_version: { type: "string", description: "LinkedIn-optimized version" },
            facebook_version: { type: "string", description: "Facebook-optimized version" },
            whatsapp_version: { type: "string", description: "WhatsApp-optimized version" }
          },
          required: ["title", "content", "hashtags"]
        }
      });

      if (response) {
        const contentData = {
          title: response.title,
          content: response.content,
          category: generatorSettings.category,
          tone: generatorSettings.tone,
          platforms: generatorSettings.platforms,
          hashtags: response.hashtags || [],
          platform_variations: {
            linkedin: response.linkedin_version || response.content,
            facebook: response.facebook_version || response.content,
            whatsapp: response.whatsapp_version || response.content
          },
          generation_type: "auto_generated",
          generated_date: new Date().toISOString()
        };

        const savedContent = await SmartContent.create(contentData);

        if (generatorSettings.autoSchedule) {
          await scheduleContent(savedContent.id, generatorSettings.platforms);
        }

        loadData();
        alert('Content generated successfully!');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const convertIdeaToPost = async () => {
    if (!ideaInput.trim()) {
      alert('Please enter your idea first.');
      return;
    }

    setGenerating(true);
    try {
      const prompt = createIdeaConversionPrompt(ideaInput, ideaSettings);

      const response = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "string" },
            hashtags: { type: "array", items: { type: "string" } },
            linkedin_version: { type: "string" },
            facebook_version: { type: "string" },
            whatsapp_version: { type: "string" },
            category: { type: "string" }
          },
          required: ["title", "content", "category"]
        }
      });

      if (response) {
        const contentData = {
          title: response.title,
          content: response.content,
          category: response.category,
          tone: ideaSettings.tone,
          platforms: ideaSettings.platforms,
          hashtags: response.hashtags || [],
          platform_variations: {
            linkedin: response.linkedin_version || response.content,
            facebook: response.facebook_version || response.content,
            whatsapp: response.whatsapp_version || response.content
          },
          user_input: ideaInput,
          generation_type: "idea_conversion",
          generated_date: new Date().toISOString()
        };

        await SmartContent.create(contentData);
        setIdeaInput("");
        loadData();
        alert('Idea converted to post successfully!');
      }
    } catch (error) {
      console.error('Error converting idea:', error);
      alert('Failed to convert idea. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const scheduleContent = async (contentId, platforms, customDate = null) => {
    const scheduleDate = customDate || addDays(new Date(), 1);
    
    for (const platform of platforms) {
      await ContentSchedule.create({
        content_id: contentId,
        platform,
        scheduled_date: scheduleDate.toISOString(),
        auto_generated: !customDate
      });
    }
  };

  const createPrompt = (category, tone, type) => {
    const basePrompts = {
      hr_insights: "Create an insightful HR post about modern workplace trends, employee engagement, or people management best practices",
      capacity_building: "Generate a post about professional development, skills training, or organizational capacity building",
      succession_planning: "Write about succession planning strategies, leadership pipeline development, or talent management",
      dream_job_strategies: "Create content about job search strategies, career planning, or landing your dream job",
      productivity_hacks: "Share practical productivity tips, time management strategies, or workplace efficiency hacks",
      leadership: "Generate leadership insights, management tips, or inspirational content for leaders",
      organization_skills: "Create content about organizational skills, workplace organization, or systematic approaches to work",
      staff_turnover_solutions: "Write about employee retention strategies, reducing turnover, or building loyalty",
      cybersecurity: "Generate cybersecurity awareness content, data protection tips, or workplace security practices",
      ai: "Create content about AI in the workplace, automation benefits, or emerging technology trends",
      career_growth: "Write about career advancement, professional growth strategies, or skill development",
      christian_inspirational: "Create inspirational Christian content with relevant Bible verses and workplace faith applications"
    };

    const toneInstructions = {
      formal: "Use a professional, authoritative tone suitable for corporate audiences",
      conversational: "Use a friendly, approachable tone that encourages engagement",
      motivational: "Use an inspiring, energetic tone that motivates and uplifts readers"
    };

    return `${basePrompts[category.id]} using a ${tone} tone. ${toneInstructions[tone]}.

Requirements:
- Create engaging, valuable content that provides real insights
- Include a compelling hook in the first line
- Use short paragraphs for readability
- End with a question or call-to-action to encourage engagement
- Generate relevant hashtags (5-8 maximum)
- Create platform-specific versions optimized for each social media platform
- Keep LinkedIn version professional (1500 chars max)
- Make Facebook version more visual and engaging (400 words max)
- Create WhatsApp version that's conversational and shareable (200 words max)

The content should be original, practical, and valuable to HR professionals and business leaders.`;
  };

  const createIdeaConversionPrompt = (idea, settings) => {
    return `Transform this rough idea into a professional, engaging social media post: "${idea}"

Settings:
- Tone: ${settings.tone}
- Include hashtags: ${settings.includeHashtags ? 'Yes' : 'No'}
- Include emojis: ${settings.includeEmojis ? 'Yes' : 'No'}

Requirements:
- Expand the idea into a full, engaging post
- Add structure and professional language
- Include relevant examples or insights
- Create platform-specific versions for LinkedIn, Facebook, and WhatsApp
- Automatically categorize the content based on the topic
- Make it valuable and actionable for the audience

The final post should feel polished, professional, and ready to publish.`;
  };

  const ContentPreviewModal = () => {
    if (!previewContent) return null;

    const category = CONTENT_CATEGORIES.find(c => c.id === previewContent.category);
    const platformContent = previewContent.platform_variations?.[selectedPlatform] || previewContent.content;
    
    return (
      <Dialog open={!!previewContent} onOpenChange={() => setPreviewContent(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <span className="text-lg">{category?.emoji}</span>
                {previewContent.title}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewContent(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Content Meta Information */}
            <div className="flex flex-wrap gap-2 text-sm text-gray-600">
              <Badge variant="secondary">{previewContent.tone}</Badge>
              <Badge variant="secondary">{category?.label}</Badge>
              {previewContent.generated_date && (
                <Badge variant="outline">
                  Generated: {format(new Date(previewContent.generated_date), 'PPp')}
                </Badge>
              )}
            </div>

            {/* Platform Selection Tabs */}
            <div className="flex gap-2 border-b">
              {previewContent.platforms.map(platform => {
                const Icon = PLATFORM_ICONS[platform].icon;
                const isActive = selectedPlatform === platform;
                return (
                  <button
                    key={platform}
                    onClick={() => setSelectedPlatform(platform)}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                      isActive 
                        ? 'border-blue-600 text-blue-600 bg-blue-50' 
                        : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${PLATFORM_ICONS[platform].color}`} />
                    <span className="capitalize font-medium">{platform}</span>
                  </button>
                );
              })}
            </div>

            {/* Content Display */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">
                  {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} Version
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(platformContent, previewContent.id, selectedPlatform)}
                  className="flex items-center gap-2"
                >
                  {copiedStates[`${previewContent.id}-${selectedPlatform}`] ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Post
                    </>
                  )}
                </Button>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="whitespace-pre-wrap text-gray-800">
                  {platformContent}
                </div>
              </div>

              {/* Character Count */}
              <div className="text-xs text-gray-500">
                Character count: {platformContent.length}
                {selectedPlatform === 'linkedin' && platformContent.length > 1300 && (
                  <span className="text-orange-600 ml-2">• Approaching LinkedIn limit (3000 chars)</span>
                )}
                {selectedPlatform === 'facebook' && platformContent.length > 1500 && (
                  <span className="text-orange-600 ml-2">• Approaching Facebook limit (5000 chars)</span>
                )}
                {selectedPlatform === 'whatsapp' && platformContent.length > 1000 && (
                  <span className="text-orange-600 ml-2">• Approaching WhatsApp limit (65k chars, but shorter is better)</span>
                )}
              </div>
            </div>

            {/* Hashtags */}
            {previewContent.hashtags && previewContent.hashtags.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Hashtags</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(previewContent.hashtags.map(tag => `#${tag}`).join(' '), previewContent.id, 'hashtags')}
                  >
                    {copiedStates[`${previewContent.id}-hashtags`] ? (
                      <>
                        <Check className="w-4 h-4 text-green-600 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy Hashtags
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {previewContent.hashtags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-blue-600">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Original User Input (if available) */}
            {previewContent.user_input && (
              <div className="space-y-2">
                <h4 className="font-medium">Original Idea</h4>
                <div className="bg-blue-50 rounded-lg p-3 text-sm text-gray-700">
                  {previewContent.user_input}
                </div>
              </div>
            )}

            {/* Full Post with Hashtags for Easy Copy */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Complete Post (Content + Hashtags)</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const fullPost = `${platformContent}\n\n${previewContent.hashtags?.map(tag => `#${tag}`).join(' ') || ''}`;
                    copyToClipboard(fullPost, previewContent.id, 'complete');
                  }}
                >
                  {copiedStates[`${previewContent.id}-complete`] ? (
                    <>
                      <Check className="w-4 h-4 text-green-600 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy Complete Post
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
                {platformContent}
                {previewContent.hashtags && previewContent.hashtags.length > 0 && (
                  <>
                    {'\n\n'}
                    {previewContent.hashtags.map(tag => `#${tag}`).join(' ')}
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return <div className="p-8 text-center">Loading Smart Content Engine...</div>;
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Smart Content Engine</h1>
              <p className="text-gray-600">AI-powered social media content generation and scheduling</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              Auto Generator
            </TabsTrigger>
            <TabsTrigger value="converter" className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Idea Converter
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Content Calendar
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Content Library
            </TabsTrigger>
          </TabsList>

          {/* Daily Auto-Post Generator */}
          <TabsContent value="generator">
            <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-purple-600" />
                  Daily Content Generator
                </CardTitle>
                <p className="text-gray-600">Generate professional social media content automatically</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Content Category</label>
                      <Select value={generatorSettings.category} onValueChange={(value) => 
                        setGeneratorSettings(prev => ({ ...prev, category: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTENT_CATEGORIES.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <span className="flex items-center gap-2">
                                <span>{cat.emoji}</span>
                                <span>{cat.label}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Content Tone</label>
                      <Select value={generatorSettings.tone} onValueChange={(value) => 
                        setGeneratorSettings(prev => ({ ...prev, tone: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TONE_OPTIONS.map(tone => (
                            <SelectItem key={tone.id} value={tone.id}>
                              <div>
                                <div className="font-medium">{tone.label}</div>
                                <div className="text-xs text-gray-500">{tone.desc}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Platforms</label>
                      <div className="flex flex-wrap gap-3">
                        {Object.entries(PLATFORM_ICONS).map(([platform, { icon: Icon, color }]) => (
                          <div key={platform} className="flex items-center space-x-2">
                            <Checkbox
                              id={platform}
                              checked={generatorSettings.platforms.includes(platform)}
                              onCheckedChange={(checked) => {
                                setGeneratorSettings(prev => ({
                                  ...prev,
                                  platforms: checked
                                    ? [...prev.platforms, platform]
                                    : prev.platforms.filter(p => p !== platform)
                                }));
                              }}
                            />
                            <label htmlFor={platform} className="flex items-center gap-2 cursor-pointer">
                              <Icon className={`w-4 h-4 ${color}`} />
                              <span className="capitalize">{platform}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="autoSchedule"
                        checked={generatorSettings.autoSchedule}
                        onCheckedChange={(checked) => 
                          setGeneratorSettings(prev => ({ ...prev, autoSchedule: checked }))
                        }
                      />
                      <label htmlFor="autoSchedule" className="text-sm">
                        Auto-schedule for tomorrow
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={generateDailyContent}
                    disabled={generating || generatorSettings.platforms.length === 0}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating Content...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Daily Content
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Idea-to-Post Converter */}
          <TabsContent value="converter">
            <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="w-5 h-5 text-blue-600" />
                  Idea-to-Post Converter
                </CardTitle>
                <p className="text-gray-600">Transform your rough ideas into polished social media posts</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Idea or Concept</label>
                    <Textarea
                      placeholder="Enter your rough idea, bullet points, or concept here... For example: 'Remote work productivity tips for managers' or 'Why employee feedback is important'"
                      value={ideaInput}
                      onChange={(e) => setIdeaInput(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tone</label>
                        <Select value={ideaSettings.tone} onValueChange={(value) => 
                          setIdeaSettings(prev => ({ ...prev, tone: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TONE_OPTIONS.map(tone => (
                              <SelectItem key={tone.id} value={tone.id}>
                                {tone.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Platforms</label>
                        <div className="flex flex-wrap gap-3">
                          {Object.entries(PLATFORM_ICONS).map(([platform, { icon: Icon, color }]) => (
                            <div key={platform} className="flex items-center space-x-2">
                              <Checkbox
                                id={`idea-${platform}`}
                                checked={ideaSettings.platforms.includes(platform)}
                                onCheckedChange={(checked) => {
                                  setIdeaSettings(prev => ({
                                    ...prev,
                                    platforms: checked
                                      ? [...prev.platforms, platform]
                                      : prev.platforms.filter(p => p !== platform)
                                  }));
                                }}
                              />
                              <label htmlFor={`idea-${platform}`} className="flex items-center gap-2 cursor-pointer">
                                <Icon className={`w-4 h-4 ${color}`} />
                                <span className="capitalize">{platform}</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeHashtags"
                        checked={ideaSettings.includeHashtags}
                        onCheckedChange={(checked) => 
                          setIdeaSettings(prev => ({ ...prev, includeHashtags: checked }))
                        }
                      />
                      <label htmlFor="includeHashtags" className="text-sm">Include hashtags</label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeEmojis"
                        checked={ideaSettings.includeEmojis}
                        onCheckedChange={(checked) => 
                          setIdeaSettings(prev => ({ ...prev, includeEmojis: checked }))
                        }
                      />
                      <label htmlFor="includeEmojis" className="text-sm">Include emojis</label>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={convertIdeaToPost}
                    disabled={generating || !ideaInput.trim() || ideaSettings.platforms.length === 0}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Converting Idea...
                      </>
                    ) : (
                      <>
                        <ChevronRight className="w-4 h-4 mr-2" />
                        Convert to Professional Post
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Calendar */}
          <TabsContent value="calendar">
            <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-green-600" />
                  Content Calendar
                </CardTitle>
                <p className="text-gray-600">Schedule and manage your social media content</p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border"
                    />
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">
                      Scheduled for {format(selectedDate, 'PPP')}
                    </h3>
                    <div className="space-y-2">
                      {schedules
                        .filter(schedule => 
                          format(new Date(schedule.scheduled_date), 'yyyy-MM-dd') === 
                          format(selectedDate, 'yyyy-MM-dd')
                        )
                        .map(schedule => {
                          const content = contents.find(c => c.id === schedule.content_id);
                          const PlatformIcon = PLATFORM_ICONS[schedule.platform]?.icon || Share2;
                          
                          return (
                            <div key={schedule.id} className="p-3 border rounded-lg bg-gray-50">
                              <div className="flex items-center gap-2 mb-2">
                                <PlatformIcon className={`w-4 h-4 ${PLATFORM_ICONS[schedule.platform]?.color}`} />
                                <span className="font-medium capitalize">{schedule.platform}</span>
                                <Badge variant="outline" className="text-xs">
                                  {schedule.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {content?.title || 'Untitled Content'}
                              </p>
                              {content && (
                                <div className="mt-2 flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPreviewContent(content)}
                                    className="text-xs"
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    View
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      
                      {schedules.filter(schedule => 
                        format(new Date(schedule.scheduled_date), 'yyyy-MM-dd') === 
                        format(selectedDate, 'yyyy-MM-dd')
                      ).length === 0 && (
                        <p className="text-gray-500 text-sm">No content scheduled for this date</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Library */}
          <TabsContent value="library">
            <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-orange-600" />
                  Content Library
                </CardTitle>
                <p className="text-gray-600">View and manage all your generated content</p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contents.map(content => {
                    const category = CONTENT_CATEGORIES.find(c => c.id === content.category);
                    return (
                      <div key={content.id} className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{category?.emoji}</span>
                            <Badge variant="secondary" className="text-xs">
                              {content.tone}
                            </Badge>
                          </div>
                          <Badge variant={content.status === 'published' ? 'default' : 'outline'}>
                            {content.status}
                          </Badge>
                        </div>
                        
                        <h4 className="font-medium mb-2 line-clamp-2">{content.title}</h4>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-3">{content.content}</p>
                        
                        {/* Generated Date */}
                        {content.generated_date && (
                          <p className="text-xs text-gray-500 mb-2">
                            Generated: {format(new Date(content.generated_date), 'MMM d, yyyy h:mm a')}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex gap-1">
                            {content.platforms.map(platform => {
                              const PlatformIcon = PLATFORM_ICONS[platform]?.icon || Share2;
                              return (
                                <PlatformIcon 
                                  key={platform}
                                  className={`w-4 h-4 ${PLATFORM_ICONS[platform]?.color}`} 
                                />
                              );
                            })}
                          </div>
                          
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setPreviewContent(content)}
                              className="text-xs px-2 py-1"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Read
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => copyToClipboard(content.content, content.id)}
                              className="text-xs px-2 py-1"
                            >
                              {copiedStates[`${content.id}-main`] ? (
                                <>
                                  <Check className="w-3 h-3 mr-1 text-green-600" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 mr-1" />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {content.hashtags && content.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {content.hashtags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                            {content.hashtags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{content.hashtags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {contents.length === 0 && (
                  <div className="text-center py-12">
                    <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">No content yet</h3>
                    <p className="text-gray-500 mb-6">Start generating content to build your library</p>
                    <Button onClick={() => setActiveTab("generator")}>
                      <Plus className="w-4 h-4 mr-2" />
                      Generate Your First Post
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Content Preview Modal */}
        <ContentPreviewModal />
      </div>
    </div>
  );
}
