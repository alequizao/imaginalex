
'use server';

/**
 * @fileOverview Generates images from prompts or edits existing images using prompts.
 *
 * - generateImageWithDetailPrompts - A function that generates a new image or edits an uploaded image based on text prompts.
 * - DetailPromptInput - The input type (includes optional uploaded image data URI).
 * - DetailPromptOutput - The return type for the generateImageWithDetailPrompts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetailPromptInputSchema = z.object({
  primaryPrompt: z.string().describe('The primary prompt for image generation or editing.'),
  detailPrompts: z.array(z.string()).describe('An array of detail prompts to enhance the primary prompt.'),
  uploadedImage: z.string().optional().describe(
    "Optional. A previously uploaded image to be edited, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type DetailPromptInput = z.infer<typeof DetailPromptInputSchema>;

const DetailPromptOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
  prompt: z.string().describe('The prompt used to generate or edit the image.'),
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
  async input => {
    const {
      primaryPrompt,
      detailPrompts,
      uploadedImage,
    } = input;

    let textInstruction = `Prompt primário: "${primaryPrompt}".`;
    if (detailPrompts.length > 0) {
      textInstruction += ` Detalhes adicionais: ${detailPrompts.join(", ")}.`;
    }

    let modelPrompt: any;
    let userFacingPromptSummary = textInstruction;

    if (uploadedImage) {
      const editText = `Edite a imagem fornecida. ${textInstruction}`;
      modelPrompt = [
        {media: {url: uploadedImage}},
        {text: editText},
      ];
      userFacingPromptSummary = `(Editando imagem) ${textInstruction}`;
    } else {
      const generateText = `Gere uma imagem. ${textInstruction}`;
      modelPrompt = generateText;
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
      prompt: userFacingPromptSummary,
    };
  }
);
