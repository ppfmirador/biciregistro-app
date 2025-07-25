
"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const searchSchema = z.object({
  serialNumber: z.string().min(1, { message: 'El número de serie es obligatorio.' }),
});

type SearchFormValues = z.infer<typeof searchSchema>;

interface SearchBikeFormProps {
  initialSerialNumber?: string;
}

const SearchBikeForm: React.FC<SearchBikeFormProps> = ({ initialSerialNumber }) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      serialNumber: initialSerialNumber || "",
    }
  });

  const onSubmit: SubmitHandler<SearchFormValues> = async (data) => {
    setIsLoading(true);
    try {
      // Append ?from=home to indicate navigation from homepage search
      router.push(`/bike/${encodeURIComponent(data.serialNumber.trim())}?from=home`);
    } catch (_error: unknown) {
       toast({
        title: 'Error en la Búsqueda',
        description: 'No se pudo procesar la búsqueda. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
      <div>
        <Label htmlFor="serialNumber" className="sr-only">Número de Serie</Label>
        <div className="relative">
          <Input
            id="serialNumber"
            type="text"
            placeholder="Ingresa el número de serie de la bici"
            {...register('serialNumber')}
            className={`text-base h-12 pl-4 pr-12 ${errors.serialNumber ? 'border-destructive' : ''}`}
            aria-describedby="serialNumberError"
          />
          <Button 
            type="submit" 
            size="icon" 
            className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10"
            disabled={isLoading}
            aria-label="Buscar Bicicleta"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
          </Button>
        </div>
        {errors.serialNumber && <p id="serialNumberError" className="mt-2 text-sm text-destructive">{errors.serialNumber.message}</p>}
      </div>
    </form>
  );
};

export default SearchBikeForm;
