import ImageGeneratorClient from '@/components/image-generator-client';
import { Palette } from 'lucide-react'; // Or any other suitable icon

export default function HomePage() {
  return (
    <div className="flex flex-col items-center min-h-screen py-8 px-4 bg-background text-foreground">
      <header className="my-8 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4">
           <Palette className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-5xl font-bold text-primary tracking-tight">
          IMAGINALEX
        </h1>
        <p className="text-xl text-muted-foreground mt-3 max-w-2xl">
          Transforme suas ideias em visuais impressionantes. Digite um prompt, adicione detalhes e deixe a IA criar imagens únicas para você.
        </p>
      </header>
      <main className="w-full flex justify-center">
        <ImageGeneratorClient />
      </main>
       <footer className="py-8 mt-12 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} IMAGINALEX. Criado com Next.js e Genkit.</p>
      </footer>
    </div>
  );
}
