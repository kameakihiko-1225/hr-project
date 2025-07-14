import { useState, useRef, useEffect } from "react";
import { Building, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { createLogger } from "@/lib/logger";
import { validateFile, createLocalFileUrl, revokeLocalFileUrl, resizeImageFile } from "@/lib/fileUpload";
import { toast } from "./ui/use-toast";
import api from "@/lib/api";

const logger = createLogger('companyLogoUpload');

// Use local placeholder image
const PLACEHOLDER_IMAGE = '/placeholder.svg';

interface CompanyLogoUploadProps {
  initialLogo?: string;
  onLogoChange: (logoUrl: string | null) => void;
  className?: string;
  companyId?: string;
}

export function CompanyLogoUpload({ 
  initialLogo, 
  onLogoChange,
  className = "",
  companyId
}: CompanyLogoUploadProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Set initial logo on mount
  useEffect(() => {
    // Only set non-blob initial logos directly
    // For blob URLs, we should create new ones to avoid stale references
    if (initialLogo && !initialLogo.startsWith('blob:')) {
      setLogoPreview(initialLogo);
    }
  }, [initialLogo]);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith('blob:')) {
        try {
          revokeLocalFileUrl(logoPreview);
        } catch (error) {
          logger.error('Error revoking blob URL', error);
        }
      }
    };
  }, [logoPreview]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsUploading(true);
      logger.debug(`Logo file selected: ${file.name}`);
      
      // Resize image before upload
      const resizedFile = await resizeImageFile(file, 400, 400);
      
      // Clean up previous preview if exists
      if (logoPreview && logoPreview.startsWith('blob:')) {
        try {
          revokeLocalFileUrl(logoPreview);
        } catch (error) {
          logger.error('Error revoking previous blob URL', error);
        }
      }
      
      // Create a temporary URL for preview
      const previewUrl = createLocalFileUrl(resizedFile);
      setLogoPreview(previewUrl);
      
      // Pass the local URL to parent for immediate preview
      onLogoChange(previewUrl);
      
      // Upload the file using API client
      try {
        // Create additional data object if companyId exists
        const additionalData: Record<string, string> = {};
        if (companyId) {
          additionalData.companyId = companyId;
        }
        
        // Upload file to company-specific endpoint
        const endpoint = companyId ? `/companies/${companyId}/logo` : '/companies/logo';
        
        // Use 'logo' as the parameter name instead of 'file' for company logo uploads
        const formData = new FormData();
        formData.append('logo', resizedFile);
        
        // Add additional data to form data
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });
        
        // Make the request directly instead of using uploadFile
        const response = await api.post(endpoint, formData);
        
        if (response.success && response.data?.logoUrl) {
          // Clean up the temporary preview URL
          if (previewUrl) {
            revokeLocalFileUrl(previewUrl);
          }
          
          const uploadedUrl = response.data.logoUrl;
          
          // Set the uploaded URL as the preview
          setLogoPreview(uploadedUrl);
          
          // Pass the URL to the parent component
          onLogoChange(uploadedUrl);
          
          toast({
            title: "Logo uploaded",
            description: "Logo has been successfully uploaded",
          });
        } else {
          logger.warn('Upload response not successful or missing logoUrl', response);
          throw new Error(response.error || 'Upload failed');
        }
      } catch (uploadError) {
        logger.error('Error uploading file to storage', uploadError);
        
        // Keep the local preview but notify about upload failure
        toast({
          title: "Upload failed",
          description: "Failed to upload to server, using local preview instead",
          variant: "destructive",
        });
        
        // We already passed the local URL to parent for temporary use
      }
    } catch (error) {
      logger.error("Error processing logo upload", error);
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your logo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleImageError = () => {
    logger.warn("Logo preview image failed to load");
    setLogoPreview(null);
    onLogoChange(null);
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="h-16 w-16 rounded-md border flex items-center justify-center overflow-hidden bg-gray-50">
        {logoPreview ? (
          <img 
            src={logoPreview} 
            alt="Logo preview" 
            className="h-full w-full object-cover"
            onError={handleImageError}
          />
        ) : initialLogo && !initialLogo.startsWith('blob:') ? (
          <img 
            src={initialLogo} 
            alt="Company logo" 
            className="h-full w-full object-contain"
            onError={handleImageError}
          />
        ) : (
          <Building className="h-8 w-8 text-gray-400" />
        )}
      </div>
      <div className="space-y-2">
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={triggerFileInput}
          disabled={isUploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? "Uploading..." : "Upload Logo"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          className="hidden"
        />
        <p className="text-xs text-gray-500">
          Recommended: 400x400px, PNG or JPG
        </p>
      </div>
    </div>
  );
} 