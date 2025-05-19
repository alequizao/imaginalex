
// src/components/image-generator-client.tsx
"use client";

import React, { useState, useEffect, type ChangeEvent, type FormEvent, useRef } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button'; // Import buttonVariants
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { generateImageWithDetailPrompts, type DetailPromptInput } from '@/ai/flows/detail-prompt';
import ImageGalleryClient from './image-gallery-client';
import type { GeneratedItem } from './generated-image-card-client';
import { Sparkles, Plus, X, Loader2, Wand2, UploadCloud, Users, ImagePlus, Trash2, History } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const LOCAL_STORAGE_PRIMARY_PROMPT_KEY = 'imaginalex_primary_prompt_v3';
const LOCAL_STORAGE_DETAIL_PROMPTS_KEY = 'imaginalex_detail_prompts_v3';
const LOCAL_STORAGE_GENERATED_ITEMS_KEY = 'imaginalex_generated_items_v1';
const MAX_HISTORY_ITEMS = 5; // Reduced from 20

interface UploadedImageFile {
  id: string;
  previewUrl: string;
  dataUrl: string;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const ImageGeneratorClient = () => {
  const [primaryPrompt, setPrimaryPrompt] = useState<string>('');
  const [detailPromptInput, setDetailPromptInput] = useState<string>('');
  const [detailPrompts, setDetailPrompts] = useState<string[]>([]);
  const [generatedItems, setGeneratedItems] = useState<GeneratedItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [uploadedImageFiles, setUploadedImageFiles] = useState<UploadedImageFile[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    // Load prompts from localStorage
    const savedPrimaryPrompt = localStorage.getItem(LOCAL_STORAGE_PRIMARY_PROMPT_KEY);
    if (savedPrimaryPrompt) {
      setPrimaryPrompt(savedPrimaryPrompt);
    }
    const savedDetailPrompts = localStorage.getItem(LOCAL_STORAGE_DETAIL_PROMPTS_KEY);
    if (savedDetailPrompts) {
      try {
        setDetailPrompts(JSON.parse(savedDetailPrompts));
      } catch (e) {
        console.error("Failed to parse detail prompts from localStorage:", e);
        localStorage.removeItem(LOCAL_STORAGE_DETAIL_PROMPTS_KEY);
      }
    }

    // Load generated items history from localStorage
    const savedGeneratedItems = localStorage.getItem(LOCAL_STORAGE_GENERATED_ITEMS_KEY);
    if (savedGeneratedItems) {
      try {
        setGeneratedItems(JSON.parse(savedGeneratedItems));
      } catch (e) {
        console.error("Failed to parse generated items from localStorage:", e);
        localStorage.removeItem(LOCAL_STORAGE_GENERATED_ITEMS_KEY);
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
      try {
        localStorage.setItem(LOCAL_STORAGE_DETAIL_PROMPTS_KEY, JSON.stringify(newDetailPrompts));
      } catch (error) {
        console.error("Error saving detail prompts to localStorage:", error);
        toast({
          title: "Erro ao Salvar Detalhes",
          description: "Não foi possível salvar os prompts de detalhe no armazenamento local.",
          variant: "destructive",
        });
      }
    }
    setDetailPromptInput('');
  };

  const handleRemoveDetailPrompt = (promptToRemove: string) => {
    const newDetailPrompts = detailPrompts.filter(p => p !== promptToRemove);
    setDetailPrompts(newDetailPrompts);
    try {
      localStorage.setItem(LOCAL_STORAGE_DETAIL_PROMPTS_KEY, JSON.stringify(newDetailPrompts));
    } catch (error) {
        console.error("Error saving detail prompts to localStorage:", error);
         toast({
          title: "Erro ao Salvar Detalhes",
          description: "Não foi possível salvar os prompts de detalhe no armazenamento local.",
          variant: "destructive",
        });
    }
  };

  const handleAddImageSlot = () => {
    const newImageFile: UploadedImageFile = {
      id: `image-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      previewUrl: '',
      dataUrl: '',
      fileInputRef: React.createRef<HTMLInputElement>(),
    };
    setUploadedImageFiles(prev => [...prev, newImageFile]);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, imageId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setUploadedImageFiles(prevFiles => 
          prevFiles.map(imgFile => 
            imgFile.id === imageId ? { ...imgFile, previewUrl: result, dataUrl: result } : imgFile
          )
        );
      };
      reader.readAsDataURL(file);
    } else {
       setUploadedImageFiles(prevFiles => 
        prevFiles.map(imgFile => 
          imgFile.id === imageId ? { ...imgFile, previewUrl: '', dataUrl: '' } : imgFile
        )
      );
    }
  };

  const handleRemoveImageSlot = (imageId: string) => {
    setUploadedImageFiles(prevFiles => prevFiles.filter(imgFile => imgFile.id !== imageId));
  };


  const handleGenerateImage = async (e: FormEvent) => {
    e.preventDefault();
    if (!primaryPrompt.trim()) {
      toast({
        title: "Prompt Primário Necessário",
        description: "Por favor, insira um prompt primário para gerar, editar ou referenciar imagens.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const imageUris = uploadedImageFiles.map(f => f.dataUrl).filter(Boolean);
      const input: DetailPromptInput = {
        primaryPrompt,
        detailPrompts,
        uploadedImages: imageUris.length > 0 ? imageUris : undefined,
      };
      const result = await generateImageWithDetailPrompts(input);
      
      const newItem: GeneratedItem = { id: Date.now().toString(), imageUrl: result.imageUrl, prompt: result.prompt };
      
      setGeneratedItems(prevItems => {
        const updatedItems = [newItem, ...prevItems].slice(0, MAX_HISTORY_ITEMS);
        try {
          localStorage.setItem(LOCAL_STORAGE_GENERATED_ITEMS_KEY, JSON.stringify(updatedItems));
        } catch (error: any) {
          console.error("Error saving generated items to localStorage:", error);
          if (error.name === 'QuotaExceededError' || (error instanceof DOMException && error.name === 'QuotaExceededError')) {
            toast({
              title: "Erro ao Salvar Histórico",
              description: "O armazenamento local está cheio. Não foi possível salvar esta imagem no histórico. Tente limpar o histórico.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Erro ao Salvar Histórico",
              description: "Não foi possível salvar esta imagem no histórico.",
              variant: "destructive",
            });
          }
        }
        return updatedItems;
      });
      
      let toastMessage = "Sua imagem foi gerada com sucesso.";
      if (imageUris.length === 1) {
        toastMessage = "Sua imagem foi editada com sucesso.";
      } else if (imageUris.length > 1) {
        toastMessage = `Sua imagem foi gerada com base em ${imageUris.length} referências.`;
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
  
  const handleClearHistory = () => {
    setGeneratedItems([]);
    localStorage.removeItem(LOCAL_STORAGE_GENERATED_ITEMS_KEY);
    toast({
      title: "Histórico Limpo",
      description: "Seu histórico de imagens geradas foi removido.",
    });
  };

  const getButtonText = () => {
    if (isLoading) return 'Processando Imagem...';
    const numImages = uploadedImageFiles.filter(f => f.dataUrl).length;
    if (numImages === 1) return 'Editar Imagem com IA';
    if (numImages > 1) return `Gerar com ${numImages} Imgs de Referência`;
    return 'Gerar Nova Imagem';
  };

  const getButtonIcon = () => {
    if (isLoading) return <Loader2 className="mr-2 h-6 w-6 animate-spin" />;
    const numImages = uploadedImageFiles.filter(f => f.dataUrl).length;
    if (numImages === 1) return <Wand2 className="mr-2 h-6 w-6" />;
    if (numImages > 1) return <Users className="mr-2 h-6 w-6" />;
    return <Sparkles className="mr-2 h-6 w-6" />;
  }

  return (
    <div className="w-full max-w-4xl space-y-8">
      <Card className="shadow-xl bg-card">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2 text-primary">
            <Wand2 className="h-6 w-6" />
            Criador, Editor e Referenciador de Imagens IA
          </CardTitle>
          <CardDescription>
            Defina seu prompt, adicione detalhes e opcionalmente carregue uma ou mais imagens para edição/referência.
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
                placeholder="Ex: Um astronauta em Marte, estilo Van Gogh..."
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
            
            <div className="space-y-4">
              <Label className="text-lg font-medium text-foreground">
                Imagens Carregadas (para edição ou referência)
              </Label>
              {uploadedImageFiles.map((imgFile, index) => (
                <Card key={imgFile.id} className="p-4 bg-muted/30">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-grow w-full sm:w-auto">
                       <Label htmlFor={`image-upload-${imgFile.id}`} className="text-sm font-medium text-foreground mb-1 block">
                         Imagem {index + 1}
                       </Label>
                      <div className="flex items-center gap-2 p-3 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors bg-background">
                        <UploadCloud className="h-6 w-6 text-muted-foreground"/>
                        <Input
                          id={`image-upload-${imgFile.id}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, imgFile.id)}
                          ref={imgFile.fileInputRef}
                          className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        />
                      </div>
                    </div>
                    {imgFile.previewUrl && (
                      <div className="flex-shrink-0 space-y-2 text-center">
                        <p className="text-xs font-medium text-foreground">Pré-visualização:</p>
                        <div className="relative w-24 h-24 mx-auto aspect-square rounded-md overflow-hidden shadow-md border bg-card">
                          <Image 
                              src={imgFile.previewUrl} 
                              alt={`Uploaded preview ${index + 1}`}
                              layout="fill" 
                              objectFit="contain" 
                              data-ai-hint="uploaded image abstract"
                          />
                        </div>
                      </div>
                    )}
                     <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemoveImageSlot(imgFile.id)}
                        className="text-destructive hover:bg-destructive/10 flex-shrink-0"
                        aria-label={`Remover Imagem ${index + 1}`}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                  </div>
                </Card>
              ))}
              <Button type="button" variant="outline" onClick={handleAddImageSlot} className="w-full sm:w-auto">
                <ImagePlus className="mr-2 h-5 w-5" />
                Adicionar Imagem
              </Button>
               <p className="text-xs text-muted-foreground mt-1">
                 Carregue uma imagem para edição, ou múltiplas imagens para usar como referência/inspiração.
               </p>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full text-lg py-6 bg-accent hover:bg-accent/90 text-accent-foreground">
              {getButtonIcon()}
              {getButtonText()}
            </Button>
            {uploadedImageFiles.filter(f => f.dataUrl).length > 1 && (
                 <p className="text-xs text-center text-muted-foreground mt-2">
                    Nota: Usar múltiplas imagens como referência é experimental. Os resultados podem variar.
                 </p>
            )}
          </form>
        </CardContent>
      </Card>

      <div className="mt-12 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold flex items-center text-primary">
            <History className="mr-3 h-7 w-7" />
            Histórico de Imagens Geradas
          </h2>
          {generatedItems.length > 0 && (
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Limpar Histórico
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Limpeza do Histórico</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza de que deseja apagar todas as imagens do seu histórico local? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearHistory} className={buttonVariants({variant: "destructive"})}>
                    Limpar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        <ImageGalleryClient items={generatedItems} />
      </div>
    </div>
  );
};

export default ImageGeneratorClient;

