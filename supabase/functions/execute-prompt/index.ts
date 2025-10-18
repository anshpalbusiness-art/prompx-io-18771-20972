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
    const { prompt, model = "google/gemini-2.5-flash", systemPrompt, temperature = 0.7, maxTokens = 2000 } = await req.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const callAnthropic = async (content: string) => {
      if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not configured');
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: maxTokens,
          temperature,
          messages: [{ role: 'user', content }],
        }),
      });
      if (!response.ok) {
        const t = await response.text();
        throw new Error(`Anthropic error ${response.status}: ${t}`);
      }
      const data = await response.json();
      return data?.content?.[0]?.text as string | undefined;
    };

    const callLovable = async (messages: any[]) => {
      if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: false,
        }),
      });
      if (!response.ok) {
        const t = await response.text();
        return { ok: false as const, status: response.status, text: t };
      }
      const data = await response.json();
      const result: string | undefined = data?.choices?.[0]?.message?.content;
      return { ok: true as const, result };
    };

    // Build messages
    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
    if (systemPrompt && typeof systemPrompt === 'string' && systemPrompt.trim().length > 0) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    let result: string | undefined;

    // Route based on model prefix; fallback to Anthropic on credit errors
    if (model.startsWith('google/') || model.startsWith('openai/')) {
      console.log(`Executing via Lovable AI Gateway (model: ${model})`);
      const lovableResp = await callLovable(messages);
      if (lovableResp.ok && lovableResp.result) {
        result = lovableResp.result;
      } else {
        // If credits (402) or rate limits (429) fail, fallback to Anthropic
        if (lovableResp.status === 402 || lovableResp.status === 429 || lovableResp.status === 400) {
          console.warn(`Lovable gateway returned ${lovableResp.status}. Falling back to Anthropic.`);
          const content = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
          result = await callAnthropic(content);
        } else {
          return new Response(
            JSON.stringify({ error: `AI gateway error (${lovableResp.status})`, details: lovableResp.text }),
            { status: lovableResp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    } else {
      // Default to Anthropic for claude/* or unknown models
      console.log(`Executing via Anthropic (model: claude-sonnet-4-5)`);
      const content = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
      result = await callAnthropic(content);
    }

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'No result from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in execute-prompt function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
