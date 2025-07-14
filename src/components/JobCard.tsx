import {
  Briefcase,
  MapPin,
  User2,
  Award,
  DollarSign,
  Send,
  GraduationCap,
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import React from 'react';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Job {
  id: number;
  title: string;
  company: string;
  companyLogoUrl?: string | null;
  department: string;
  location: string;
  type: string;
  salary: string;
  experience: string;
  skills: string[];
  description: string;
  postedDate: string;
  applicants: number;
  remote: boolean;
}

interface JobCardProps {
  job: Job;
  index?: number;
  orientation?: "horizontal" | "vertical";
}

export const JobCard = ({ job, index = 0, orientation = "vertical" }: JobCardProps) => {
  const handleApplyClick = () => {
    // TODO: Replace with router push or deep-link invocation
    alert(`You\'ll be redirected to Telegram to chat with ${job.company}\'s AI recruiter!`);
  };

  const DelayWrapper = (children: React.ReactNode) => (
    <div style={{ animationDelay: `${index * 75}ms` }} className="animate-fade-in">
      {children}
    </div>
  );

  const CompanyAvatar = () => (
    <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-offset-background ring-blue-500/40 group-hover:ring-blue-500/70 transition-shadow duration-300 shadow-lg group-hover:shadow-xl">
      {job.companyLogoUrl ? (
        <AvatarImage src={job.companyLogoUrl} alt={job.company} decoding="async" loading="lazy" />
      ) : (
        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-semibold">
          {job.company.charAt(0)}
        </AvatarFallback>
      )}
    </Avatar>
  );

  // format posted date human-readable
  const postedAgo = formatDistanceToNow(new Date(job.postedDate), { addSuffix: true });

  // HORIZONTAL (mobile-friendly) =================================================================
  if (orientation === "horizontal") {
    return DelayWrapper(
      <Card className="flex flex-row gap-4 items-start group border border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-lg transition-all duration-300">
        <CardHeader className="p-4 pb-3 flex-none">
          <CompanyAvatar />
        </CardHeader>
        <CardContent className="flex-grow p-4 pt-3">
          {/* company + remote tag */}
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-gray-900 line-clamp-1">
              {job.company}
            </span>
            {job.remote && (
              <Badge variant="outline" className="border-green-300 text-green-600 bg-green-50">
                Remote
              </Badge>
            )}
          </div>
          <CardTitle className="text-base font-bold leading-snug text-gray-900 group-hover:text-blue-600 line-clamp-1">
            {job.title}
          </CardTitle>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
            <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {job.experience}</span>
            <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {job.salary}</span>
          </div>
        </CardContent>
        <CardFooter className="pr-4 pb-4 flex-none">
          <button
            aria-label={`Apply Now for ${job.title} at ${job.company}`}
            onClick={handleApplyClick}
            className="px-3 py-1.5 text-xs rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow hover:from-blue-700 hover:to-indigo-700 flex items-center gap-1"
          >
            Apply Now
            <Send className="h-3 w-3" />
          </button>
        </CardFooter>
      </Card>
    );
  }

  // VERTICAL (default) ===========================================================================
  return DelayWrapper(
    <Card
      tabIndex={0}
      role="button"
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleApplyClick();
      }}
      className="group relative overflow-hidden border border-border bg-white/60 dark:bg-white/5 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500/40 hover:shadow-xl hover:-translate-y-1 hover:rotate-[0.3deg] focus:-translate-y-1 focus:rotate-[0.3deg] transition-transform duration-150">
      {/* glass reflection */}
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      {/* gradient ring on hover */}
      <span className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-blue-600/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

      <CardHeader className="flex items-start gap-3 pb-2 relative z-10">
        <CompanyAvatar />
        <div className="flex-1">
          <h3 className="font-semibold text-sm leading-tight text-foreground flex items-center gap-2">
            {job.company}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1">{job.department}</p>
        </div>
        {/* salary ribbon */}
        <span className="absolute -top-4 -right-6 rotate-45 bg-gradient-to-r from-indigo-600 to-primary text-white shadow px-10 py-0.5 text-[10px] font-medium">
          {job.salary}
        </span>
        {job.remote && (
          <Badge variant="secondary" className="absolute top-2 right-2 text-[10px] bg-green-600 text-white border-0 shadow">
            Remote
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-3 pb-4 relative z-10">
        <CardTitle className="text-base font-semibold tracking-tight leading-snug text-foreground group-hover:text-primary line-clamp-2">
          {job.title}
        </CardTitle>

        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
          <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {job.experience}</span>
          <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {job.salary}</span>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-3">{job.description}</p>

        {/* skills */}
        {job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {job.skills.slice(0, 4).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs bg-muted text-muted-foreground">
                {skill}
              </Badge>
            ))}
            {job.skills.length > 4 && (
              <Badge variant="secondary" className="text-xs">+{job.skills.length - 4}</Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col items-center gap-2 border-t border-border pt-3 relative z-10">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <User2 className="h-3 w-3" /> {job.applicants} • <Award className="h-3 w-3" /> {postedAgo}
        </span>
        <button
          aria-label={`Apply Now for ${job.title} at ${job.company}`}
          onClick={handleApplyClick}
          className="px-6 py-1.5 text-xs font-medium rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:from-blue-600/90 hover:to-indigo-600/90 transition-all flex items-center gap-1"
        >
          Apply Now <Send className="h-3 w-3" />
        </button>
      </CardFooter>
    </Card>
  );
};
