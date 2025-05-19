'use server';

/**
 * @fileOverview Combines a primary prompt with detail prompts to generate images.
 *
 * - generateImageWithDetailPrompts - A function that combines prompts and generates an image.
 * - DetailPromptInput - The input type for the generateImageWithDetailPrompts function.
 * - DetailPromptOutput - The return type for the generateImageWithDetailPrompts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetailPromptInputSchema = z.object({
  primaryPrompt: z.string().describe('The primary prompt for image generation.'),
  detailPrompts: z.array(z.string()).describe('An array of detail prompts to enhance the primary prompt.'),
});
export type DetailPromptInput = z.infer<typeof DetailPromptInputSchema>;

const DetailPromptOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
  prompt: z.string().describe('The prompt used to generate the image (primary prompt + detail prompts).'),
});
export type DetailPromptOutput = z.infer<typeof DetailPromptOutputSchema>;

export async function generateImageWithDetailPrompts(input: DetailPromptInput): Promise<DetailPromptOutput> {
  return detailPromptFlow(input);
}

const detailPrompt = ai.definePrompt({
  name: 'detailPrompt',
  input: {
    schema: DetailPromptInputSchema,
  },
  output: {
    schema: DetailPromptOutputSchema,
  },
  prompt: `Generate an image based on the following primary prompt: {{{primaryPrompt}}}.\nInclude the following details in the image: {{#each detailPrompts}}{{{this}}} {{/each}}`,
});

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
    } = input;

    const promptText = `Generate an image based on the following primary prompt: ${primaryPrompt}. Include the following details in the image: ${detailPrompts.join( ", ")}`

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: promptText,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    return {
      imageUrl: media.url,
      prompt: promptText
    };
  }
);
