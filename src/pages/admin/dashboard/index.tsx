import { useState, useEffect } from "react";
import { 
  Users, 
  Building2, 
  Briefcase, 
  Bot, 
  UserCheck, 
  MessageSquare, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatabaseStats } from "@/components/admin/DatabaseStats";
import { MockAuthNotice } from "@/components/admin/MockAuthNotice";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import api from "@/lib/api";

interface DashboardStats {
  companies: number;
  departments: number;
  positions: number;
  bots: number;
  candidates: number;
  interviews: number;
  conversionRate: number;
  activeDeals: number;
  admins: number;
  jobs: number;
  applications: number;
  recentActivity?: Array<{
    id: string;
    type: string;
    name: string;
    company?: string;
    action: string;
    date: string;
  }>;
}

interface SystemStatus {
  api: {
    status: 'online' | 'offline';
    lastChecked: string;
  };
  database: {
    status: 'connected' | 'disconnected';
    lastChecked: string;
  };
  storage: {
    status: 'available' | 'unavailable';
    lastChecked: string;
  };
}

interface ApiResponse {
  success: boolean;
  data?: DashboardStats;
  error?: string;
}

export default function Dashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    api: { status: 'online', lastChecked: new Date().toISOString() },
    database: { status: 'disconnected', lastChecked: new Date().toISOString() },
    storage: { status: 'available', lastChecked: new Date().toISOString() }
  });

  // Fetch dashboard stats
  const { data, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch dashboard statistics');
      }
      return response;
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Fetch database health
  const { data: dbHealthData } = useQuery({
    queryKey: ['dbHealth'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/db/health');
        if (response.status === 404) {
          // If the endpoint doesn't exist, assume the database is disconnected
          console.warn('Database health check endpoint not found');
          return { status: 'unhealthy', message: 'Health check endpoint not available' };
        }
        if (!response.ok) {
          return { status: 'unhealthy' };
        }
        return response.json();
      } catch (error) {
        console.error('Error checking database health:', error);
        return { status: 'error' };
      }
    },
    retry: 1,
    refetchInterval: 30000, // Check every 30 seconds
    refetchOnWindowFocus: true,
  });

  // Update system status based on API responses
  useEffect(() => {
    setSystemStatus(prev => ({
      ...prev,
      api: { 
        status: 'online', 
        lastChecked: new Date().toISOString() 
      },
      database: { 
        status: dbHealthData?.status === 'healthy' ? 'connected' : 'disconnected', 
        lastChecked: new Date().toISOString() 
      }
    }));
  }, [dbHealthData]);

  const stats = data?.data;

  const statCards = [
    {
      title: "Companies",
      value: stats?.companies ?? 0,
      icon: Building2,
      color: "bg-blue-500",
    },
    {
      title: "Departments",
      value: stats?.departments ?? 0,
      icon: Users,
      color: "bg-indigo-500",
    },
    {
      title: "Open Positions",
      value: stats?.positions ?? 0,
      icon: Briefcase,
      color: "bg-purple-500",
    },
    {
      title: "Jobs Posted",
      value: stats?.jobs ?? 0,
      icon: Calendar,
      color: "bg-cyan-500",
    },
    {
      title: "Admin Users",
      value: stats?.admins ?? 0,
      icon: UserCheck,
      color: "bg-green-500",
    },
    {
      title: "Active Bots",
      value: stats?.bots ?? 0,
      icon: Bot,
      color: "bg-yellow-500",
    },
    {
      title: "Candidates",
      value: stats?.candidates ?? 0,
      icon: Users,
      color: "bg-orange-500",
    },
    {
      title: "Interviews",
      value: stats?.interviews ?? 0,
      icon: MessageSquare,
      color: "bg-red-500",
    },
  ];

  // Format date to human-readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500">Welcome to the Millat Umidi HR admin portal</p>
        </div>

        <MockAuthNotice />

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load dashboard data. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-md ${stat.color}`}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        {activity.type === 'company' && <Building2 className="h-4 w-4 text-primary" />}
                        {activity.type === 'job' && <Briefcase className="h-4 w-4 text-primary" />}
                        {activity.type === 'department' && <Users className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {activity.name}
                          {activity.company && <span className="text-muted-foreground"> ({activity.company})</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <span className="capitalize">{activity.action}</span> {activity.type}
                        </p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="mr-1 h-3 w-3" />
                          {formatDate(activity.date)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No recent activity available.
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">API Server</span>
                    <div className="flex items-center">
                      {systemStatus.api.status === 'online' ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 mr-1" />
                      )}
                      <span className={`text-sm font-medium ${systemStatus.api.status === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                        {systemStatus.api.status === 'online' ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Database</span>
                    <div className="flex items-center">
                      {systemStatus.database.status === 'connected' ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 mr-1" />
                      )}
                      <span className={`text-sm font-medium ${systemStatus.database.status === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                        {systemStatus.database.status === 'connected' ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Storage</span>
                    <div className="flex items-center">
                      {systemStatus.storage.status === 'available' ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 mr-1" />
                      )}
                      <span className={`text-sm font-medium ${systemStatus.storage.status === 'available' ? 'text-green-600' : 'text-red-600'}`}>
                        {systemStatus.storage.status === 'available' ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Last Updated</span>
                    <span className="text-sm font-medium">{formatDate(systemStatus.database.lastChecked)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <DatabaseStats />
      </div>
    </AdminLayout>
  );
} 