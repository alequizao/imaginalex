
// src/components/image-generator-client.tsx
"use client";

import { useState, useEffect, type ChangeEvent, type FormEvent, useRef } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { generateImageWithDetailPrompts, type DetailPromptInput } from '@/ai/flows/detail-prompt';
import ImageGalleryClient from './image-gallery-client';
import type { GeneratedItem } from './generated-image-card-client';
import { Sparkles, Plus, X, Loader2, Wand2, UploadCloud } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';

const LOCAL_STORAGE_PRIMARY_PROMPT_KEY = 'imaginalex_primary_prompt_v2';
const LOCAL_STORAGE_DETAIL_PROMPTS_KEY = 'imaginalex_detail_prompts_v2';

const ImageGeneratorClient = () => {
  const [primaryPrompt, setPrimaryPrompt] = useState<string>('');
  const [detailPromptInput, setDetailPromptInput] = useState<string>('');
  const [detailPrompts, setDetailPrompts] = useState<string[]>([]);
  const [generatedItems, setGeneratedItems] = useState<GeneratedItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [uploadedImageDataUri, setUploadedImageDataUri] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedPrimaryPrompt = localStorage.getItem(LOCAL_STORAGE_PRIMARY_PROMPT_KEY);
    if (savedPrimaryPrompt) {
      setPrimaryPrompt(savedPrimaryPrompt);
    }
    const savedDetailPrompts = localStorage.getItem(LOCAL_STORAGE_DETAIL_PROMPTS_KEY);
    if (savedDetailPrompts) {
      try {
        setDetailPrompts(JSON.parse(savedDetailPrompts));
      } catch (e) {
        localStorage.removeItem(LOCAL_STORAGE_DETAIL_PROMPTS_KEY);
      }
    }
  }, []);

  const handlePrimaryPromptChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newPrompt = e.target.value;
    setPrimaryPrompt(newPrompt);
    localStorage.setItem(LOCAL_STORAGE_PRIMARY_PROMPT_KEY, newPrompt);
  };

  const handleAddDetailPrompt = () => {
    if (detailPromptInput.trim() !== '' && !detailPrompts.includes(detailPromptInput.trim())) {
      const newDetailPrompts = [...detailPrompts, detailPromptInput.trim()];
      setDetailPrompts(newDetailPrompts);
      localStorage.setItem(LOCAL_STORAGE_DETAIL_PROMPTS_KEY, JSON.stringify(newDetailPrompts));
      setDetailPromptInput('');
    }
  };

  const handleRemoveDetailPrompt = (promptToRemove: string) => {
    const newDetailPrompts = detailPrompts.filter(p => p !== promptToRemove);
    setDetailPrompts(newDetailPrompts);
    localStorage.setItem(LOCAL_STORAGE_DETAIL_PROMPTS_KEY, JSON.stringify(newDetailPrompts));
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImagePreview(reader.result as string);
        setUploadedImageDataUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadedImagePreview(null);
      setUploadedImageDataUri(null);
    }
  };

  const handleClearUploadedImage = () => {
    setUploadedImagePreview(null);
    setUploadedImageDataUri(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGenerateImage = async (e: FormEvent) => {
    e.preventDefault();
    if (!primaryPrompt.trim()) {
      toast({
        title: "Prompt Primário Necessário",
        description: "Por favor, insira um prompt primário para gerar ou editar a imagem.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const input: DetailPromptInput = {
        primaryPrompt,
        detailPrompts,
        uploadedImage: uploadedImageDataUri || undefined,
      };
      const result = await generateImageWithDetailPrompts(input);
      setGeneratedItems(prevItems => [
        { id: Date.now().toString(), imageUrl: result.imageUrl, prompt: result.prompt },
        ...prevItems,
      ]);
      toast({
        title: "Imagem Processada!",
        description: `Sua imagem foi ${uploadedImageDataUri ? 'editada' : 'gerada'} com sucesso.`,
      });
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Erro ao Processar Imagem",
        description: "Ocorreu um problema ao processar a imagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-8">
      <Card className="shadow-xl bg-card">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2 text-primary">
            <Wand2 className="h-6 w-6" />
            Criador e Editor de Imagens IA
          </CardTitle>
          <CardDescription>
            Defina seu prompt primário, adicione detalhes e opcionalmente carregue uma imagem para edição.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerateImage} className="space-y-6">
            <div>
              <Label htmlFor="primary-prompt" className="text-lg font-medium text-foreground">Prompt Primário</Label>
              <Textarea
                id="primary-prompt"
                value={primaryPrompt}
                onChange={handlePrimaryPromptChange}
                placeholder="Ex: Um astronauta explorando um planeta alienígena vibrante..."
                className="mt-2 min-h-[100px] text-base"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Este é o prompt base para sua imagem.</p>
            </div>

            <div>
              <Label htmlFor="detail-prompt-input" className="text-lg font-medium text-foreground">Prompts de Detalhe</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="detail-prompt-input"
                  type="text"
                  value={detailPromptInput}
                  onChange={(e) => setDetailPromptInput(e.target.value)}
                  placeholder="Ex: estilo cyberpunk, iluminação neon, fotorrealista"
                  className="text-base"
                />
                <Button type="button" onClick={handleAddDetailPrompt} variant="secondary">
                  <Plus className="h-5 w-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Adicionar</span>
                </Button>
              </div>
              {detailPrompts.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Detalhes Ativos:</p>
                  <div className="flex flex-wrap gap-2">
                    {detailPrompts.map((prompt, index) => (
                      <Badge key={index} variant="outline" className="text-sm py-1 px-3 bg-secondary hover:bg-secondary/80">
                        {prompt}
                        <button
                          type="button"
                          onClick={() => handleRemoveDetailPrompt(prompt)}
                          className="ml-2 p-0.5 rounded-full hover:bg-destructive/20"
                          aria-label={`Remover ${prompt}`}
                        >
                          <X className="h-3.5 w-3.5 text-destructive" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="image-upload" className="text-lg font-medium text-foreground">
                Editar Imagem Existente (Opcional)
              </Label>
              <div className="mt-2 flex items-center gap-2 p-4 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors">
                <UploadCloud className="h-8 w-8 text-muted-foreground"/>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                  className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </div>
              {uploadedImagePreview && (
                <div className="mt-4 space-y-3 p-4 border rounded-md bg-muted/20">
                  <p className="text-sm font-medium text-foreground">Pré-visualização da Imagem Carregada:</p>
                  <div className="relative w-full max-w-sm mx-auto aspect-square rounded-md overflow-hidden shadow-md">
                    <Image 
                        src={uploadedImagePreview} 
                        alt="Uploaded preview" 
                        layout="fill" 
                        objectFit="contain" 
                        data-ai-hint="uploaded image"
                    />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleClearUploadedImage} className="w-full sm:w-auto">
                    <X className="mr-2 h-4 w-4" />
                    Limpar Imagem Carregada
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Faça upload de uma imagem se desejar que a IA a edite com base nos prompts fornecidos.
              </p>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full text-lg py-6 bg-accent hover:bg-accent/90 text-accent-foreground">
              {isLoading ? (
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-6 w-6" />
              )}
              {isLoading ? 'Processando Imagem...' : (uploadedImageDataUri ? 'Editar Imagem com IA' : 'Gerar Nova Imagem')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <ImageGalleryClient items={generatedItems} />
    </div>
  );
};

export default ImageGeneratorClient;
