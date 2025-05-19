// src/components/image-gallery-client.tsx
"use client";

import type { FC } from 'react';
import GeneratedImageCardClient, { type GeneratedItem } from './generated-image-card-client';
import { Info } from 'lucide-react';

interface ImageGalleryClientProps {
  items: GeneratedItem[];
}

const ImageGalleryClient: FC<ImageGalleryClientProps> = ({ items }) => {
  if (items.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border rounded-lg bg-card">
        <Info className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-foreground">Nenhuma Imagem Gerada Ainda</h3>
        <p className="text-muted-foreground">Use os campos acima para gerar sua primeira imagem com IMAGINALEX!</p>
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <GeneratedImageCardClient key={item.id} item={item} />
      ))}
    </div>
  );
};

export default ImageGalleryClient;
