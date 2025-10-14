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
    const { prompt, model = "gpt-5-mini-2025-08-07", systemPrompt, temperature = 0.7, maxTokens = 2000 } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map incoming model IDs to valid OpenAI models when needed (e.g., Gemini -> GPT-5 equivalents)
    const mapModel = (m: string) => {
      switch (m) {
        case 'google/gemini-2.5-flash':
          return 'gpt-5-mini-2025-08-07';
        case 'google/gemini-2.5-pro':
          return 'gpt-5-2025-08-07';
        case 'google/gemini-2.5-flash-lite':
          return 'gpt-5-nano-2025-08-07';
        default:
          return m;
      }
    };
    const resolvedModel = mapModel(model);
    console.log('Executing prompt with OpenAI model:', model, '-> resolved:', resolvedModel);

    const messages = systemPrompt
      ? [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      : [{ role: 'user', content: prompt }];

    // Build payload according to model family (GPT-5 uses max_completion_tokens and ignores temperature)
    const payload: any = {
      model: resolvedModel,
      messages,
    };
    if (resolvedModel.startsWith('gpt-5')) {
      payload.max_completion_tokens = maxTokens;
      // Do not include temperature for GPT-5 models
    } else {
      payload.max_tokens = maxTokens;
      payload.temperature = temperature;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Credits exhausted. Please add more credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to execute prompt' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'No result from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in execute-prompt function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
