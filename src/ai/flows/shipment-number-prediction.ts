// 'use server';

/**
 * @fileOverview Predicts the shipment number based on the seller and product type.
 *
 * - predictShipmentNumber - A function that predicts the shipment number.
 * - PredictShipmentNumberInput - The input type for the predictShipmentNumber function.
 * - PredictShipmentNumberOutput - The return type for the predictShipmentNumber function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictShipmentNumberInputSchema = z.object({
  seller: z.string().describe('The seller of the product.'),
  productType: z.enum(['фб', 'фч', 'хч', 'хб', 'хс', 'шч', 'лб', 'лч', 'другое']).describe('The type of product.'),
});
export type PredictShipmentNumberInput = z.infer<typeof PredictShipmentNumberInputSchema>;

const PredictShipmentNumberOutputSchema = z.object({
  shipmentNumber: z.string().describe('The predicted shipment number.'),
});
export type PredictShipmentNumberOutput = z.infer<typeof PredictShipmentNumberOutputSchema>;

export async function predictShipmentNumber(input: PredictShipmentNumberInput): Promise<PredictShipmentNumberOutput> {
  return predictShipmentNumberFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictShipmentNumberPrompt',
  input: {schema: PredictShipmentNumberInputSchema},
  output: {schema: PredictShipmentNumberOutputSchema},
  prompt: `Based on the seller "{{seller}}" and product type "{{productType}}", predict the most likely shipment number. If there is no previous pattern, return "TBD".`,
});

const predictShipmentNumberFlow = ai.defineFlow(
  {
    name: 'predictShipmentNumberFlow',
    inputSchema: PredictShipmentNumberInputSchema,
    outputSchema: PredictShipmentNumberOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
