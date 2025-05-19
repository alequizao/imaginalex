
'use server';

/**
 * @fileOverview Generates images from prompts or edits existing images using prompts.
 * Can also use multiple uploaded images as reference.
 *
 * - generateImageWithDetailPrompts - A function that generates/edits/references images.
 * - DetailPromptInput - The input type (includes an optional array of uploaded image data URIs).
 * - DetailPromptOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { enhancePrompt, type EnhancePromptInput } from './enhance-prompt-flow';


const DetailPromptInputSchema = z.object({
  primaryPrompt: z.string().describe('The primary prompt for image generation, editing, or referencing.'),
  detailPrompts: z.array(z.string()).describe('An array of detail prompts to enhance the primary prompt.'),
  uploadedImages: z.array(z.string()).optional().describe(
    "Optional. An array of uploaded images to be edited (if single) or used as reference/inspiration (if multiple), as data URIs. Format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type DetailPromptInput = z.infer<typeof DetailPromptInputSchema>;

const DetailPromptOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the processed image.'),
  prompt: z.string().describe('The user-facing prompt summary used for the image task.'),
});
export type DetailPromptOutput = z.infer<typeof DetailPromptOutputSchema>;

export async function generateImageWithDetailPrompts(input: DetailPromptInput): Promise<DetailPromptOutput> {
  return detailPromptFlow(input);
}

const detailPromptFlow = ai.defineFlow(
  {
    name: 'detailPromptFlow',
    inputSchema: DetailPromptInputSchema,
    outputSchema: DetailPromptOutputSchema,
  },
  async (inputData) => {
    const {
      primaryPrompt,
      detailPrompts,
      uploadedImages,
    } = inputData;

    // Enhance the primary prompt
    const enhanceInput: EnhancePromptInput = { originalPrompt: primaryPrompt };
    const enhancedPromptResult = await enhancePrompt(enhanceInput);
    const enhancedPrimaryPrompt = enhancedPromptResult.enhancedPrompt;

    let textInstruction = `Prompt primário (aprimorado): "${enhancedPrimaryPrompt}".`;
    if (detailPrompts.length > 0) {
      textInstruction += ` Detalhes adicionais: ${detailPrompts.join(", ")}.`;
    }
    
    let userFacingPromptSummary = `Prompt original: "${primaryPrompt}".`;
    if (detailPrompts.length > 0) {
        userFacingPromptSummary += ` Detalhes: ${detailPrompts.join(", ")}.`;
    }

    let modelPromptParts: any[] = [];
    let operationType = "Gerando nova imagem";

    if (uploadedImages && uploadedImages.length > 0) {
      if (uploadedImages.length === 1) {
        // Edit a single uploaded image
        const preserveFaceInstruction = "Ao editar, preserve as características faciais originais da pessoa na imagem o máximo possível. Evite alterar o rosto.";
        const editText = `Edite a imagem fornecida. ${textInstruction} ${preserveFaceInstruction}`;
        modelPromptParts.push({media: {url: uploadedImages[0]}});
        modelPromptParts.push({text: editText});
        operationType = "Editando imagem";
        userFacingPromptSummary = `(Editando 1 imagem) ${userFacingPromptSummary}`;
      } else {
        // Use multiple images as reference/inspiration
        const referenceText = `Considere as seguintes ${uploadedImages.length} imagens como referência ou inspiração. ${textInstruction}. Tente combinar elementos ou estilos das imagens de referência no resultado final, conforme descrito pelo prompt. Se houver pessoas nas imagens de referência, tente manter suas características gerais se fizerem parte do prompt.`;
        modelPromptParts.push({text: referenceText});
        uploadedImages.forEach(imgDataUri => {
          modelPromptParts.push({media: {url: imgDataUri}});
        });
        operationType = `Usando ${uploadedImages.length} imagens como referência`;
        userFacingPromptSummary = `(Referenciando ${uploadedImages.length} imagens) ${userFacingPromptSummary}`;
      }
    } else {
      // Generate a new image
      const generateText = `Gere uma imagem. ${textInstruction}`;
      modelPromptParts.push({text: generateText});
      userFacingPromptSummary = `(Gerando nova imagem) ${userFacingPromptSummary}`;
    }
    
    // If only one part and it's text, modelPrompt can be a string. Otherwise, it's an array.
    const finalModelPrompt = modelPromptParts.length === 1 && typeof modelPromptParts[0] === 'string' 
      ? modelPromptParts[0]
      : modelPromptParts.every(part => part.text && !part.media) 
      ? modelPromptParts.map(p => p.text).join(" ")
      : modelPromptParts;


    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: finalModelPrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    return {
      imageUrl: media.url,
      prompt: userFacingPromptSummary, // Show user's original prompt with details
    };
  }
);
