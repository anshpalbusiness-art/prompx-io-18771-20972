import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId, userInput, conversationHistory = [], conversationId, userId, stream = false } = await req.json();
    console.log(`Enhanced Agent Execution v2.0 - Agent: ${agentId}`);

    if (!agentId || !userInput) {
      return new Response(
        JSON.stringify({ error: 'Agent ID and user input are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get agent configuration with enhanced logging
    const { data: agent, error: agentError } = await supabase
      .from('prompt_agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      console.error('Agent not found:', agentError?.message);
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Loaded agent: ${agent.name}, Model: ${agent.model || 'google/gemini-2.5-flash'}`);

    // Get Lovable API key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build enhanced message context with conversation history
    const messages = [
      { role: 'system', content: agent.system_prompt }
    ];
    
    // Add conversation history for context-aware responses
    if (conversationHistory && conversationHistory.length > 0) {
      console.log(`Adding ${conversationHistory.length} history messages for context`);
      messages.push(...conversationHistory);
    }
    
    // Add current user input
    messages.push({ role: 'user', content: userInput });

    const startTime = Date.now();

    // Call Lovable AI Gateway with streaming support
    const modelName = agent.model || 'google/gemini-2.5-flash';
    const isGPT5Model = modelName.includes('gpt-5') || modelName.includes('gpt-4.1');
    
    // Build request body based on model type
    const requestBody: any = {
      model: modelName,
      messages,
      stream: stream,
    };
    
    // GPT-5 and newer models use max_completion_tokens, older models use max_tokens
    if (isGPT5Model) {
      requestBody.max_completion_tokens = agent.max_tokens || 2000;
      // Note: GPT-5 models don't support temperature parameter
    } else {
      requestBody.max_tokens = agent.max_tokens || 2000;
      requestBody.temperature = agent.temperature || 0.7;
    }
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (response.status === 429) {
      console.warn('Rate limit exceeded');
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (response.status === 402) {
      console.warn('Insufficient credits');
      return new Response(
        JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      // Track failed analytics
      if (userId) {
        await supabase.from('agent_analytics').insert({
          agent_id: agentId,
          user_id: userId,
          conversation_id: conversationId,
          success: false,
          error_message: `HTTP ${response.status}: ${errorText}`,
          model_used: agent.model || 'google/gemini-2.5-flash',
        });
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle streaming response
    if (stream) {
      // Update usage count
      await supabase
        .from('prompt_agents')
        .update({ usage_count: agent.usage_count + 1 })
        .eq('id', agentId);

      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    // Handle non-streaming response
    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'No response generated';
    const responseTime = Date.now() - startTime;
    const tokensUsed = data.usage?.total_tokens || 0;
    
    console.log(`Response generated in ${responseTime}ms, ${tokensUsed} tokens, length: ${aiResponse.length} chars`);

    // Update usage count and track analytics
    await supabase
      .from('prompt_agents')
      .update({ usage_count: agent.usage_count + 1 })
      .eq('id', agentId);

    // Track successful analytics
    if (userId) {
      await supabase.from('agent_analytics').insert({
        agent_id: agentId,
        user_id: userId,
        conversation_id: conversationId,
        response_time_ms: responseTime,
        tokens_used: tokensUsed,
        model_used: agent.model || 'google/gemini-2.5-flash',
        success: true,
      });
    }

    // Save conversation if conversationId provided
    if (conversationId && userId) {
      const updatedMessages = [
        ...conversationHistory,
        { role: 'user', content: userInput },
        { role: 'assistant', content: aiResponse }
      ];
      
      await supabase
        .from('agent_conversations')
        .upsert({
          id: conversationId,
          user_id: userId,
          agent_id: agentId,
          messages: updatedMessages,
          title: userInput.substring(0, 100), // Use first message as title
        });
    }

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        responseTime,
        tokensUsed,
        model: agent.model || 'google/gemini-2.5-flash',
        conversationId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error executing agent:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});