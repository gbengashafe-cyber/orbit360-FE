import React, { useState, useEffect } from "react";
import { SocialPost } from "@/api/entities";
import { GenerateImage, InvokeLLM } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import {
  Share2,
  Calendar as CalendarIcon,
  Image as ImageIcon,
  Plus,
  ExternalLink,
  Linkedin,
  Facebook,
  Twitter,
  Sparkles
} from "lucide-react";

const PLATFORMS = [
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-blue-600" },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "text-blue-800" },
  { id: "twitter", name: "Twitter/X", icon: Twitter, color: "text-gray-900" }
];

const POST_TYPES = [
  "company_update",
  "job_posting",
  "training_program",
  "general",
  "achievement"
];

export default function SocialHub() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [postData, setPostData] = useState({
    title: "",
    content: "",
    image_url: "",
    platforms: [],
    scheduled_date: null,
    post_type: "general",
    tags: []
  });
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const postsData = await SocialPost.list('-created_date');
      setPosts(postsData);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    try {
      await SocialPost.create({
        ...postData,
        scheduled_date: postData.scheduled_date?.toISOString(),
        tags: postData.tags.filter(tag => tag.trim())
      });
      setShowCreateForm(false);
      resetForm();
      loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleSharePost = (post, platform) => {
    const shareUrls = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}&title=${encodeURIComponent(post.title)}&summary=${encodeURIComponent(post.content)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(post.content)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.content)}&url=${encodeURIComponent(window.location.origin)}`
    };

    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  };

  const handleGenerateContent = async () => {
    if (!postData.title) {
      alert('Please add a title first to generate relevant content.');
      return;
    }
    setGeneratingContent(true);
    try {
      const platformNames = postData.platforms.map(p => PLATFORMS.find(pf => pf.id === p)?.name).join(', ') || 'social media';
      
      const prompt = `Create an engaging social media post for ${platformNames} with the title "${postData.title}" and post type "${postData.post_type}".

IMPORTANT FORMATTING REQUIREMENTS:
- Write in a warm, professional, and engaging tone
- Use clean, readable formatting with proper line breaks
- NO special characters like asterisks (*), hashtags in the main content, or excessive punctuation
- Make it conversational and human-like, not robotic
- Use simple paragraphs with natural flow
- Include relevant hashtags separately (3-5 hashtags)
- Keep it appropriate for professional networking
- Make it feel authentic and relatable

