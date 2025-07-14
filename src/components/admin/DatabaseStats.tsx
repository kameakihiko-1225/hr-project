import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { Building2, Clock, Database, FileText, Users } from 'lucide-react';
import api from '@/lib/api';

// Type for database table information
interface TableInfo {
  table_name: string;
  row_count: number;
  size_bytes: number;
  last_updated: string | null;
}

// Type for recent activity
interface ActivityItem {
  id: string;
  type: string;
  name: string;
  company?: string;
  action: string;
  date: string;
}

// Type for database stats response
interface DbStatsResponse {
  success: boolean;
  data: {
    tables: TableInfo[];
    totalTables: number;
    totalRows: number;
    totalSize: number;
    lastUpdated: string;
    databaseSize: string;
    connectionStatus: string;
    recentActivity: ActivityItem[];
  };
  error?: string;
}

/**
 * Database Statistics Component
 * Displays information about database tables and their statistics
 */
export function DatabaseStats() {
  // Fetch database statistics
  const { data, isLoading, error } = useQuery<DbStatsResponse>({
    queryKey: ['dbStats'],
    queryFn: async () => {
      const response = await api.get('/db/stats');
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch database statistics');
      }
      return response as unknown as DbStatsResponse;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Database Statistics</CardTitle>
          <CardDescription>Loading database information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Database Statistics</CardTitle>
          <CardDescription>Error loading database information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">
            Failed to load database statistics. Please try again later.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format bytes to human-readable format
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date to human-readable format
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Database Tables</CardTitle>
          <CardDescription>Information about database tables and their statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table Name</TableHead>
                <TableHead className="text-right">Rows</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data?.tables?.map((table: TableInfo) => (
                <TableRow key={table.table_name}>
                  <TableCell>
                    <div className="font-medium">{table.table_name}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{table.row_count.toLocaleString()}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatBytes(table.size_bytes)}</TableCell>
                  <TableCell>{formatDate(table.last_updated)}</TableCell>
                </TableRow>
              ))}
              {(!data?.data?.tables || data.data.tables.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No table data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Total Tables: {data?.data?.totalTables || 0}</p>
            <p>Total Rows: {data?.data?.totalRows?.toLocaleString() || 0}</p>
            <p>Total Size: {formatBytes(data?.data?.totalSize || 0)}</p>
            <p>Last Updated: {formatDate(data?.data?.lastUpdated || null)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Database Activity</CardTitle>
          <CardDescription>Recent changes to the database</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.data?.recentActivity && data.data.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {data.data.recentActivity.map((activity: ActivityItem) => (
                <div key={activity.id} className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    {activity.type === 'company' && <Building2 className="h-4 w-4 text-primary" />}
                    {activity.type === 'job' && <FileText className="h-4 w-4 text-primary" />}
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
                      <Clock className="mr-1 h-3 w-3" />
                      {formatDate(activity.date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Database className="mx-auto h-8 w-8 opacity-50" />
              <p className="mt-2">No recent activity found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 