import React, { useState } from 'react';
import { Position } from '../types/position';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Pencil, Trash2, Building2, Briefcase, DollarSign, Clock, MapPin, Send, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/authContext';
import { getBotByAdminId, createCandidateDeepLink, createPositionDeepLink } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { createLogger } from '@/lib/logger';
import { useClickCounter } from '@/contexts/ClickCounterContext';

const logger = createLogger('positionCard');

interface PositionCardProps {
  position: Position;
  onEdit?: (position: Position) => void;
  onDelete?: (position: Position) => void;
  showDepartment?: boolean;
}

export function PositionCard({ position, onEdit, onDelete, showDepartment = false }: PositionCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { admin } = useAuth();
  const [isApplying, setIsApplying] = useState(false);
  const { incrementJobSeekers, incrementApplicants } = useClickCounter();

  const handleEdit = () => {
    if (onEdit) {
      onEdit(position);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(position);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleLogoError = () => {
    logger.warn(`Failed to load logo for company: ${companyName}`);
    setLogoError(true);
  };

  const handleApply = async () => {
    // Increment counters for any apply button click
    incrementJobSeekers();
    incrementApplicants();

    // If position has a direct apply link, use it
    if (position.applyLink) {
      window.open(position.applyLink, '_blank', 'noopener,noreferrer');
      toast({ 
        title: 'Redirected to Application', 
        description: 'You\'ve been redirected to the application form.' 
      });
      return;
    }

    if (isApplying) return;

    try {
      setIsApplying(true);

      // For now, since we don't have bot functionality set up, show a simple message
      toast({ 
        title: 'Application Initiated', 
        description: `Thank you for your interest in the ${position.title} position! You will be contacted soon.` 
      });
      
      // In a real implementation, this would integrate with Telegram bot or other application system
      console.log(`Application submitted for position: ${position.title} (ID: ${position.id})`);
    } catch (error: any) {
      console.error('Apply via AI error:', error);
      toast({ title: 'Error', description: error?.message || 'Something went wrong' });
    } finally {
      setIsApplying(false);
    }
  };

  // ----------------- derive company & helper -----------------
  const company = position.company ?? position.departments?.[0]?.department?.company;
  const companyName = company?.name || 'Company';
  const companyLogoUrl = company?.logoUrl || null;
  const postedAgo = position.createdAt ? formatDistanceToNow(new Date(position.createdAt), { addSuffix: true }) : '';

  const CompanyAvatar = () => (
    <Avatar className="h-10 w-10 ring-2 ring-offset-2 ring-offset-background ring-blue-500/40 group-hover:ring-blue-500/70 transition-shadow duration-300 shadow-lg group-hover:shadow-xl">
      {companyLogoUrl && !logoError ? (
        <AvatarImage 
          src={companyLogoUrl} 
          alt={companyName} 
          decoding="async" 
          loading="lazy"
          onError={handleLogoError} 
        />
      ) : (
        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-semibold">
          {companyName.charAt(0)}
        </AvatarFallback>
      )}
    </Avatar>
  );

  return (
    <Card
      tabIndex={0}
      role="button"
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleApply();
      }}
      className="animate-fade-in group relative overflow-hidden border border-border bg-white/60 dark:bg-white/5 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500/40 hover:shadow-xl hover:-translate-y-1 hover:rotate-[0.3deg] focus:-translate-y-1 focus:rotate-[0.3deg] transition-transform duration-150 hover-neon-beige"
    >
      {/* glass reflection */}
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      {/* gradient ring on hover */}
      <span className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-blue-600/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Edit / Delete buttons */}
      {(onEdit || onDelete) && (
        <div className="absolute top-2 right-2 flex gap-1 z-20">
          {onEdit && (
            <Button variant="ghost" size="icon" onClick={handleEdit} className="h-7 w-7">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Position</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete the position "{position.title}"? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}

      <CardHeader className="flex items-start gap-3 pb-2 relative z-10">
        <CompanyAvatar />
        <div className="flex-1">
          <h3 className="font-semibold text-sm leading-tight text-foreground flex items-center gap-2 hover-neon-beige-text">
            {companyName}
          </h3>
          {showDepartment && Array.isArray(position.departments) && position.departments.length > 0 && (
            <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {position.departments.map((dp, idx) => (
                <span key={dp.department.id} className="flex items-center">
                  {dp.department.name}
                  {idx < position.departments.length - 1 && <span className="mx-1">|</span>}
                </span>
              ))}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-4 relative z-10">
        <CardTitle className="text-base font-semibold tracking-tight leading-snug text-foreground group-hover:text-primary line-clamp-2 hover-neon-beige-text">
          {position.title}
        </CardTitle>

        {position.description && (
          <p className="text-xs text-muted-foreground line-clamp-3">
            {position.description}
          </p>
        )}

        {/* Salary after description */}
        {position.salaryRange && (
          <p className="text-xs font-medium text-foreground flex items-center gap-1 mt-1">
            <DollarSign className="h-3 w-3 hover-neon-beige-text" /> {position.salaryRange}
          </p>
        )}

        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
          {position.city && (
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3 hover-neon-beige-text" /> {position.city}{position.country ? `, ${position.country}` : ''}</span>
          )}
          {position.employmentType && (
            <span className="flex items-center gap-1"><Briefcase className="h-3 w-3 hover-neon-beige-text" /> {position.employmentType}</span>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-center gap-2 border-t border-border pt-3 relative z-10">
        {postedAgo && (
          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {postedAgo}</span>
        )}

        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" onClick={() => setIsDetailsDialogOpen(true)}>View Details</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{position.title}</DialogTitle>
              <DialogDescription>Position Details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {position.description || 'No description provided'}
                </p>
              </div>
              
              {position.salaryRange && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Salary Range</h4>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>{position.salaryRange}</span>
                  </div>
                </div>
              )}
              
              {position.employmentType && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Employment Type</h4>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span>{position.employmentType}</span>
                  </div>
                </div>
              )}
              
              {showDepartment && position.department && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Department</h4>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{position.department.name}</span>
                  </div>
                  {position.department.company && (
                    <div className="flex items-center gap-2 mt-1 ml-6">
                      <span className="text-sm text-muted-foreground">
                        {position.department.company.name}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {position.applyLink && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Apply Link</h4>
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    <a 
                      href={position.applyLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate max-w-[250px]"
                    >
                      {position.applyLink}
                    </a>
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium mb-2">Created</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date(position.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {position.applyLink ? (
          <button
            onClick={handleApply}
            className="px-6 py-1.5 text-xs font-medium rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-1 hover-neon-beige"
          >
            Apply Now <ExternalLink className="h-3 w-3" />
          </button>
        ) : (
          <Button
            onClick={handleApply}
            disabled={isApplying}
            className="px-6 py-1.5 text-xs font-medium rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:from-blue-600/90 hover:to-indigo-600/90 transition-all flex items-center gap-1 disabled:opacity-60 hover-neon-beige"
          >
            {isApplying ? 'Generating…' : 'Apply Now'} <Send className="h-3 w-3" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}