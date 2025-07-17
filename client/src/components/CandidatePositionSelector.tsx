import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { CompanyCard } from '@/components/CompanyCard';
import { DepartmentCard } from '@/components/DepartmentCard';
import { PositionCard } from '@/components/PositionCard';

interface Company {
  id: string;
  name: string;
  logo?: string;
  industry?: string;
}

interface Department {
  id: string;
  name: string;
  description?: string;
}

interface Position {
  id: string;
  title: string;
  description?: string;
  location?: string;
  salaryRange?: string;
  employmentType?: string;
}

interface CandidatePositionSelectorProps {
  candidateId: string;
  initialPositionId?: string;
  onComplete: (result: {
    candidateId: string;
    positionId: string;
    positionTitle: string;
    departmentName?: string;
    companyName?: string;
  }) => void;
  onCancel?: () => void;
}

export function CandidatePositionSelector({
  candidateId,
  initialPositionId,
  onComplete,
  onCancel
}: CandidatePositionSelectorProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>(initialPositionId ? 'direct' : 'companies');
  const [loading, setLoading] = useState<boolean>(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [directPositionId, setDirectPositionId] = useState<string>(initialPositionId || '');
  
  // If initialPositionId is provided, link directly
  useEffect(() => {
    if (initialPositionId) {
      linkDirectPosition(initialPositionId);
    } else {
      // Load companies for guided selection
      loadCompanies();
    }
  }, [initialPositionId, candidateId]);
  
  // Direct position linking
  const linkDirectPosition = async (positionId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/candidates/link-position', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          candidateId,
          positionId
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to link position');
      }
      
      toast({
        title: 'Success',
        description: 'Candidate successfully linked to position',
      });
      
      onComplete({
        candidateId,
        positionId: result.data.position.id,
        positionTitle: result.data.position.title,
        departmentName: result.data.department?.name,
        companyName: result.data.company?.name
      });
    } catch (error) {
      console.error('Error linking position:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to link position',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load companies for step 1
  const loadCompanies = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/candidates/${candidateId}/companies`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load companies');
      }
      
      setCompanies(result.data);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load companies',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load departments for step 2
  const loadDepartments = async (companyId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/candidates/companies/${companyId}/departments`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load departments');
      }
      
      setDepartments(result.data);
      setActiveTab('departments');
    } catch (error) {
      console.error('Error loading departments:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load departments',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load positions for step 3
  const loadPositions = async (departmentId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/candidates/departments/${departmentId}/positions`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load positions');
      }
      
      setPositions(result.data);
      setActiveTab('positions');
    } catch (error) {
      console.error('Error loading positions:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load positions',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle company selection
  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    loadDepartments(company.id);
  };
  
  // Handle department selection
  const handleDepartmentSelect = (department: Department) => {
    setSelectedDepartment(department);
    loadPositions(department.id);
  };
  
  // Handle position selection
  const handlePositionSelect = (position: Position) => {
    setSelectedPosition(position);
    linkDirectPosition(position.id);
  };
  
  // Go back to previous step
  const handleBack = () => {
    if (activeTab === 'positions') {
      setActiveTab('departments');
      setSelectedPosition(null);
    } else if (activeTab === 'departments') {
      setActiveTab('companies');
      setSelectedDepartment(null);
    } else if (onCancel) {
      onCancel();
    }
  };
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Link Candidate to Position</CardTitle>
        <CardDescription>
          {initialPositionId 
            ? 'Linking candidate to the selected position...'
            : 'Select a company, department, and position to link the candidate to'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="companies" disabled={activeTab !== 'companies'}>Companies</TabsTrigger>
            <TabsTrigger value="departments" disabled={activeTab !== 'departments'}>Departments</TabsTrigger>
            <TabsTrigger value="positions" disabled={activeTab !== 'positions'}>Positions</TabsTrigger>
          </TabsList>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              <TabsContent value="companies" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {companies.map(company => (
                    <CompanyCard
                      key={company.id}
                      company={company}
                      onEdit={() => {}}
                      onDelete={() => {}}
                    />
                  ))}
                </div>
                {companies.length === 0 && (
                  <div className="text-center p-8">
                    <p className="text-muted-foreground">No companies found</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="departments" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {departments.map(department => (
                    <DepartmentCard
                      key={department.id}
                      department={{...department, positionCount: 0, companyId: department.companyId || 0, createdAt: department.createdAt || null}}
                      onClick={() => handleDepartmentSelect(department)}
                    />
                  ))}
                </div>
                {departments.length === 0 && (
                  <div className="text-center p-8">
                    <p className="text-muted-foreground">No departments found</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="positions" className="mt-4">
                <div className="grid grid-cols-1 gap-4">
                  {positions.map(position => (
                    <PositionCard
                      key={position.id}
                      position={position}
                      onEdit={() => {}}
                      onDelete={() => {}}
                    />
                  ))}
                </div>
                {positions.length === 0 && (
                  <div className="text-center p-8">
                    <p className="text-muted-foreground">No positions found</p>
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          {activeTab === 'companies' ? 'Cancel' : 'Back'}
        </Button>
        {activeTab === 'direct' && (
          <Button onClick={() => linkDirectPosition(directPositionId)} disabled={loading || !directPositionId}>
            {loading ? <Spinner className="mr-2" /> : null}
            Link Position
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 