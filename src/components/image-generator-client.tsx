
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
import { Sparkles, Plus, X, Loader2, Wand2, UploadCloud, Users } from 'lucide-react';
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

  const [uploadedImagePreview2, setUploadedImagePreview2] = useState<string | null>(null);
  const [uploadedImageDataUri2, setUploadedImageDataUri2] = useState<string | null>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, imageNumber: 1 | 2) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (imageNumber === 1) {
          setUploadedImagePreview(result);
          setUploadedImageDataUri(result);
        } else {
          setUploadedImagePreview2(result);
          setUploadedImageDataUri2(result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      if (imageNumber === 1) {
        setUploadedImagePreview(null);
        setUploadedImageDataUri(null);
      } else {
        setUploadedImagePreview2(null);
        setUploadedImageDataUri2(null);
      }
    }
  };

  const handleClearUploadedImage = (imageNumber: 1 | 2) => {
    if (imageNumber === 1) {
      setUploadedImagePreview(null);
      setUploadedImageDataUri(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } else {
      setUploadedImagePreview2(null);
      setUploadedImageDataUri2(null);
      if (fileInputRef2.current) {
        fileInputRef2.current.value = "";
      }
    }
  };

  const handleGenerateImage = async (e: FormEvent) => {
    e.preventDefault();
    if (!primaryPrompt.trim()) {
      toast({
        title: "Prompt Primário Necessário",
        description: "Por favor, insira um prompt primário para gerar, editar ou mesclar imagens.",
        variant: "destructive",
      });
      return;
    }
    if (uploadedImageDataUri2 && !uploadedImageDataUri) {
        toast({
            title: "Primeira Imagem Necessária",
            description: "Por favor, carregue a primeira imagem se quiser usar a funcionalidade de mesclagem com uma segunda imagem.",
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
        uploadedImage2: uploadedImageDataUri2 || undefined,
      };
      const result = await generateImageWithDetailPrompts(input);
      setGeneratedItems(prevItems => [
        { id: Date.now().toString(), imageUrl: result.imageUrl, prompt: result.prompt },
        ...prevItems,
      ]);
      let toastMessage = "Sua imagem foi gerada com sucesso.";
      if (uploadedImageDataUri && uploadedImageDataUri2) {
        toastMessage = "Sua tentativa de mesclagem de imagem foi processada.";
      } else if (uploadedImageDataUri) {
        toastMessage = "Sua imagem foi editada com sucesso.";
      }
      toast({
        title: "Imagem Processada!",
        description: toastMessage,
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
  
  const getButtonText = () => {
    if (isLoading) return 'Processando Imagem...';
    if (uploadedImageDataUri && uploadedImageDataUri2) return 'Mesclar Imagens com IA';
    if (uploadedImageDataUri) return 'Editar Imagem com IA';
    return 'Gerar Nova Imagem';
  };

  return (
    <div className="w-full max-w-4xl space-y-8">
      <Card className="shadow-xl bg-card">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2 text-primary">
            <Wand2 className="h-6 w-6" />
            Criador, Editor e Mesclador de Imagens IA
          </CardTitle>
          <CardDescription>
            Defina seu prompt, adicione detalhes e opcionalmente carregue uma ou duas imagens para edição/mesclagem.
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
                placeholder="Ex: Um astronauta... Combine as pessoas em uma paisagem cyberpunk..."
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="image-upload-1" className="text-lg font-medium text-foreground">
                  Imagem 1 (Base para Edição/Mesclagem)
                </Label>
                <div className="mt-2 flex items-center gap-2 p-4 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors">
                  <UploadCloud className="h-8 w-8 text-muted-foreground"/>
                  <Input
                    id="image-upload-1"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 1)}
                    ref={fileInputRef}
                    className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                </div>
                {uploadedImagePreview && (
                  <div className="mt-4 space-y-3 p-4 border rounded-md bg-muted/20">
                    <p className="text-sm font-medium text-foreground">Pré-visualização Imagem 1:</p>
                    <div className="relative w-full max-w-xs mx-auto aspect-square rounded-md overflow-hidden shadow-md">
                      <Image 
                          src={uploadedImagePreview} 
                          alt="Uploaded preview 1" 
                          layout="fill" 
                          objectFit="contain" 
                          data-ai-hint="uploaded image person"
                      />
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => handleClearUploadedImage(1)} className="w-full sm:w-auto">
                      <X className="mr-2 h-4 w-4" />
                      Limpar Imagem 1
                    </Button>
                  </div>
                )}
                 <p className="text-xs text-muted-foreground mt-1">
                  Carregue a primeira imagem para edição ou para ser a base da mesclagem.
                </p>
              </div>

              <div>
                <Label htmlFor="image-upload-2" className="text-lg font-medium text-foreground">
                  Imagem 2 (Para Mesclagem - Opcional)
                </Label>
                <div className="mt-2 flex items-center gap-2 p-4 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors">
                  <UploadCloud className="h-8 w-8 text-muted-foreground"/>
                  <Input
                    id="image-upload-2"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 2)}
                    ref={fileInputRef2}
                    className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                </div>
                {uploadedImagePreview2 && (
                  <div className="mt-4 space-y-3 p-4 border rounded-md bg-muted/20">
                    <p className="text-sm font-medium text-foreground">Pré-visualização Imagem 2:</p>
                    <div className="relative w-full max-w-xs mx-auto aspect-square rounded-md overflow-hidden shadow-md">
                      <Image 
                          src={uploadedImagePreview2} 
                          alt="Uploaded preview 2" 
                          layout="fill" 
                          objectFit="contain" 
                          data-ai-hint="uploaded image person"
                      />
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => handleClearUploadedImage(2)} className="w-full sm:w-auto">
                      <X className="mr-2 h-4 w-4" />
                      Limpar Imagem 2
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Carregue uma segunda imagem se desejar tentar mesclar pessoas de duas fontes.
                </p>
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full text-lg py-6 bg-accent hover:bg-accent/90 text-accent-foreground">
              {isLoading ? (
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              ) : (
                (uploadedImageDataUri && uploadedImageDataUri2) ? <Users className="mr-2 h-6 w-6" /> : <Sparkles className="mr-2 h-6 w-6" />
              )}
              {getButtonText()}
            </Button>
            {uploadedImageDataUri && uploadedImageDataUri2 && (
                 <p className="text-xs text-center text-muted-foreground mt-2">
                    Nota: A mesclagem de imagens é experimental. Os resultados podem variar e a fidelidade facial pode não ser perfeita.
                 </p>
            )}
          </form>
        </CardContent>
      </Card>

      <ImageGalleryClient items={generatedItems} />
    </div>
  );
};

export default ImageGeneratorClient;


    