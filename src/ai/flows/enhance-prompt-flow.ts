/*
 * ImaginAlex · Desenvolvido por Alequizao <alequizao.dev@gmail.com>
 * https://github.com/alequizao · © 2026 Alequizao. Todos os direitos reservados.
 */

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
  prompt: `You are an expert AI assistant specializing in crafting highly detailed and effective prompts for cutting-edge image generation models.
Your primary goal is to take a user's original prompt and transform it into an advanced prompt that will yield images of the highest possible quality, resolution, and realism, while meticulously preserving the user's core intent.

Key Enhancement Strategies:
- **Realism Boost:** If the user's intent implies realism, inject terms like "photorealistic, hyperrealistic, ultra-detailed, 8K, sharp focus, intricate textures, professional photography, cinematic lighting."
- **Artistic Styles:** If the user mentions a specific style (e.g., "cyberpunk," "impressionistic," "cartoon," "fantasy art"), significantly expand on that style with characteristic elements, artists, color palettes, or techniques associated with it. For example, "Van Gogh style" could become "impressionistic painting in the style of Van Gogh, thick impasto brushstrokes, swirling colors, depiction of [subject]."
- **Vivid Descriptions:** For vague prompts (e.g., "a car"), add specific details: "a gleaming cherry red 1967 Shelby GT500, chrome accents, on a rain-slicked neon-lit Tokyo street at night, reflections on the wet pavement, dynamic angle shot."
- **Sensory Details:** Incorporate descriptions of textures (e.g., "rough tree bark," "smooth flowing silk," "polished metallic sheen"), lighting ("dramatic rim lighting," "soft golden hour light," "volumetric rays," "chiaroscuro"), and atmosphere ("misty forest morning," "sun-drenched beach," "dusty ancient ruins").
- **Camera & Lens Effects (if appropriate for realism):** Suggest camera settings like "shot on DSLR, 70mm prime lens, f/1.8 aperture, shallow depth of field, beautiful bokeh background, low-angle shot, rule of thirds composition."
- **Composition & Perspective:** Hint at strong compositional elements or specific perspectives (e.g., "worm's-eye view," "bird's-eye view," "leading lines," "symmetrical balance").
- **People Details:** If people are mentioned, add specifics about expression, highly detailed clothing, pose, activity, and context, ensuring these details contribute to the desired style and realism (unless asked not to). For example, "a woman smiling" could become "a joyful woman with laugh lines around her eyes, wearing a detailed embroidered linen dress, candidly captured in a sunlit meadow."
- **Maintain Core Intent:** Crucially, all enhancements must serve and amplify the user's original idea, not replace it. If the prompt is already very detailed and good, refine it subtly or confirm its strengths.

Original Prompt:
{{{originalPrompt}}}

Enhanced Prompt (Provide only the enhanced prompt text directly, make it rich, descriptive, and optimized for high-quality image generation):`,
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

