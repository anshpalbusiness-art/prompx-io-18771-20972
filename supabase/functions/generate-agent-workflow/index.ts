import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { naturalLanguageInput } = await req.json();
    console.log('Generating agent workflow for input:', naturalLanguageInput);

    if (!naturalLanguageInput || naturalLanguageInput.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Natural language input is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GOOGLE_AI_KEY = Deno.env.get('GOOGLE_AI_STUDIO_API_KEY');
    if (!GOOGLE_AI_KEY) {
      throw new Error('GOOGLE_AI_STUDIO_API_KEY is not configured');
    }

    const systemPrompt = `You are an intelligent workflow architect. Your job is to analyze natural language business goals and create a multi-agent workflow with dependencies.

Given a user's goal, you must:
1. Identify what specialized agents are needed
2. Define the purpose and capabilities of each agent
3. Establish dependencies between agents (which agents need outputs from which other agents)
4. Create specific, actionable prompts for each agent

CRITICAL: You must respond with a valid JSON object following this exact structure:
{
  "workflowName": "string - descriptive name for the workflow",
  "workflowDescription": "string - brief description of what this workflow accomplishes",
  "agents": [
    {
      "id": "string - unique identifier",
      "name": "string - agent role name",
      "category": "string - one of: research, content, marketing, analytics, development",
      "description": "string - what this agent does",
      "systemPrompt": "string - the agent's specialized instructions",
      "prompt": "string - the specific task prompt (use {{input}} for user input, {{agent_id}} for other agent outputs)",
      "dependsOn": ["string array - IDs of agents this agent depends on"],
      "capabilities": ["string array - what this agent can do"],
      "model": "grok-beta",
      "temperature": 0.7
    }
  ]
}

Respond ONLY with valid JSON. No markdown, no code blocks, no explanations.`;

    console.log('Calling Gemini to generate workflow structure...');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GOOGLE_AI_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\n${naturalLanguageInput}`
          }]
        }],
        generationConfig: {
          temperature: 0.2
        }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Insufficient credits. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    // Parse structured output
    let workflowStructure: any;
    try {
      console.log('AI response (content):', content);
      let cleanContent = (content || '').replace(/```json\s*/g, '').replace(/```/g, '').trim();
      try {
        workflowStructure = JSON.parse(cleanContent);
      } catch {
        // Attempt to extract the first JSON object
        const first = cleanContent.indexOf('{');
        const last = cleanContent.lastIndexOf('}');
        if (first !== -1 && last !== -1 && last > first) {
          const jsonSlice = cleanContent.slice(first, last + 1);
          workflowStructure = JSON.parse(jsonSlice);
        } else {
          throw new Error('No JSON object found in model output');
        }
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError, 'Raw:', JSON.stringify(content));
      throw new Error('Failed to parse workflow structure from AI response');
    }

    console.log('Generated workflow structure:', workflowStructure);

    return new Response(
      JSON.stringify({ workflow: workflowStructure }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-agent-workflow:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
