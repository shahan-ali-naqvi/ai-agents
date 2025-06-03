import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getChainById } from '@/lib/chainUtils';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get input from request body
    const body = await request.json();
    if (!body.input) {
      return NextResponse.json(
        { error: 'Input is required' },
        { status: 400 }
      );
    }
    
    console.log(`Processing chain with ID: ${id}`);
    
    // Get chain data using the utility function
    const chainData = await getChainById(id);
    
    if (!chainData) {
      console.log('Chain not found in memory or Firestore');
      return NextResponse.json(
        { error: 'Chain not found. Please check the chain ID.' },
        { status: 404 }
      );
    }
    
    // Check if the chain has an API key
    if (!chainData.openAiApiKey) {
      return NextResponse.json(
        { error: 'API key not found for this chain. The chain may be corrupted.' },
        { status: 400 }
      );
    }
    
    // Process input through chain steps
    const steps = chainData.chainData.steps;
    let currentInput = body.input;
    const stepResults = [];
    
    for (const step of steps) {
      try {
        // Enhanced system message that insists on showing calculations and verifying
        const enhancedInstructions = `
${step.instructions}

IMPORTANT CALCULATION RULES:
1. If this involves math, show complete step-by-step work
2. Calculate all operations fully - don't leave expressions unevaluated
3. For addition/subtraction/etc, show the actual result (e.g., "25 + 20 = 45" not just "25 + 20")
4. Double-check your calculations for accuracy
5. Always provide the final calculated value

Input: ${currentInput}
`;

        // Process through OpenAI using the chain's API key
        const result = await processStep(
          currentInput,
          enhancedInstructions,
          step.requiredOutput,
          chainData.openAiApiKey // Pass the stored API key
        );
        
        // Add this step's result to our results array
        stepResults.push({
          stepId: step.id,
          stepInstructions: step.instructions,
          input: currentInput,
          result: result
        });
        
        // Use this result as input for next step
        currentInput = result;
      } catch (error: any) {
        return NextResponse.json(
          { 
            error: `Error processing input: ${error.message}`,
            partialResults: stepResults
          },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({
      success: true,
      finalResult: currentInput,
      steps: stepResults,
      // Include a flat array of just results for easier consumption
      stepResults: stepResults.map(step => step.result)
    });
    
  } catch (error: any) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: `Failed to process request: ${error.message}` },
      { status: 500 }
    );
  }
}

// Process step through OpenAI
async function processStep(
  input: string,
  instructions: string,
  requiredOutput: string,
  apiKey: string // Add API key parameter
): Promise<string> {
  try {
    // Initialize OpenAI client with the chain's API key
    const openai = new OpenAI({
      apiKey: apiKey, // Use the provided API key instead of environment variable
    });

    // Create system message with instructions and required output format
    const systemMessage = `
      Instructions: ${instructions}
      
      Required output format: ${requiredOutput}
      
      Process the user input according to these instructions and return a result in the required format.
      
      VERIFICATION STEP: Before providing your final answer:
      1. Review your calculations and logic
      2. Check for arithmetic errors
      3. Make sure all operations have been fully computed
      4. Ensure the final result is clearly stated
    `;

    // Call OpenAI API with more temperature control for precise calculations
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: input }
      ],
      temperature: 0.2, // Lower temperature for more deterministic/precise outputs
      max_tokens: 1000,
    });

    // Return the generated text
    return response.choices[0]?.message?.content || 
      "Error: No response generated";
      
  } catch (error: any) {
    console.error("Error calling OpenAI API:", error);
    throw new Error(`OpenAI API error: ${error.message}`);
  }
} 