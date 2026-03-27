'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Save, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface Field {
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  autoFillSource?: string;
}

interface DynamicFormProps {
  fields: Field[];
  initialData: Record<string, any>;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export default function DynamicApplicationForm({
  fields,
  initialData,
  onSubmit,
  isLoading
}: DynamicFormProps) {
  // Create schema dynamically based on fields
  const schemaMap: Record<string, any> = {};
  fields.forEach(field => {
    let fieldSchema = z.string();
    if (field.required) {
      fieldSchema = fieldSchema.min(1, { message: `${field.label} is required` });
    } else {
      fieldSchema = fieldSchema.optional() as any;
    }
    schemaMap[field.name] = fieldSchema;
  });

  const schema = z.object(schemaMap);

  const onError = (errors: any) => {
    console.error('Form validation failed:', errors);
    toast.error('Please fill all required fields correctly');
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData
  });

  useEffect(() => {
    reset(initialData);
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={field.name} className="text-sm font-semibold">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {field.autoFillSource && initialData[field.name] && (
                <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[10px] gap-1 px-2 py-0">
                  <Sparkles className="w-2.5 h-2.5" />
                  Auto-filled
                </Badge>
              )}
            </div>
            
            <Input
              id={field.name}
              type={field.type}
              placeholder={field.placeholder}
              {...register(field.name)}
              className={errors[field.name] ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            
            {errors[field.name] && (
              <p className="text-xs font-medium text-destructive mt-1">
                {errors[field.name]?.message as string}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-4 pt-6">
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-12 rounded-xl"
          onClick={() => toast.info('Draft saved locally')}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Draft
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 h-12 rounded-xl font-bold bg-primary hover:bg-primary/90"
        >
          {isLoading ? 'Processing...' : 'Review Application'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
