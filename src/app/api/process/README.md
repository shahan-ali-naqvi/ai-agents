# Chain Process API

This API provides a simplified endpoint for processing text through your configured chains without exposing the chain details.

## Process Endpoint

### `POST /api/process/[id]`

Process a text input through a specified chain.

#### URL Parameters:
- `id`: The unique identifier of the chain to process the input through

#### Request Body:
```json
{
  "input": "Your text input to process"
}
```

#### Response:
```json
{
  "success": true,
  "finalResult": "The final processed output",
  "steps": [
    {
      "stepId": 1,
      "stepInstructions": "Instruction for step 1",
      "input": "Original input text",
      "result": "Output from step 1"
    },
    {
      "stepId": 2,
      "stepInstructions": "Instruction for step 2",
      "input": "Output from step 1",
      "result": "Output from step 2"
    }
  ],
  "stepResults": [
    "Output from step 1",
    "Output from step 2"
  ]
}
```

#### Error Response:
```json
{
  "error": "Error message",
  "partialResults": [] // Optional, may contain partial results if processing failed mid-chain
}
```

## Example Usage:

```javascript
// Example fetch request
const response = await fetch('/api/process/1234567890', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    input: 'This is a test input'
  })
});

const data = await response.json();

// Get just the final result
console.log(data.finalResult);

// Or get all step results
data.stepResults.forEach((result, index) => {
  console.log(`Step ${index + 1} result:`, result);
});

// Or get detailed step information
data.steps.forEach(step => {
  console.log(`Step ${step.stepId}:`);
  console.log(`Input: ${step.input}`);
  console.log(`Instructions: ${step.stepInstructions}`);
  console.log(`Result: ${step.result}`);
});
```

## Notes:
- The chain ID is the same ID you received when creating the chain
- This endpoint processes the input through all steps in the chain configuration
- **Results from all steps are now returned in sequence**
- **The API key used to create the chain is stored securely with the chain configuration**
- **No need to provide an API key with your requests - each chain uses its own saved key**
- **Multiple chains can use different API keys for different OpenAI accounts** 