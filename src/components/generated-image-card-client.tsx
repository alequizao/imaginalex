// src/components/generated-image-card-client.tsx
"use client";

import type { FC } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export interface GeneratedItem {
  id: string;
  imageUrl: string;
  prompt: string;
}

interface GeneratedImageCardClientProps {
  item: GeneratedItem;
}

const GeneratedImageCardClient: FC<GeneratedImageCardClientProps> = ({ item }) => {
  const { toast } = useToast();

  const handleSaveImage = async () => {
    if (!item.imageUrl) return;
    try {
      // The imageUrl from Genkit is a data URI, which can be directly used.
      // For other types of URLs, fetching might be needed as shown in commented code.
      const a = document.createElement('a');
      a.href = item.imageUrl;
      // Sanitize prompt for filename
      const sanitizedPrompt = item.prompt.substring(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase();
      a.download = `imaginalex_${sanitizedPrompt}_${item.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast({
        title: "Imagem Salva",
        description: "A imagem foi baixada com sucesso.",
      });
    } catch (error) {
      console.error("Error downloading image:", error);
      toast({
        title: "Erro ao Baixar Imagem",
        description: "Não foi possível salvar a imagem. Verifique o console para mais detalhes.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="overflow-hidden shadow-lg animate-fadeIn bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="truncate text-lg">Imagem Gerada</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-square w-full relative rounded-md overflow-hidden bg-muted">
          <Image
            src={item.imageUrl || "https://placehold.co/512x512.png"}
            alt={`Imagem gerada para: ${item.prompt}`}
            layout="fill"
            objectFit="cover"
            data-ai-hint="generated art"
            className="transition-transform duration-300 ease-in-out hover:scale-105"
          />
        </div>
        <CardDescription className="text-xs h-16 overflow-y-auto p-1 border rounded-md bg-muted/50">
          <span className="font-semibold">Prompt:</span> {item.prompt}
        </CardDescription>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveImage} variant="outline" size="sm" className="w-full">
          <Download className="mr-2 h-4 w-4" />
          Salvar Imagem
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GeneratedImageCardClient;
