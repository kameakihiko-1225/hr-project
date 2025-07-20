import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, PlusCircle, Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { IndustryTag } from "@/types/company";
import { createLogger } from "@/lib/logger";
import api from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

const logger = createLogger('industryTagSelect');

interface IndustryTagSelectProps {
  selectedTags: IndustryTag[];
  onTagsChange: (tags: IndustryTag[]) => void;
  className?: string;
}

export function IndustryTagSelect({ 
  selectedTags, 
  onTagsChange,
  className 
}: IndustryTagSelectProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [availableTags, setAvailableTags] = useState<IndustryTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch available tags on mount
  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/industry-tags');
      
      if (response.success && response.data) {
        setAvailableTags(response.data);
      } else {
        // In development, use mock data
        if (import.meta.env.DEV) {
          const mockTags: IndustryTag[] = [
            { id: "tag-1", name: "Technology" },
            { id: "tag-2", name: "Healthcare" },
            { id: "tag-3", name: "Finance" },
            { id: "tag-4", name: "Education" },
            { id: "tag-5", name: "Manufacturing" },
            { id: "tag-6", name: "Retail" },
            { id: "tag-7", name: "Hospitality" },
            { id: "tag-8", name: "Transportation" },
            { id: "tag-9", name: "Energy" },
            { id: "tag-10", name: "Media" }
          ];
          setAvailableTags(mockTags);
        } else {
          logger.error('Failed to fetch industry tags', response.error);
          toast({
            title: "Error",
            description: "Failed to load industry tags",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      logger.error('Error fetching industry tags', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createTag = async (name: string) => {
    try {
      setIsCreating(true);
      
      // Check if tag already exists
      const existingTag = availableTags.find(
        tag => tag.name.toLowerCase() === name.toLowerCase()
      );
      
      if (existingTag) {
        // If tag exists but not selected, add it to selection
        if (!selectedTags.some(tag => tag.id === existingTag.id)) {
          handleSelectTag(existingTag);
        }
        return;
      }
      
      // Create new tag with LocalizedContent format
      const response = await api.post('/industry-tags', { 
        name: { 
          en: name,
          ru: name,
          uz: name
        }
      });
      
      if (response.success && response.data) {
        const newTag = response.data;
        
        // Add to available tags
        setAvailableTags(prev => [...prev, newTag]);
        
        // Add to selected tags
        handleSelectTag(newTag);
        
        toast({
          title: "Tag created",
          description: `Created new industry tag: ${name}`,
        });
      } else {
        // In development, create a mock tag
        if (import.meta.env.DEV) {
          const mockTag: IndustryTag = {
            id: `mock-tag-${Date.now()}`,
            name
          };
          
          // Add to available tags
          setAvailableTags(prev => [...prev, mockTag]);
          
          // Add to selected tags
          handleSelectTag(mockTag);
          
          toast({
            title: "Tag created (mock)",
            description: `Created new industry tag: ${name}`,
          });
        } else {
          logger.error('Failed to create industry tag', response.error);
          toast({
            title: "Error",
            description: "Failed to create industry tag",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      logger.error('Error creating industry tag', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
      setInputValue("");
    }
  };

  const handleSelectTag = (tag: IndustryTag) => {
    // Add tag to selected tags if not already selected
    if (!selectedTags.some(t => t.id === tag.id)) {
      const updatedTags = [...selectedTags, tag];
      onTagsChange(updatedTags);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    const updatedTags = selectedTags.filter(tag => tag.id !== tagId);
    onTagsChange(updatedTags);
  };

  const filteredTags = inputValue === ""
    ? availableTags
    : availableTags.filter(tag =>
        tag.name.toLowerCase().includes(inputValue.toLowerCase())
      );

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map((tag, index) => (
          <Badge 
            key={tag.id || `selected-tag-${index}`} 
            variant="secondary" 
            className="flex items-center gap-1 px-3 py-1"
          >
            <Tag className="h-3 w-3" />
            {tag.name}
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 ml-1 hover:bg-muted rounded-full"
              onClick={() => handleRemoveTag(tag.id)}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {tag.name}</span>
            </Button>
          </Badge>
        ))}
      </div>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedTags.length > 0
              ? `${selectedTags.length} industry tag${selectedTags.length > 1 ? "s" : ""} selected`
              : "Select industry tags..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Search industry..." 
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? (
                  <div className="py-6 text-center text-sm">Loading tags...</div>
                ) : (
                  <div className="py-6 text-center text-sm">
                    No industry found. Create a new one?
                  </div>
                )}
              </CommandEmpty>
              
              <CommandGroup heading="Available Industries">
                {filteredTags.map((tag, index) => (
                  <CommandItem
                    key={tag.id || `filtered-tag-${index}`}
                    value={tag.name}
                    onSelect={() => {
                      handleSelectTag(tag);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedTags.some(t => t.id === tag.id) 
                          ? "opacity-100" 
                          : "opacity-0"
                      )}
                    />
                    {tag.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              
              {inputValue && !filteredTags.some(tag => 
                tag.name.toLowerCase() === inputValue.toLowerCase()
              ) && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      key="create-new-tag"
                      onSelect={() => {
                        createTag(inputValue);
                        setOpen(false);
                      }}
                      disabled={isCreating}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create "{inputValue}"
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
} 