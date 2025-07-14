import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { updateEntityFields } from '../lib/api';

interface FieldConfig {
  field: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select';
  options?: string[];
}

interface ValidationResult {
  isComplete: boolean;
  missingFields: FieldConfig[];
  availableFields: Record<string, any>;
  entityType: string;
  entityId: string;
}

interface EntityValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (updatedEntity: any) => void;
  entityType: string;
  entityName: string;
  validationResult: ValidationResult;
}

export const EntityValidationModal: React.FC<EntityValidationModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  entityType,
  entityName,
  validationResult
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    // Initialize form data with empty values for missing fields
    const initialData: Record<string, string> = {};
    validationResult.missingFields.forEach(field => {
      initialData[field.field] = '';
    });
    setFormData(initialData);
    setErrors({});
  }, [validationResult]);

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    validationResult.missingFields.forEach(field => {
      const value = formData[field.field];
      if (!value || value.trim() === '') {
        newErrors[field.field] = `${field.label} is required`;
      } else if (field.type === 'email' && !/\S+@\S+\.\S+/.test(value)) {
        newErrors[field.field] = 'Please enter a valid email address';
      } else if (field.type === 'tel' && !/^\+?[\d\s\-\(\)]+$/.test(value)) {
        newErrors[field.field] = 'Please enter a valid phone number';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields correctly',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await updateEntityFields(
        validationResult.entityType,
        validationResult.entityId,
        formData
      );
      
      if (response.success) {
        toast({
          title: 'Success',
          description: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} information updated successfully`
        });
        
        onComplete(response.data);
      } else {
        throw new Error(response.error || 'Failed to update entity');
      }
    } catch (error) {
      console.error('Error updating entity:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update entity information',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onComplete(null); // Continue without updating
  };

  const renderField = (fieldConfig: FieldConfig) => {
    const value = formData[fieldConfig.field] || '';
    const error = errors[fieldConfig.field];
    
    return (
      <div key={fieldConfig.field} className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={fieldConfig.field} className="text-right">
          {fieldConfig.label}
          <span className="text-red-500 ml-1">*</span>
        </Label>
        <div className="col-span-3">
          {fieldConfig.type === 'textarea' ? (
            <Textarea
              id={fieldConfig.field}
              value={value}
              onChange={(e) => handleFieldChange(fieldConfig.field, e.target.value)}
              placeholder={`Enter ${fieldConfig.label.toLowerCase()}`}
              className={error ? 'border-red-500' : ''}
            />
          ) : fieldConfig.type === 'select' ? (
            <Select
              value={value}
              onValueChange={(newValue) => handleFieldChange(fieldConfig.field, newValue)}
            >
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue placeholder={`Select ${fieldConfig.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {fieldConfig.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id={fieldConfig.field}
              type={fieldConfig.type}
              value={value}
              onChange={(e) => handleFieldChange(fieldConfig.field, e.target.value)}
              placeholder={`Enter ${fieldConfig.label.toLowerCase()}`}
              className={error ? 'border-red-500' : ''}
            />
          )}
          {error && (
            <p className="text-sm text-red-500 mt-1">{error}</p>
          )}
        </div>
      </div>
    );
  };

  const completedFieldsCount = Object.keys(validationResult.availableFields).length;
  const totalFieldsCount = completedFieldsCount + validationResult.missingFields.length;
  const completionPercentage = Math.round((completedFieldsCount / totalFieldsCount) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Complete {entityType.charAt(0).toUpperCase() + entityType.slice(1)} Information
          </DialogTitle>
          <DialogDescription>
            The selected {entityType} "{entityName}" is missing some required information. 
            Please fill in the missing fields to proceed with campaign creation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Completion Progress</span>
              <Badge variant={completionPercentage === 100 ? 'default' : 'secondary'}>
                {completionPercentage}% Complete
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>{completedFieldsCount} of {totalFieldsCount} fields completed</span>
              <span>{validationResult.missingFields.length} fields missing</span>
            </div>
          </div>

          {/* Available fields info */}
          {Object.keys(validationResult.availableFields).length > 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Already completed:</strong> {Object.keys(validationResult.availableFields).join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {/* Missing fields form */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Please fill in the following required fields:</span>
            </div>
            
            {validationResult.missingFields.map(renderField)}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleSkip}>
            Skip for Now
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading}
            className="min-w-[120px]"
          >
            {loading ? 'Updating...' : 'Update & Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EntityValidationModal; 