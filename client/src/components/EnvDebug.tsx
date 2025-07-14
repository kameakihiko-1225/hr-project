import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { env } from '@/lib/env';

export function EnvDebug() {
  const [showDebug, setShowDebug] = useState(false);
  
  if (!env.isDevelopment) {
    return null; // Don't show in production
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setShowDebug(!showDebug)}
      >
        {showDebug ? 'Hide' : 'Show'} Environment Debug
      </Button>
      
      {showDebug && (
        <Card className="mt-2 w-[350px] shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Environment Variables</CardTitle>
            <CardDescription>Current environment: {env.nodeEnv}</CardDescription>
          </CardHeader>
          <CardContent className="text-xs">
            <div className="space-y-2">
              <div>
                <div className="font-semibold">Database URL:</div>
                <div className="text-muted-foreground break-all">
                  {env.databaseUrl.replace(/\/\/.*?@/, '//***:***@')}
                </div>
              </div>
              
              <div>
                <div className="font-semibold">JWT Secret:</div>
                <div className="text-muted-foreground">
                  {env.jwtSecret ? '******' : 'Not set'}
                </div>
              </div>
              
              <div>
                <div className="font-semibold">JWT Expires In:</div>
                <div className="text-muted-foreground">
                  {env.jwtExpiresIn}
                </div>
              </div>
              
              <div>
                <div className="font-semibold">Development Mode:</div>
                <div className="text-muted-foreground">
                  {env.isDevelopment ? 'Yes' : 'No'}
                </div>
              </div>
              
              <div>
                <div className="font-semibold">Production Mode:</div>
                <div className="text-muted-foreground">
                  {env.isProduction ? 'Yes' : 'No'}
                </div>
              </div>
              
              <div className="pt-2 text-xs text-muted-foreground">
                Note: This debug panel is only visible in development mode
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 