import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { aiChat, ChatMessage } from '@/lib/ai';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getPositions, updatePosition, ApiResponse } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import api from '@/lib/api';
import { format } from 'date-fns';

export default function AiTrainerPage() {
  const { toast } = useToast();
  const { admin } = useAuth();
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [positions, setPositions] = useState<any[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState<string>('');
  const [positionSearch, setPositionSearch] = useState('');

  const [systemMsg, setSystemMsg] = useState<string>('You are an HR assistant. Generate 5 concise interview questions for the given job description.');
  const [files, setFiles] = useState<File[]>([]);

  const [expectedStartDate, setExpectedStartDate] = useState<string>('');
  const [languageReq, setLanguageReq] = useState<string>('');
  const [responsibilities, setResponsibilities] = useState<string>('');
  const [skipExpectedDate, setSkipExpectedDate] = useState(false);
  const [skipLangReq, setSkipLangReq] = useState(false);
  const [skipResponsibilities, setSkipResponsibilities] = useState(false);
  const [docStats, setDocStats] = useState<{ documents: number; chunks: number }>({ documents: 0, chunks: 0 });

  // Load positions on mount
  useEffect(() => {
    (async () => {
      try {
        const all: any[] = await getPositions();
        setPositions(all);
      } catch (e) {
        console.error('Failed to load positions', e);
      }
    })();
  }, []);

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast({ title: 'Validation', description: 'Please enter a position description', variant: 'destructive' });
      return;
    }

    if (!skipExpectedDate && !expectedStartDate.trim()) {
      toast({ title: 'Validation', description: 'Please set expected start date or choose not set', variant: 'destructive' });
      return;
    }
    if (!skipLangReq && !languageReq.trim()) {
      toast({ title: 'Validation', description: 'Please set language requirements or choose not set', variant: 'destructive' });
      return;
    }
    if (!skipResponsibilities && !responsibilities.trim()) {
      toast({ title: 'Validation', description: 'Please set responsibilities or choose not set', variant: 'destructive' });
      return;
    }

    const uploadedLinks: string[] = [];
    for (const f of files) {
      try {
        const resp = await api.uploadFile('/files', f, selectedPositionId ? { positionId: selectedPositionId } : {});
        if (resp.success && resp.data?.id) {
          uploadedLinks.push(`${location.origin}/api/files/${resp.data.id}`);
        }
      } catch (e) {
        console.warn('File upload failed', e);
      }
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: systemMsg.trim() },
      { role: 'user', content: `${description.trim()}${uploadedLinks.length ? `\n\nReference documents:\n${uploadedLinks.join('\n')}` : ''}` }
    ];

    setLoading(true);
    setResult([]);
    try {
      const content = await aiChat(messages, 'gpt-3.5-turbo-0125', 0.7);
      // Split by newline or number bullets
      const questions = content.split(/\n|\r/).filter(q => q.trim()).map(q => q.replace(/^\d+\.?\s*/, ''));
      setResult(questions);

      // Persist the details + generated questions if a position selected
      if (selectedPositionId) {
        try {
          const payload: any = {
            ...(skipExpectedDate ? {} : { expectedStartDate }),
            ...(skipLangReq ? {} : { languageRequirements: languageReq }),
            ...(skipResponsibilities ? {} : { responsibilities }),
            interviewQuestions: questions
          };
          await updatePosition(selectedPositionId, payload);
        } catch (e) {
          console.warn('Failed to save questions/fields', e);
        }
      }

      // refresh document stats if position selected
      if (selectedPositionId) {
        try {
          const statsResp = await api.get(`/positions/${selectedPositionId}/documents`);
          if (statsResp.success && statsResp.data) {
            setDocStats({
              documents: statsResp.data.documents.length,
              chunks: statsResp.data.totalChunks
            });
          }
        } catch (e) { /* ignore */ }
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to generate questions', variant: 'destructive' });
    } finally {
      setLoading(false);
      setFiles([]);
    }
  };

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-80px)] flex flex-col md:flex-row gap-6 py-6 px-4 md:px-8">
        {/* Left configuration panel */}
        <div className="w-full md:w-72 flex-shrink-0 space-y-6 overflow-auto">
          <h2 className="text-lg font-semibold">Prompt Config</h2>

          {positions.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Position</label>
              <Select value={selectedPositionId} onValueChange={async (val) => {
                setSelectedPositionId(val);
                const pos = positions.find(p => p.id === val);
                if (pos) {
                  setDescription(pos.description || '');
                  setExpectedStartDate(pos.expectedStartDate ? format(new Date(pos.expectedStartDate), 'yyyy-MM-dd') : '');
                  setLanguageReq(pos.languageRequirements || '');
                  setResponsibilities(pos.responsibilities || '');
                }

                // refresh stats when position changes
                if (val) {
                  try {
                    const stats = await api.get(`/positions/${val}/documents`);
                    if (stats.success && stats.data) {
                      setDocStats({
                        documents: stats.data.documents.length,
                        chunks: stats.data.totalChunks
                      });
                    }
                  } catch (e) { /* ignore */ }
                }
              }}>
                <SelectTrigger id="position">
                  <SelectValue placeholder="Choose position (optional)" />
                </SelectTrigger>
                <SelectContent className="max-h-72 overflow-y-auto space-y-1 p-2">
                  <input
                    type="text"
                    value={positionSearch}
                    onChange={e=>setPositionSearch(e.target.value)}
                    placeholder="Search positions…"
                    className="w-full border rounded-md px-2 py-1 text-sm mb-2 focus:outline-none"
                  />
                  {positions
                    .filter(p=>p.title.toLowerCase().includes(positionSearch.toLowerCase()))
                    .map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  {positions.filter(p=>p.title.toLowerCase().includes(positionSearch.toLowerCase())).length===0 && (
                    <p className="text-xs text-muted-foreground px-2 py-1">No positions found</p>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium">System message</label>
            <Textarea value={systemMsg} onChange={e=>setSystemMsg(e.target.value)} className="min-h-[100px]" />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Job description</label>
            <Textarea value={description} onChange={e=>setDescription(e.target.value)} className="min-h-[120px]" />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Upload document</label>
            <input type="file" multiple accept=".pdf,.doc,.docx,.md,.markdown,.txt" onChange={e=>setFiles(Array.from(e.target.files || []))} className="text-sm" />
            {files.length > 0 && <p className="text-xs text-muted-foreground">{files.length} file(s) selected</p>}
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium flex items-center gap-2">Expected Start Date
                <input type="checkbox" className="ml-auto" checked={skipExpectedDate} onChange={e=>setSkipExpectedDate(e.target.checked)} />
                <span className="text-xs text-muted-foreground">Not set for now</span>
              </label>
              <input type="date" value={expectedStartDate} onChange={e=>setExpectedStartDate(e.target.value)} disabled={skipExpectedDate} className="w-full border rounded-md px-2 py-1 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium flex items-center gap-2">Language Requirements
                <input type="checkbox" className="ml-auto" checked={skipLangReq} onChange={e=>setSkipLangReq(e.target.checked)} />
                <span className="text-xs text-muted-foreground">Not set for now</span>
              </label>
              <Textarea value={languageReq} onChange={e=>setLanguageReq(e.target.value)} disabled={skipLangReq} className="min-h-[60px]" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium flex items-center gap-2">Responsibilities
                <input type="checkbox" className="ml-auto" checked={skipResponsibilities} onChange={e=>setSkipResponsibilities(e.target.checked)} />
                <span className="text-xs text-muted-foreground">Not set for now</span>
              </label>
              <Textarea value={responsibilities} onChange={e=>setResponsibilities(e.target.value)} disabled={skipResponsibilities} className="min-h-[80px]" />
            </div>
          </div>

          {selectedPositionId && (
            <p className="text-xs text-muted-foreground">Docs: {docStats.documents} • Chunks: {docStats.chunks}</p>
          )}

          <Button disabled={loading} onClick={handleGenerate} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Generate
          </Button>
        </div>

        {/* Right conversation area */}
        <div className="flex-1 border rounded-lg flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-6 space-y-4 bg-gray-50">
            {result.length === 0 && !loading && (
              <p className="text-center text-sm text-muted-foreground">Generated questions will appear here</p>
            )}
            {result.map((q, idx)=>(
              <div key={idx} className="bg-white p-4 rounded-md shadow-sm border">
                {q}
              </div>
            ))}
            {loading && <p className="text-sm text-muted-foreground">Generating…</p>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 