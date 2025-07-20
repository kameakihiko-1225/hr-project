import React from 'react';
import { useOptimizedAdminQueries } from '@/hooks/useOptimizedAdminQueries';
import { 
  Users, 
  Building2, 
  Briefcase, 
  TrendingUp,
  Eye,
  MousePointer,
  BarChart3,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const OptimizedAdminDashboard: React.FC = () => {
  const { useOptimizedDashboard } = useOptimizedAdminQueries();
  
  const { data: dashboardData, isLoading, error } = useOptimizedDashboard();

  const stats = dashboardData || {};
  const performanceInfo = dashboardData?.performanceInfo;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load dashboard data. Please refresh the page to try again.
        </AlertDescription>
      </Alert>
    );
  }

  const statCards = [
    {
      title: "Total Companies",
      value: stats.companies || 0,
      icon: Building2,
      description: "Active companies"
    },
    {
      title: "Total Departments", 
      value: stats.departments || 0,
      icon: Users,
      description: "Department divisions"
    },
    {
      title: "Open Positions",
      value: stats.positions || 0, 
      icon: Briefcase,
      description: "Available jobs"
    },
    {
      title: "Total Applications",
      value: stats.applications || 0,
      icon: MousePointer,
      description: "Apply button clicks"
    },
    {
      title: "Position Views",
      value: stats.totalViews || 0,
      icon: Eye,
      description: "Total position views"
    },
    {
      title: "Conversion Rate",
      value: `${stats.conversionRate || 0}%`,
      icon: TrendingUp,
      description: "View to apply ratio"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Performance indicator */}
      {performanceInfo && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Dashboard Performance</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Loaded in {performanceInfo.queryTime}ms</span>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
              {performanceInfo.cacheStatus || 'Optimized'}
            </span>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent activity section (if available) */}
      {stats.recentActivity && stats.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.slice(0, 5).map((activity: any, index: number) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <p className="text-sm font-medium">{activity.name}</p>
                    <p className="text-xs text-gray-600">{activity.action}</p>
                  </div>
                  <span className="text-xs text-gray-500">{activity.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System status indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-xs text-gray-600">API Online</p>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-xs text-gray-600">Database Connected</p>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-xs text-gray-600">Performance Optimized</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};