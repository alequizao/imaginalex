
'use server';
/**
 * @fileOverview Flow to enhance a user's text prompt using AI.
 *
 * - enhancePrompt - A function that takes an original prompt and returns an enhanced one.
 * - EnhancePromptInput - The input type for the enhancePrompt function.
 * - EnhancePromptOutput - The return type for the enhancePrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhancePromptInputSchema = z.object({
  originalPrompt: z.string().describe('The original text prompt provided by the user.'),
});
export type EnhancePromptInput = z.infer<typeof EnhancePromptInputSchema>;

const EnhancePromptOutputSchema = z.object({
  enhancedPrompt: z.string().describe('The AI-enhanced prompt, ready for image generation.'),
});
export type EnhancePromptOutput = z.infer<typeof EnhancePromptOutputSchema>;

// This is the function that detail-prompt.ts will call
export async function enhancePrompt(input: EnhancePromptInput): Promise<EnhancePromptOutput> {
  return enhancePromptFlow(input);
}

const promptEnhancementGenkitPrompt = ai.definePrompt({
  name: 'promptEnhancementPrompt',
  input: {schema: EnhancePromptInputSchema},
  output: {schema: EnhancePromptOutputSchema},
  prompt: `You are an AI assistant that refines and enhances text prompts for image generation.
Your goal is to take a user's original prompt and make it more detailed, vivid, and effective for an AI image generator, while preserving the core intent.
Make the prompt more descriptive and add details that would typically result in a better image.
If the prompt mentions specific styles like "cyberpunk", "photorealistic", "cartoon", "fantasy art", etc., ensure those are emphasized and expanded upon.
If the prompt is vague, add concrete details. For example, if user says "a cat", you could enhance it to "a fluffy ginger tabby cat curled up on a sunlit windowsill, detailed fur, soft lighting".
If the prompt mentions people, add details about their appearance or clothing if appropriate, unless asked not to.
Focus on visual elements.

Original Prompt:
{{{originalPrompt}}}

Enhanced Prompt (Provide only the enhanced prompt text directly):`,
});


const enhancePromptFlow = ai.defineFlow(
  {
    name: 'enhancePromptFlow',
    inputSchema: EnhancePromptInputSchema,
    outputSchema: EnhancePromptOutputSchema,
  },
  async (input) => {
    const {output} = await promptEnhancementGenkitPrompt(input);
    if (!output) {
        // Fallback to original prompt if enhancement fails
        console.warn("Prompt enhancement failed, using original prompt.");
        return { enhancedPrompt: input.originalPrompt };
    }
    return output;
  }
);