The content should be inspiring, informative, or engaging depending on the post type. Avoid marketing jargon and keep it genuine.`;

      const response = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            content: { 
              type: "string", 
              description: "The main social media post content, clean and well-formatted without special characters" 
            },
            hashtags: { 
              type: "array", 
              items: { type: "string" }, 
              description: "3-5 relevant hashtags without the # symbol, professional and appropriate" 
            }
          },
          required: ["content", "hashtags"]
        }
      });

      if (response && response.content) {
        // Clean the content to ensure no unwanted characters
        const cleanedContent = response.content
          .replace(/\*\*/g, '') // Remove bold asterisks
          .replace(/\*/g, '') // Remove single asterisks
          .replace(/#{1,6}\s/g, '') // Remove markdown headers
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert markdown links to plain text
          .replace(/`([^`]+)`/g, '$1') // Remove code backticks
          .replace(/_{2,}/g, '') // Remove underscores
          .replace(/\n{3,}/g, '\n\n') // Limit to double line breaks max
          .trim();

        setPostData(prev => ({
          ...prev,
          content: cleanedContent,
          tags: response.hashtags || prev.tags
        }));
      }
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!postData.title && !postData.content) {
      alert('Please add a title or content first to generate a relevant image.');
      return;
    }

    setGeneratingImage(true);
    try {
      const prompt = `Professional business post image for: ${postData.title || postData.content.substring(0, 100)}. Corporate, modern, clean design.`;
      const result = await GenerateImage({ prompt });
      setPostData(prev => ({ ...prev, image_url: result.url }));
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setGeneratingImage(false);
    }
  };

  const resetForm = () => {
    setPostData({
      title: "",
      content: "",
      image_url: "",
      platforms: [],
      scheduled_date: null,
      post_type: "general",
      tags: []
    });
  };

  const handlePlatformToggle = (platform) => {
    setPostData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  if (loading) {
    return <div className="p-8 text-center">Loading social hub...</div>;
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Social Media Hub</h1>
              <p className="text-gray-600">Create and share beautiful content across LinkedIn, Facebook, and Twitter</p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white shadow-lg shadow-blue-700/25"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Post
          </Button>
        </div>

        {/* Create Post Form */}
        {showCreateForm && (
          <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
            <CardHeader>
              <CardTitle>Create New Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Post Title *</Label>
                  <Input
                    id="title"
                    value={postData.title}
                    onChange={(e) => setPostData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Engaging post title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="post_type">Post Type</Label>
                  <Select value={postData.post_type} onValueChange={(value) => setPostData(prev => ({ ...prev, post_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POST_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="content">Content *</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateContent}
                    disabled={generatingContent || !postData.title}
                    className="text-xs bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:from-purple-100 hover:to-blue-100"
                  >
                    <Sparkles className="w-3 h-3 mr-2 text-purple-600" />
                    {generatingContent ? "Generating..." : "Generate AI Content"}
                  </Button>
                </div>
                <Textarea
                  id="content"
                  value={postData.content}
                  onChange={(e) => setPostData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your post content here... or generate beautiful, engaging content with AI"
                  rows={6}
                  className="font-sans leading-relaxed"
                />
                <p className="text-xs text-gray-500">
                  AI will create warm, engaging content with perfect formatting - no special characters or robotic tone.
                </p>
              </div>

              {/* Platform Selection */}
              <div className="space-y-2">
                <Label>Select Platforms</Label>
                <div className="flex flex-wrap gap-3">
                  {PLATFORMS.map((platform) => (
                    <Button
                      key={platform.id}
                      variant={postData.platforms.includes(platform.id) ? "default" : "outline"}
                      onClick={() => handlePlatformToggle(platform.id)}
                      className={`flex items-center gap-2 ${
                        postData.platforms.includes(platform.id)
                          ? "bg-blue-600 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      <platform.icon className={`w-4 h-4 ${platform.color}`} />
                      {platform.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Image Generation */}
              <div className="space-y-2">
                <Label>Post Image</Label>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleGenerateImage}
                    disabled={generatingImage}
                    className="border-gray-300"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    {generatingImage ? "Generating..." : "Generate AI Image"}
                  </Button>
                  <Input
                    placeholder="Or paste image URL"
                    value={postData.image_url}
                    onChange={(e) => setPostData(prev => ({ ...prev, image_url: e.target.value }))}
                  />
                </div>
                {postData.image_url && (
                  <img src={postData.image_url} alt="Post preview" className="w-32 h-32 object-cover rounded-lg border" />
                )}
              </div>

              {/* Hashtags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Hashtags (comma separated)</Label>
                <Input
                  id="tags"
                  placeholder="#HR #training #leadership"
                  value={postData.tags.join(', ')}
                  onChange={(e) => setPostData(prev => ({ ...prev, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t !== '') }))}
                />
                <p className="text-xs text-gray-500">
                  AI-generated hashtags will be professionally curated and relevant to your content.
                </p>
              </div>

              {/* Scheduling */}
              <div className="flex items-center gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="border-gray-300">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {postData.scheduled_date ? format(postData.scheduled_date, 'PPP p') : 'Schedule for later'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={postData.scheduled_date}
                      onSelect={(date) => setPostData(prev => ({ ...prev, scheduled_date: date }))}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreatePost}
                  className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white"
                  disabled={!postData.title || !postData.content || postData.platforms.length === 0}
                >
                  Create Post
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Card key={post.id} className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{post.title}</CardTitle>
                  <Badge variant="secondary">{post.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {post.image_url && (
                  <img src={post.image_url} alt="Post" className="w-full h-32 object-cover rounded-lg" />
                )}
                <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{post.content}</p>

                <div className="flex flex-wrap gap-2">
                  {post.platforms?.map((platform) => {
                    const platformConfig = PLATFORMS.find(p => p.id === platform);
                    if (!platformConfig) return null;
                    return (
                      <Button
                        key={platform}
                        size="sm"
                        variant="outline"
                        onClick={() => handleSharePost(post, platform)}
                        className="border-gray-300"
                      >
                        <platformConfig.icon className={`w-3 h-3 mr-1 ${platformConfig.color}`} />
                        Share
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    );
                  })}
                </div>

                {post.tags && (
                  <div className="flex flex-wrap gap-1">
                    {post.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {posts.length === 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
            <CardContent className="p-12 text-center">
              <Share2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2 text-gray-700">No posts yet</h3>
              <p className="text-gray-500 mb-6">Create your first beautifully formatted social media post</p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Post
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}