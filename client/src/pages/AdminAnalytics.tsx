import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, MousePointer, TrendingUp, Users, Briefcase, BarChart3 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface DashboardStats {
  totalViews: number;
  totalApplies: number;
}

interface PositionStats {
  positionId: number;
  viewCount: number;
  applyCount: number;
}

interface Position {
  id: number;
  title: string;
  description?: string;
}

export function AdminAnalytics() {
  // Fetch dashboard stats
  const { data: dashboardStats, isLoading: dashboardLoading, refetch: refetchDashboard } = useQuery({
    queryKey: ['/api/dashboard/click-stats'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/dashboard/click-stats`);
      const data = await res.json();
      return data.success ? data.data as DashboardStats : { totalViews: 0, totalApplies: 0 };
    },
  });

  // Fetch position-specific stats
  const { data: positionStats, isLoading: positionLoading, refetch: refetchPositions } = useQuery({
    queryKey: ['/api/positions/stats'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/positions/stats`);
      const data = await res.json();
      return data.success ? data.data as PositionStats[] : [];
    },
  });

  // Fetch positions to get titles
  const { data: positions } = useQuery({
    queryKey: ['/api/positions'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/positions`);
      const data = await res.json();
      return data.success ? data.data as Position[] : [];
    },
  });

  const refreshData = () => {
    refetchDashboard();
    refetchPositions();
  };

  const getPositionTitle = (positionId: number) => {
    const position = positions?.find(p => p.id === positionId);
    return position?.title || `Position #${positionId}`;
  };

  const calculateConversionRate = (views: number, applies: number) => {
    if (views === 0) return 0;
    return ((applies / views) * 100).toFixed(1);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Track position views, applications, and engagement metrics</p>
        </div>
        <Button onClick={refreshData} variant="outline" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Position Views</CardTitle>
            <Eye className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardLoading ? '-' : dashboardStats?.totalViews || 0}
            </div>
            <p className="text-xs text-blue-100">Job seekers viewing positions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <MousePointer className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardLoading ? '-' : dashboardStats?.totalApplies || 0}
            </div>
            <p className="text-xs text-green-100">Apply button clicks</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <BarChart3 className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardLoading 
                ? '-' 
                : `${calculateConversionRate(
                    dashboardStats?.totalViews || 0, 
                    dashboardStats?.totalApplies || 0
                  )}%`
              }
            </div>
            <p className="text-xs text-purple-100">Views to applications</p>
          </CardContent>
        </Card>
      </div>

      {/* Position-specific Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Position Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {positionLoading ? (
            <div className="text-center py-8 text-gray-500">Loading position analytics...</div>
          ) : !positionStats || positionStats.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No analytics data yet</p>
              <p className="text-sm">Statistics will appear as users interact with positions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {positionStats.map((stat) => (
                <div key={stat.positionId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{getPositionTitle(stat.positionId)}</h3>
                    <p className="text-sm text-gray-500">Position ID: {stat.positionId}</p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">{stat.viewCount}</div>
                      <div className="text-gray-500">Views</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-600">{stat.applyCount}</div>
                      <div className="text-gray-500">Applies</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-purple-600">
                        {calculateConversionRate(stat.viewCount, stat.applyCount)}%
                      </div>
                      <div className="text-gray-500">Rate</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Information */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="text-sm text-gray-600 space-y-2">
            <h4 className="font-medium text-gray-900">Analytics Information</h4>
            <p>• Position views are tracked when job seekers see position cards</p>
            <p>• Applications are tracked when users click "Apply Now" buttons</p>
            <p>• Data includes IP addresses and user agents for analytics purposes</p>
            <p>• Conversion rate shows the percentage of views that result in applications</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}