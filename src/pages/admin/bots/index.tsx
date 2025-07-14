import { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/authContext';
import { getBotByAdminId, createBot, updateBot, deleteBot, setWebhook, removeWebhook, getCompanies, ApiResponse } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Switch } from '../../../components/ui/switch';
import { AlertCircle, ArrowLeft, CheckCircle2, Copy, MessageSquare, RefreshCw, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';
import { toast } from '../../../components/ui/use-toast';
import { Skeleton } from '../../../components/ui/skeleton';
import { Badge } from '../../../components/ui/badge';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BotManagementPage = () => {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const [bot, setBot] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [botName, setBotName] = useState('');
  const [botToken, setBotToken] = useState('');
  const [companyId, setCompanyId] = useState<string>('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    if (!admin?.id || admin.id === 'mock-admin-id') {
      console.warn('No admin logged in; bot management disabled');
      return;
    }
    fetchBot();
    // Fetch companies for dropdown
    (async () => {
      try {
        const resp: ApiResponse = await getCompanies();
        if (resp.success && Array.isArray(resp.data)) {
          // Filter companies owned by this admin
          const filtered = resp.data.filter((c: any) => c.adminId === admin?.id);
          setCompanies(filtered);
        }
      } catch (e) {
        console.error('Failed to load companies', e);
      }
    })();
  }, [admin]);

  const fetchBot = async () => {
    if (!admin?.id || admin.id === 'mock-admin-id') return;
    try {
      setLoading(true);
      const botResponse = await getBotByAdminId(admin.id);
      const botData = botResponse.data;
      setBot(botData);
      if (botData?.webhookUrl) {
        setWebhookUrl(botData.webhookUrl);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bot:', error);
      setLoading(false);
    }
  };

  const handleCreateBot = async () => {
    if (!botName || !botToken || !admin?.id) {
      toast({
        title: 'Error',
        description: 'Bot name, token and valid admin are required',
        variant: 'destructive'
      });
      return;
    }

    try {
      setCreating(true);
      const payload: any = {
        adminId: admin.id,
        name: botName,
        token: botToken
      };
      if (companyId) payload.companyId = companyId;

      const newBot = await createBot(payload);

      setBot(newBot);
      setBotName('');
      setBotToken('');
      setCompanyId('');
      toast({
        title: 'Success',
        description: 'Bot created successfully',
        variant: 'default'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create bot',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateWebhook = async () => {
    if (!webhookUrl || !bot?.id) {
      toast({
        title: 'Error',
        description: 'Webhook URL is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      setUpdating(true);
      const updatedBot = await setWebhook(bot.id, webhookUrl.trim());
      setBot(updatedBot);
      toast({
        title: 'Success',
        description: 'Webhook updated successfully',
        variant: 'default'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update webhook',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveWebhook = async () => {
    if (!bot?.id) return;
    try {
      setUpdating(true);
      const updatedBot = await removeWebhook(bot.id);
      setBot(updatedBot);
      setWebhookUrl('');
      toast({
        title: 'Success',
        description: 'Webhook removed successfully',
        variant: 'default'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove webhook',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteBot = async () => {
    if (!window.confirm('Are you sure you want to delete this bot? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteBot(bot.id);
      setBot(null);
      toast({
        title: 'Success',
        description: 'Bot deleted successfully',
        variant: 'default'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete bot',
        variant: 'destructive'
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Text copied to clipboard',
      variant: 'default'
    });
  };

  const content = (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/admin/dashboard')} 
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Bot Management</h1>
      </div>
      
      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : !bot ? (
        <Card>
          <CardHeader>
            <CardTitle>Create a New Bot</CardTitle>
            <CardDescription>
              Create a Telegram bot to automate candidate interviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="botName">Bot Name</Label>
                <Input
                  id="botName"
                  placeholder="Enter bot name"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                />
              </div>
              {companies.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="company">Company (optional)</Label>
                  <Select value={companyId} onValueChange={setCompanyId}>
                    <SelectTrigger id="company">
                      <SelectValue placeholder="Select company or leave blank" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="botToken">Bot Token</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="botToken"
                    placeholder="Enter bot token from @BotFather"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    type="password"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  You can get a bot token by talking to <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@BotFather</a> on Telegram
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleCreateBot} disabled={creating}>
              {creating ? (
                <div>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </div>
              ) : (
                'Create Bot'
              )}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    {bot.name}
                    {bot.active && (
                      <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {bot.username ? `@${bot.username}` : 'No username set'}
                  </CardDescription>
                </div>
                <Button variant="destructive" size="sm" onClick={handleDeleteBot}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Bot
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="webhook">Webhook</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Bot Token</Label>
                      <div className="flex items-center">
                        <Input value="••••••••••••••••••••••••••••••" disabled />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(bot.token)}
                          className="ml-2"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Webhook Status</Label>
                      <div className="flex items-center space-x-2">
                        {bot.webhookActive ? (
                          <div>
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span>Active</span>
                          </div>
                        ) : (
                          <div>
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                            <span>Not configured</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Important</AlertTitle>
                    <AlertDescription>
                      Your bot will automatically use your company information and available positions.
                      Make sure your company profile is up to date.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
                
                <TabsContent value="webhook" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhookUrl">Webhook URL</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="webhookUrl"
                        placeholder="https://your-domain.com/api/telegram/webhook/{botId}"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                      />
                      {bot.webhookActive ? (
                        <Button onClick={handleRemoveWebhook} variant="destructive" disabled={updating}>
                          {updating ? 'Removing...' : 'Remove'}
                        </Button>
                      ) : (
                        <Button onClick={handleUpdateWebhook} disabled={updating}>
                          {updating ? 'Setting...' : 'Set Webhook'}
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      The webhook URL should be a publicly accessible HTTPS URL where Telegram can send updates
                    </p>
                  </div>
                  
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Webhook URL Format</AlertTitle>
                    <AlertDescription>
                      Use the following format for your webhook URL:
                      <code className="block mt-2 p-2 bg-muted rounded">
                        https://your-domain.com/api/telegram/webhook/{bot.id}
                      </code>
                      Replace "your-domain.com" with your actual domain.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
                
                <TabsContent value="settings" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="active">Bot Active</Label>
                      <Switch
                        id="active"
                        checked={bot.active}
                        onCheckedChange={async (checked) => {
                          try {
                            const updatedBot = await updateBot(bot.id, { active: checked });
                            setBot(updatedBot);
                            toast({
                              title: 'Success',
                              description: `Bot ${checked ? 'activated' : 'deactivated'} successfully`,
                              variant: 'default'
                            });
                          } catch (error: any) {
                            toast({
                              title: 'Error',
                              description: error.message || 'Failed to update bot status',
                              variant: 'destructive'
                            });
                          }
                        }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      When deactivated, the bot will not respond to user messages
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="defaultLanguage">Default Language</Label>
                    <select
                      id="defaultLanguage"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={bot.defaultLanguage}
                      onChange={async (e) => {
                        try {
                          const updatedBot = await updateBot(bot.id, { defaultLanguage: e.target.value });
                          setBot(updatedBot);
                          toast({
                            title: 'Success',
                            description: 'Default language updated successfully',
                            variant: 'default'
                          });
                        } catch (error: any) {
                          toast({
                            title: 'Error',
                            description: error.message || 'Failed to update default language',
                            variant: 'destructive'
                          });
                        }
                      }}
                    >
                      <option value="en">English</option>
                      <option value="ru">Russian</option>
                      <option value="uz">Uzbek</option>
                    </select>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  return <AdminLayout>{content}</AdminLayout>;
};

export default BotManagementPage;
