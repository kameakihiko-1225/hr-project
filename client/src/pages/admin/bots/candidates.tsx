import { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/authContext';
import { getBotByAdminId, getCandidatesByBotId } from '../../../lib/api';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Search, Download, Eye } from 'lucide-react';
import { toast } from '../../../components/ui/use-toast';
import { useLocation } from 'wouter';

const CandidatesPage = () => {
  const { admin } = useAuth();
  const [bot, setBot] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (admin?.id) {
      fetchBotAndCandidates();
    }
  }, [admin]);

  const fetchBotAndCandidates = async () => {
    try {
      setLoading(true);
      const botResponse = await getBotByAdminId(admin?.id || '');
      const botData = botResponse.data;
      setBot(botData);

      if (botData) {
        // Fetch candidates from the server
        const candidatesResponse = await getCandidatesByBotId(botData.id);
        setCandidates(candidatesResponse.data || []);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bot and candidates:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch candidates',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (candidate.fullName && candidate.fullName.toLowerCase().includes(searchLower)) ||
      (candidate.email && candidate.email.toLowerCase().includes(searchLower)) ||
      (candidate.phone && candidate.phone.toLowerCase().includes(searchLower))
    );
  });

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
          <h1 className="text-3xl font-bold">Candidates</h1>
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  if (!bot) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6 space-y-4">
          <h1 className="text-3xl font-bold">Candidates</h1>
          <Card>
            <CardHeader>
              <CardTitle>No Bot Found</CardTitle>
              <CardDescription>
                You need to create a bot first before you can see candidates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/admin/bots')}>
                Go to Bot Management
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6 space-y-4">
        <h1 className="text-3xl font-bold">Candidates</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Bot Candidates</CardTitle>
            <CardDescription>
              View and manage candidates who have interacted with your bot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search candidates..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="ml-2">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
            
            {filteredCandidates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No candidates found
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCandidates.map((candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell className="font-medium">{candidate.fullName || 'Unknown'}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{candidate.email || 'No email'}</span>
                            <span className="text-muted-foreground text-sm">{candidate.phone || 'No phone'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{candidate.position?.title || 'Not specified'}</TableCell>
                        <TableCell>{getStatusBadge(candidate.status)}</TableCell>
                        <TableCell>{formatDate(candidate.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => navigate(`/admin/bots/candidate-detail/${candidate.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default CandidatesPage;
