import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from "wouter";
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useToast } from '../../../hooks/use-toast';
import api from '../../../lib/api';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  message: string;
  mediaType?: string;
  mediaFileId?: string;
  mediaUrl?: string;
  filterCriteria?: any;
  adminId: string;
  companyId?: string;
  departmentId?: string;
  positionId?: string;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
  };
  department?: {
    id: string;
    name: string;
  };
  position?: {
    id: string;
    title: string;
  };
  scheduledMessages?: ScheduledMessage[];
}

interface ScheduledMessage {
  id: string;
  campaignId: string;
  scheduledTime: string;
  recurrence?: string;
  lastRun?: string;
  nextRun?: string;
  status: string;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Candidate {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  telegramId?: string;
  telegramUsername?: string;
  preferredLanguage?: string;
  status: string;
}

const CampaignDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    scheduledTime: '',
    recurrence: ''
  });
  const [editCampaign, setEditCampaign] = useState({
    name: '',
    description: '',
    message: ''
  });
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  useEffect(() => {
    if (id) {
      fetchCampaign();
    }
  }, [id]);

  const fetchCampaign = async () => {
    setLoading(true);
    try {
      const response = await api.sms.getCampaignById(id!);
      setCampaign(response.data);
      
      // Initialize edit form with campaign data
      setEditCampaign({
        name: response.data.name,
        description: response.data.description || '',
        message: response.data.message
      });
      
      // Fetch candidates based on campaign filter criteria
      if (response.data.filterCriteria) {
        fetchCandidates(response.data.filterCriteria);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch campaign details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async (filterCriteria: any) => {
    try {
      const response = await api.sms.getCandidatesByFilters(filterCriteria);
      setCandidates(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch candidates',
        variant: 'destructive'
      });
    }
  };

  const handleScheduleMessage = async () => {
    try {
      if (!campaign || !newSchedule.scheduledTime) {
        toast({
          title: 'Validation Error',
          description: 'Please select a scheduled time',
          variant: 'destructive'
        });
        return;
      }

      // Convert 'none' to empty string for one-time messages
      const scheduleData = {
        ...newSchedule,
        recurrence: newSchedule.recurrence === 'none' ? '' : newSchedule.recurrence
      };

      await api.sms.createScheduledMessage(campaign.id, scheduleData);
      
      toast({
        title: 'Success',
        description: 'Message scheduled successfully'
      });
      
      setIsScheduleDialogOpen(false);
      setNewSchedule({
        scheduledTime: '',
        recurrence: ''
      });
      fetchCampaign();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to schedule message',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateCampaign = async () => {
    try {
      if (!campaign || !editCampaign.name || !editCampaign.message) {
        toast({
          title: 'Validation Error',
          description: 'Campaign name and message are required',
          variant: 'destructive'
        });
        return;
      }

      await api.sms.updateCampaign(campaign.id, editCampaign);
      
      // If media file is selected, upload it
      if (mediaFile) {
        await uploadMedia(campaign.id, mediaFile);
      }
      
      toast({
        title: 'Success',
        description: 'Campaign updated successfully'
      });
      
      setIsEditDialogOpen(false);
      fetchCampaign();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update campaign',
        variant: 'destructive'
      });
    }
  };

  const uploadMedia = async (campaignId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('media', file);
      
      await api.sms.uploadMedia(campaignId, formData);
      
      toast({
        title: 'Success',
        description: 'Media uploaded successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload media',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteCampaign = async () => {
    if (!campaign) return;
    
    if (!confirm('Are you sure you want to delete this campaign?')) {
      return;
    }
    
    try {
      await api.sms.deleteCampaign(campaign.id);
      
      toast({
        title: 'Success',
        description: 'Campaign deleted successfully'
      });
      
      navigate('/admin/sms');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete campaign',
        variant: 'destructive'
      });
    }
  };

  const handleExecuteScheduledMessage = async (id: string) => {
    if (!confirm('Are you sure you want to execute this message now?')) {
      return;
    }
    
    try {
      await api.sms.executeScheduledMessage(id);
      
      toast({
        title: 'Success',
        description: 'Message executed successfully'
      });
      
      fetchCampaign();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to execute message',
        variant: 'destructive'
      });
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        {loading ? (
          <div className="flex justify-center p-4">Loading...</div>
        ) : campaign ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold">{campaign.name}</h1>
                <p className="text-gray-500">{campaign.description}</p>
              </div>
              <div className="flex space-x-2">
                <Button onClick={() => setIsScheduleDialogOpen(true)}>Schedule Message</Button>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>Edit Campaign</Button>
                <Button variant="destructive" onClick={handleDeleteCampaign}>Delete</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <Label>Company</Label>
                      <p>{campaign.company?.name || 'All Companies'}</p>
                    </div>
                    <div>
                      <Label>Department</Label>
                      <p>{campaign.department?.name || 'All Departments'}</p>
                    </div>
                    <div>
                      <Label>Position</Label>
                      <p>{campaign.position?.title || 'All Positions'}</p>
                    </div>
                    <div>
                      <Label>Created</Label>
                      <p>{new Date(campaign.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label>Last Updated</Label>
                      <p>{new Date(campaign.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Message Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-md bg-gray-50">
                      <p className="whitespace-pre-wrap">{campaign.message}</p>
                    </div>
                    {campaign.mediaType && (
                      <div>
                        <Label>Media</Label>
                        <div className="mt-2">
                          <Badge>{campaign.mediaType}</Badge>
                          {campaign.mediaUrl && (
                            <div className="mt-2">
                              {campaign.mediaType === 'photo' ? (
                                <img 
                                  src={campaign.mediaUrl} 
                                  alt="Campaign media" 
                                  className="max-w-full h-auto max-h-64 rounded-md" 
                                />
                              ) : campaign.mediaType === 'video' ? (
                                <video 
                                  src={campaign.mediaUrl} 
                                  controls 
                                  className="max-w-full h-auto max-h-64 rounded-md" 
                                />
                              ) : (
                                <div className="p-4 border rounded-md bg-gray-50">
                                  <a href={campaign.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    View Document
                                  </a>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="scheduled">
              <TabsList className="mb-4">
                <TabsTrigger value="scheduled">Scheduled Messages</TabsTrigger>
                <TabsTrigger value="candidates">Target Candidates</TabsTrigger>
              </TabsList>
              
              <TabsContent value="scheduled">
                <Card>
                  <CardHeader>
                    <CardTitle>Scheduled Messages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {campaign.scheduledMessages && campaign.scheduledMessages.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Scheduled Time</TableHead>
                            <TableHead>Recurrence</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Run</TableHead>
                            <TableHead>Next Run</TableHead>
                            <TableHead>Sent/Failed</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {campaign.scheduledMessages.map((message) => (
                            <TableRow key={message.id}>
                              <TableCell>{new Date(message.scheduledTime).toLocaleString()}</TableCell>
                              <TableCell>{message.recurrence || 'One-time'}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    message.status === 'pending' ? 'outline' :
                                    message.status === 'sent' ? 'default' : 'destructive'
                                  }
                                >
                                  {message.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {message.lastRun ? new Date(message.lastRun).toLocaleString() : 'Never'}
                              </TableCell>
                              <TableCell>
                                {message.nextRun ? new Date(message.nextRun).toLocaleString() : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {message.sentCount}/{message.failedCount}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleExecuteScheduledMessage(message.id)}
                                  disabled={message.status !== 'pending'}
                                >
                                  Execute Now
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center p-4">No scheduled messages found</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="candidates">
                <Card>
                  <CardHeader>
                    <CardTitle>Target Candidates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {candidates.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Telegram</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {candidates.map((candidate) => (
                            <TableRow key={candidate.id}>
                              <TableCell className="font-medium">{candidate.fullName}</TableCell>
                              <TableCell>{candidate.email || '-'}</TableCell>
                              <TableCell>{candidate.phone || '-'}</TableCell>
                              <TableCell>{candidate.telegramUsername || '-'}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{candidate.status}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center p-4">No candidates match the filter criteria</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center p-4">Campaign not found</div>
        )}
      </div>

      {/* Schedule Message Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule Message</DialogTitle>
            <DialogDescription>
              Schedule a message to be sent to candidates matching the campaign filters.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="scheduledTime" className="text-right">
                Schedule Time
              </Label>
              <Input
                id="scheduledTime"
                type="datetime-local"
                value={newSchedule.scheduledTime}
                onChange={(e) => setNewSchedule({ ...newSchedule, scheduledTime: e.target.value })}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="recurrence" className="text-right">
                Recurrence
              </Label>
              <Select
                value={newSchedule.recurrence}
                onValueChange={(value) => setNewSchedule({ ...newSchedule, recurrence: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select recurrence pattern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">One-time</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleMessage}>Schedule Message</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>
              Update the campaign details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={editCampaign.name}
                onChange={(e) => setEditCampaign({ ...editCampaign, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={editCampaign.description}
                onChange={(e) => setEditCampaign({ ...editCampaign, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="message" className="text-right">
                Message
              </Label>
              <Textarea
                id="message"
                value={editCampaign.message}
                onChange={(e) => setEditCampaign({ ...editCampaign, message: e.target.value })}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="media" className="text-right">
                Media
              </Label>
              <Input
                id="media"
                type="file"
                onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                className="col-span-3"
                accept="image/*,video/*,application/pdf"
              />
              {campaign?.mediaType && (
                <div className="col-span-3 col-start-2">
                  <Badge variant="outline" className="ml-2">
                    Current: {campaign.mediaType}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCampaign}>Update Campaign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default CampaignDetailPage;
