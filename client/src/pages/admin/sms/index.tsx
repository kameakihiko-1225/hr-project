import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Badge } from '../../../components/ui/badge';
import { useToast } from '../../../hooks/use-toast';
import { EntityValidationModal } from '../../../components/EntityValidationModal';
import api, { validateCampaignEntities } from '../../../lib/api';
import { useNavigate } from 'react-router-dom';

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
  _count?: {
    scheduledMessages: number;
  };
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

interface Company {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

interface Position {
  id: string;
  title: string;
}

const SMSManagerPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    message: '',
    companyId: '',
    departmentId: '',
    positionId: '',
    mediaFileId: ''
  });
  const [newSchedule, setNewSchedule] = useState({
    scheduledTime: '',
    recurrence: ''
  });
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  
  // Entity validation state
  const [validationModal, setValidationModal] = useState({
    isOpen: false,
    entityType: '',
    entityName: '',
    validationResult: null as any
  });
  const [pendingCampaignCreation, setPendingCampaignCreation] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCampaigns();
    fetchCompanies();
  }, [page]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await api.sms.getAllCampaigns(page, 10);
      if (response && response.data) {
        setCampaigns(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.pages);
        }
      } else {
        setCampaigns([]);
        setTotalPages(1);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch campaigns',
        variant: 'destructive'
      });
      setCampaigns([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await api.companies.getAll();
      setCompanies(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch companies',
        variant: 'destructive'
      });
    }
  };

  const fetchDepartments = async (companyId: string) => {
    try {
      const response = await api.departments.getByCompany(companyId);
      
      // The API now returns an array directly
      if (Array.isArray(response)) {
        setDepartments(response);
      } else {
        console.error('Unexpected departments response format:', response);
        setDepartments([]);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch departments',
        variant: 'destructive'
      });
      setDepartments([]);
    }
  };

  const fetchPositions = async (departmentId: string) => {
    try {
      const response = await api.positions.getByDepartment(departmentId);
      
      // The API now returns an array directly
      if (Array.isArray(response)) {
        setPositions(response);
      } else {
        console.error('Unexpected positions response format:', response);
        setPositions([]);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch positions',
        variant: 'destructive'
      });
      setPositions([]);
    }
  };

  const handleCompanyChange = (companyId: string) => {
    // Convert 'all' to empty string for filtering
    const actualCompanyId = companyId === 'all' ? '' : companyId;
    setNewCampaign({ ...newCampaign, companyId: actualCompanyId, departmentId: '', positionId: '' });
    if (companyId !== 'all') {
      fetchDepartments(companyId);
    } else {
      setDepartments([]);
    }
  };

  const handleDepartmentChange = (departmentId: string) => {
    // Convert 'all' to empty string for filtering
    const actualDepartmentId = departmentId === 'all' ? '' : departmentId;
    setNewCampaign({ ...newCampaign, departmentId: actualDepartmentId, positionId: '' });
    if (departmentId !== 'all') {
      fetchPositions(departmentId);
    } else {
      setPositions([]);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      if (!newCampaign.name || !newCampaign.message) {
        toast({
          title: 'Validation Error',
          description: 'Campaign name and message are required',
          variant: 'destructive'
        });
        return;
      }

      // Debug logging
      console.log('🚀 Creating campaign with data:', newCampaign);
      console.log('🔍 Campaign entity IDs:', {
        companyId: newCampaign.companyId,
        departmentId: newCampaign.departmentId,
        positionId: newCampaign.positionId
      });

      // Validate entities before creating campaign
      const validationResponse = await validateCampaignEntities(newCampaign);
      
      console.log('📋 Validation response:', validationResponse);
      
      // @ts-ignore - Temporary suppression for testing
      if (validationResponse.success && validationResponse.data?.hasIncompleteEntities) {
        console.log('⚠️  Found incomplete entities, showing modal');
        
        // Find the first incomplete entity to show validation modal
        // @ts-ignore - Temporary suppression for testing
        const entities = validationResponse.data.entities;
        let incompleteEntity = null;
        let entityType = '';
        let entityName = '';
        
        console.log('🔍 Checking entities for completeness:', {
          companyComplete: entities?.company?.validation?.isComplete,
          departmentComplete: entities?.department?.validation?.isComplete,
          positionComplete: entities?.position?.validation?.isComplete
        });
        
        if (entities?.company && !entities.company.validation.isComplete) {
          incompleteEntity = entities.company;
          entityType = 'company';
          entityName = entities.company.name;
          console.log('🏢 Company is incomplete:', entities.company.validation.missingFields);
        } else if (entities?.department && !entities.department.validation.isComplete) {
          incompleteEntity = entities.department;
          entityType = 'department';
          entityName = entities.department.name;
          console.log('🏬 Department is incomplete:', entities.department.validation.missingFields);
        } else if (entities?.position && !entities.position.validation.isComplete) {
          incompleteEntity = entities.position;
          entityType = 'position';
          entityName = entities.position.title;
          console.log('💼 Position is incomplete:', entities.position.validation.missingFields);
        }
        
        console.log('📝 Incomplete entity found:', { entityType, entityName, incompleteEntity });
        
        if (incompleteEntity) {
          console.log('🎯 Setting validation modal state...');
          setValidationModal({
            isOpen: true,
            entityType,
            entityName,
            validationResult: incompleteEntity.validation
          });
          setPendingCampaignCreation(true);
          console.log('✅ Validation modal should now be visible');
          return;
        } else {
          console.log('❌ No incomplete entity found despite hasIncompleteEntities being true');
        }
      } else {
        console.log('✅ No incomplete entities found, proceeding with campaign creation');
      }
      
      // Proceed with campaign creation if all entities are complete
      await createCampaignAfterValidation();
      
    } catch (error) {
      console.error('❌ Error during campaign creation:', error);
      toast({
        title: 'Error',
        description: 'Failed to validate entities or create campaign',
        variant: 'destructive'
      });
    }
  };

  const createCampaignAfterValidation = async () => {
    try {
      const response = await api.sms.createCampaign(newCampaign);
      
      // If media file ID is provided directly, use it
      if (newCampaign.mediaFileId && response.data.id) {
        const formData = new FormData();
        formData.append('fileId', newCampaign.mediaFileId);
        await api.sms.uploadMedia(response.data.id, formData);
      }
      // If media file is selected, upload it
      else if (mediaFile && response.data.id) {
        await uploadMedia(response.data.id, mediaFile);
      }
      
      toast({
        title: 'Success',
        description: 'Campaign created successfully'
      });
      
      setIsCreateDialogOpen(false);
      setNewCampaign({
        name: '',
        description: '',
        message: '',
        companyId: '',
        departmentId: '',
        positionId: '',
        mediaFileId: ''
      });
      setMediaFile(null);
      setPendingCampaignCreation(false);
      fetchCampaigns();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create campaign',
        variant: 'destructive'
      });
      setPendingCampaignCreation(false);
    }
  };

  const handleEntityValidationComplete = async (updatedEntity: any) => {
    setValidationModal(prev => ({ ...prev, isOpen: false }));
    
    if (updatedEntity) {
      toast({
        title: 'Success',
        description: `${validationModal.entityType.charAt(0).toUpperCase() + validationModal.entityType.slice(1)} information updated successfully`
      });
    }
    
    if (pendingCampaignCreation) {
      // Re-validate all entities and proceed with campaign creation
      try {
        const validationResponse = await validateCampaignEntities(newCampaign);
        
        // @ts-ignore - Temporary suppression for testing
        if (validationResponse.success && validationResponse.data?.hasIncompleteEntities) {
          // Still have incomplete entities, show the next one
          // @ts-ignore - Temporary suppression for testing
          const entities = validationResponse.data.entities;
          let incompleteEntity = null;
          let entityType = '';
          let entityName = '';
          
          if (entities?.company && !entities.company.validation.isComplete) {
            incompleteEntity = entities.company;
            entityType = 'company';
            entityName = entities.company.name;
          } else if (entities?.department && !entities.department.validation.isComplete) {
            incompleteEntity = entities.department;
            entityType = 'department';
            entityName = entities.department.name;
          } else if (entities?.position && !entities.position.validation.isComplete) {
            incompleteEntity = entities.position;
            entityType = 'position';
            entityName = entities.position.title;
          }
          
          if (incompleteEntity) {
            setValidationModal({
              isOpen: true,
              entityType,
              entityName,
              validationResult: incompleteEntity.validation
            });
            return;
          }
        }
        
        // All entities are now complete, proceed with campaign creation
        await createCampaignAfterValidation();
        
      } catch (error) {
        console.error('Error re-validating entities:', error);
        toast({
          title: 'Error',
          description: 'Failed to re-validate entities',
          variant: 'destructive'
        });
        setPendingCampaignCreation(false);
      }
    }
  };

  const handleScheduleMessage = async () => {
    try {
      if (!selectedCampaign || !newSchedule.scheduledTime) {
        toast({
          title: 'Validation Error',
          description: 'Please select a campaign and scheduled time',
          variant: 'destructive'
        });
        return;
      }

      // Convert 'none' to empty string for one-time messages
      const scheduleData = {
        ...newSchedule,
        recurrence: newSchedule.recurrence === 'none' ? '' : newSchedule.recurrence
      };

      await api.sms.createScheduledMessage(selectedCampaign.id, scheduleData);
      
      toast({
        title: 'Success',
        description: 'Message scheduled successfully'
      });
      
      setIsScheduleDialogOpen(false);
      setNewSchedule({
        scheduledTime: '',
        recurrence: ''
      });
      fetchCampaigns();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to schedule message',
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

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) {
      return;
    }
    
    try {
      await api.sms.deleteCampaign(id);
      
      toast({
        title: 'Success',
        description: 'Campaign deleted successfully'
      });
      
      fetchCampaigns();
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
      
      fetchCampaigns();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to execute message',
        variant: 'destructive'
      });
    }
  };

  const handleViewCampaign = (id: string) => {
    navigate(`/admin/sms/${id}`);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">SMS Manager</h1>
          <Button onClick={() => setIsCreateDialogOpen(true)}>Create New Campaign</Button>
        </div>

        <Tabs defaultValue="campaigns">
          <TabsList className="mb-4">
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled Messages</TabsTrigger>
          </TabsList>
          
          <TabsContent value="campaigns">
            <Card>
              <CardHeader>
                <CardTitle>Message Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-4">Loading...</div>
                ) : campaigns.length === 0 ? (
                  <div className="text-center p-4">No campaigns found</div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead>Media</TableHead>
                          <TableHead>Scheduled</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaigns.map((campaign) => (
                          <TableRow key={campaign.id}>
                            <TableCell className="font-medium">{campaign.name}</TableCell>
                            <TableCell>{campaign.company?.name || 'All'}</TableCell>
                            <TableCell>{campaign.department?.name || 'All'}</TableCell>
                            <TableCell>{campaign.position?.title || 'All'}</TableCell>
                            <TableCell>
                              {campaign.mediaType ? (
                                <Badge variant="outline">{campaign.mediaType}</Badge>
                              ) : (
                                'None'
                              )}
                            </TableCell>
                            <TableCell>{campaign._count?.scheduledMessages || 0}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCampaign(campaign);
                                    setIsScheduleDialogOpen(true);
                                  }}
                                >
                                  Schedule
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewCampaign(campaign.id)}
                                >
                                  View
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteCampaign(campaign.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {totalPages > 1 && (
                      <div className="flex justify-center mt-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                          >
                            Previous
                          </Button>
                          <span className="mx-4">
                            Page {page} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            onClick={() => setPage(page + 1)}
                            disabled={page === totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="scheduled">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Messages</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-4">Loading...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign</TableHead>
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
                      {campaigns.flatMap(campaign => 
                        campaign.scheduledMessages?.map(message => (
                          <TableRow key={message.id}>
                            <TableCell className="font-medium">{campaign.name}</TableCell>
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
                        )) || []
                      )}
                      {campaigns.every(campaign => !campaign.scheduledMessages?.length) && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center">
                            No scheduled messages found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Create a new message campaign for sending messages to candidates.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={newCampaign.description}
                onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="message" className="text-right">
                Message
              </Label>
              <Textarea
                id="message"
                value={newCampaign.message}
                onChange={(e) => setNewCampaign({ ...newCampaign, message: e.target.value })}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company" className="text-right">
                Company
              </Label>
              <Select
                value={newCampaign.companyId}
                onValueChange={handleCompanyChange}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {companies && companies.length > 0 && companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Department
              </Label>
              <Select
                value={newCampaign.departmentId}
                onValueChange={handleDepartmentChange}
                disabled={!newCampaign.companyId}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments && departments.length > 0 && departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="position" className="text-right">
                Position
              </Label>
              <Select
                value={newCampaign.positionId}
                onValueChange={(value) => {
                  // Convert 'all' to empty string for filtering
                  const actualPositionId = value === 'all' ? '' : value;
                  setNewCampaign({ ...newCampaign, positionId: actualPositionId });
                }}
                disabled={!newCampaign.departmentId}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  {positions && positions.length > 0 && positions.map((position) => (
                    <SelectItem key={position.id} value={position.id}>
                      {position.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mediaFileId" className="text-right">
                Media File ID
              </Label>
              <Input
                id="mediaFileId"
                value={newCampaign.mediaFileId}
                onChange={(e) => setNewCampaign({ ...newCampaign, mediaFileId: e.target.value })}
                className="col-span-3"
                placeholder="Enter Telegram file ID from /getFileId command"
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
                disabled={!!newCampaign.mediaFileId}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCampaign}>Create Campaign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <Label htmlFor="campaign" className="text-right">
                Campaign
              </Label>
              <div className="col-span-3 font-medium">
                {selectedCampaign?.name}
              </div>
            </div>
            
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

      {/* Entity Validation Modal */}
      {(() => {
        console.log('🎭 Modal render check:', {
          validationModalState: validationModal,
          hasValidationResult: !!validationModal.validationResult,
          isOpen: validationModal.isOpen
        });
        return validationModal.validationResult && (
          <EntityValidationModal
            isOpen={validationModal.isOpen}
            onClose={() => {
              console.log('🚪 Modal closing...');
              setValidationModal(prev => ({ ...prev, isOpen: false }));
              setPendingCampaignCreation(false);
            }}
            onComplete={handleEntityValidationComplete}
            entityType={validationModal.entityType}
            entityName={validationModal.entityName}
            validationResult={validationModal.validationResult}
          />
        );
      })()}
    </AdminLayout>
  );
};

export default SMSManagerPage;
