import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, GitFork, Camera, Edit3, Save, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import html2canvas from 'html2canvas';

interface DashboardHeaderProps {
  dashboard: {
    id: string;
    name: string;
    slug: string;
    isPrivate: boolean;
    isPublished?: boolean;
    userId: string;
    createdAt: string;
  };
  isEditing: boolean;
  onEditToggle: () => void;
  onSave?: () => void;
  onPublish?: () => void;
}

export function DashboardHeader({ dashboard, isEditing, onEditToggle, onSave, onPublish }: DashboardHeaderProps) {
  const [sharing, setSharing] = useState(false);
  const [screenshotting, setScreenshotting] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    try {
      const shareUrl = `${window.location.origin}/d/${dashboard.userId}/${dashboard.slug}`;
      await navigator.clipboard.writeText(shareUrl);
      // Show toast notification
    } catch (error) {
      console.error('Failed to share:', error);
    } finally {
      setSharing(false);
    }
  };

  const handleFork = () => {
    const forkedDashboard = {
      ...dashboard,
      id: `dash_${Date.now()}`,
      name: `${dashboard.name} (forked)`,
      slug: `${dashboard.slug}-fork-${Date.now()}`,
      userId: 'demo_user',
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem(`dashboard_${forkedDashboard.id}`, JSON.stringify(forkedDashboard));
    window.location.href = `/dashboard/${forkedDashboard.userId}/${forkedDashboard.slug}?id=${forkedDashboard.id}`;
  };

  const handleScreenshot = async () => {
    setScreenshotting(true);
    try {
      const element = document.getElementById('dashboard-content');
      if (element) {
        const canvas = await html2canvas(element);
        const link = document.createElement('a');
        link.download = `${dashboard.slug}-screenshot.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
    } catch (error) {
      console.error('Failed to take screenshot:', error);
    } finally {
      setScreenshotting(false);
    }
  };

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold">{dashboard.name}</h1>
          <div className="flex items-center space-x-2">
            {dashboard.isPrivate && (
              <Badge variant="secondary" className="text-xs">Private</Badge>
            )}
            {dashboard.isPublished && (
              <Badge variant="default" className="text-xs bg-green-500">Published</Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            disabled={sharing}
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFork}
          >
            <GitFork className="h-4 w-4" />
            Fork
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleScreenshot}
            disabled={screenshotting}
          >
            <Camera className="h-4 w-4" />
            {screenshotting ? 'Capturing...' : 'Screenshot'}
          </Button>
          
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <Button
                variant="default"
                size="sm"
                onClick={onSave}
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onEditToggle}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                variant="default"
                size="sm"
                onClick={onEditToggle}
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </Button>
              {!dashboard.isPublished && onPublish && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPublish}
                  className="bg-green-500 text-white hover:bg-green-600"
                >
                  Publish
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}