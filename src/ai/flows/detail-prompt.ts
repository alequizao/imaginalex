
'use server';

/**
 * @fileOverview Generates images from prompts or edits existing images using prompts.
 * Can also attempt to merge two uploaded images based on text prompts.
 *
 * - generateImageWithDetailPrompts - A function that generates/edits/merges images.
 * - DetailPromptInput - The input type (includes optional uploaded image data URIs).
 * - DetailPromptOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { enhancePrompt, type EnhancePromptInput } from './enhance-prompt-flow';


const DetailPromptInputSchema = z.object({
  primaryPrompt: z.string().describe('The primary prompt for image generation, editing, or merging.'),
  detailPrompts: z.array(z.string()).describe('An array of detail prompts to enhance the primary prompt.'),
  uploadedImage: z.string().optional().describe(
    "Optional. A primary uploaded image to be edited or used in a merge, as a data URI. Format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  uploadedImage2: z.string().optional().describe(
    "Optional. A secondary uploaded image to be used in a merge, as a data URI. Format: 'data:<mimetype>;base64,<encoded_data>'."
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
      uploadedImage,
      uploadedImage2,
    } = inputData;

    // Enhance the primary prompt
    const enhanceInput: EnhancePromptInput = { originalPrompt: primaryPrompt };
    const enhancedPromptResult = await enhancePrompt(enhanceInput);
    const enhancedPrimaryPrompt = enhancedPromptResult.enhancedPrompt;

    let textInstruction = `Prompt primário (aprimorado): "${enhancedPrimaryPrompt}".`;
    if (detailPrompts.length > 0) {
      textInstruction += ` Detalhes adicionais: ${detailPrompts.join(", ")}.`;
    }
    
    // Construct userFacingPromptSummary with the original primary prompt
    let userFacingPromptSummary = `Prompt original: "${primaryPrompt}".`;
    if (detailPrompts.length > 0) {
        userFacingPromptSummary += ` Detalhes: ${detailPrompts.join(", ")}.`;
    }


    let modelPrompt: any;

    if (uploadedImage && uploadedImage2) {
      // Attempt to merge two images
      const mergeText = `Mescle as pessoas das duas imagens fornecidas em uma nova cena descrita por: ${textInstruction}. Ao mesclar, preserve as características faciais originais das pessoas de ambas as imagens o máximo possível. Evite alterar os rostos.`;
      modelPrompt = [
        {media: {url: uploadedImage}},
        {media: {url: uploadedImage2}},
        {text: mergeText},
      ];
      userFacingPromptSummary = `(Mesclando 2 imagens) ${userFacingPromptSummary}`;
    } else if (uploadedImage) {
      // Edit a single uploaded image
      const preserveFaceInstruction = "Ao editar, preserve as características faciais originais da pessoa na imagem o máximo possível. Evite alterar o rosto.";
      const editText = `Edite a imagem fornecida. ${textInstruction} ${preserveFaceInstruction}`;
      modelPrompt = [
        {media: {url: uploadedImage}},
        {text: editText},
      ];
      userFacingPromptSummary = `(Editando imagem) ${userFacingPromptSummary}`;
    } else {
      // Generate a new image
      const generateText = `Gere uma imagem. ${textInstruction}`;
      modelPrompt = generateText;
      userFacingPromptSummary = `(Gerando nova imagem) ${userFacingPromptSummary}`;
    }

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: modelPrompt,
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


    