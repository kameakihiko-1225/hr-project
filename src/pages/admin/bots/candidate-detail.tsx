import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCandidateById } from '../../../lib/api';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { ArrowLeft, Download, Mail, Phone, Calendar, User, MapPin, Briefcase, Clock } from 'lucide-react';
import { toast } from '../../../components/ui/use-toast';
import { Separator } from '../../../components/ui/separator';

const CandidateDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCandidate(id);
    }
  }, [id]);

  const fetchCandidate = async (candidateId: string) => {
    try {
      setLoading(true);
      const response = await getCandidateById(candidateId);
      setCandidate(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching candidate:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch candidate details',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">New</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      case 'no_response':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">No Response</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6 space-y-4">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Skeleton className="h-8 w-1/3" />
          </div>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6 space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Candidate Details</h1>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Candidate Info Card */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Candidate Information</CardTitle>
              <CardDescription>Personal and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center mb-6">
                <div className="bg-blue-100 text-blue-700 rounded-full w-20 h-20 flex items-center justify-center text-2xl font-bold mb-3">
                  {candidate?.fullName ? candidate.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase() : '?'}
                </div>
                <h3 className="text-xl font-semibold">{candidate?.fullName || 'Unknown'}</h3>
                <div className="flex items-center mt-1">
                  {getStatusBadge(candidate?.status || 'unknown')}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <Mail className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p>{candidate?.email || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Phone className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p>{candidate?.phone || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Briefcase className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Position</p>
                    <p>{candidate?.position?.title || 'Not specified'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p>{candidate?.location || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Interview Date</p>
                    <p>{formatDate(candidate?.createdAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clock className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p>{formatDate(candidate?.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Interview Data Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Interview Data</CardTitle>
              <CardDescription>Responses from the Telegram bot interview</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="responses">
                <TabsList className="mb-4">
                  <TabsTrigger value="responses">Responses</TabsTrigger>
                  <TabsTrigger value="conversation">Conversation</TabsTrigger>
                  <TabsTrigger value="assessment">Assessment</TabsTrigger>
                </TabsList>
                
                <TabsContent value="responses" className="space-y-4">
                  {candidate?.responses ? (
                    Object.entries(candidate.responses).map(([question, answer]: [string, any]) => (
                      <div key={question} className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-700 mb-2">{question}</h4>
                        <p className="text-gray-900">{answer}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No response data available
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="conversation">
                  {candidate?.chatSessions && candidate.chatSessions.length > 0 ? (
                    <div className="border rounded-lg p-4 space-y-4">
                      {candidate.chatSessions.map((session: any) => (
                        <div key={session.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">{formatDate(session.createdAt)}</p>
                            <Badge>{session.status}</Badge>
                          </div>
                          <div className="space-y-2">
                            {session.messages && session.messages.map((message: any, index: number) => (
                              <div 
                                key={index} 
                                className={`p-3 rounded-lg ${
                                  message.fromBot 
                                    ? "bg-blue-50 text-blue-900 ml-6" 
                                    : "bg-gray-50 text-gray-900 mr-6"
                                }`}
                              >
                                <p className="text-xs text-gray-500 mb-1">
                                  {message.fromBot ? 'Bot' : 'Candidate'} • {formatDate(message.timestamp)}
                                </p>
                                <p>{message.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No conversation data available
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="assessment">
                  {candidate?.assessment ? (
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-700 mb-2">Overall Score</h4>
                        <div className="flex items-center">
                          <div className={`text-2xl font-bold ${
                            candidate.assessment.score >= 8 ? 'text-green-600' :
                            candidate.assessment.score >= 6 ? 'text-amber-600' :
                            'text-red-600'
                          }`}>
                            {candidate.assessment.score}/10
                          </div>
                          <Badge className="ml-3">{candidate.assessment.recommendation}</Badge>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-700 mb-2">Strengths</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {candidate.assessment.strengths?.map((strength: string, index: number) => (
                            <li key={index}>{strength}</li>
                          )) || <li>No strengths recorded</li>}
                        </ul>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-700 mb-2">Areas for Improvement</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {candidate.assessment.weaknesses?.map((weakness: string, index: number) => (
                            <li key={index}>{weakness}</li>
                          )) || <li>No areas for improvement recorded</li>}
                        </ul>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-700 mb-2">Notes</h4>
                        <p>{candidate.assessment.notes || 'No notes available'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No assessment data available
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CandidateDetailPage; 