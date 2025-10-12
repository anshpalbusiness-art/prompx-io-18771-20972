import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyticsRequest {
  userId: string;
  analysisType: 'performance' | 'prediction' | 'optimization' | 'insights';
  dataPoints?: any[];
  context?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { userId, analysisType, dataPoints, context }: AnalyticsRequest = await req.json();

    console.log(`AI Analytics Engine: Processing ${analysisType} for user ${userId}`);

    // Fetch historical data for intelligent analysis
    const { data: historicalData, error: historyError } = await supabase
      .from('prompt_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (historyError) throw historyError;

    // Fetch performance metrics
    const { data: performanceData, error: perfError } = await supabase
      .from('analytics_metrics')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(50);

    if (perfError) throw perfError;

    // Build intelligent analysis prompt
    let systemPrompt = '';
    let userPrompt = '';

    switch (analysisType) {
      case 'performance':
        systemPrompt = `You are an expert AI analytics system specializing in prompt engineering performance analysis. 
        Analyze patterns, identify strengths and weaknesses, and provide actionable insights with statistical backing.
        Focus on: conversion rates, engagement metrics, success patterns, and optimization opportunities.`;
        
        userPrompt = `Analyze this prompt engineering performance data:
        
Historical Prompts: ${JSON.stringify(historicalData?.slice(0, 20))}
Performance Metrics: ${JSON.stringify(performanceData)}
Context: ${JSON.stringify(context)}

Provide:
1. Key performance insights (with specific metrics)
2. Pattern analysis (what's working vs what's not)
3. Optimization recommendations (prioritized by impact)
4. Predicted improvements if recommendations are followed
5. Risk factors or concerns

Format as JSON with sections: insights, patterns, recommendations, predictions, risks`;
        break;

      case 'prediction':
        systemPrompt = `You are a predictive AI analytics expert. Use historical data to forecast future performance,
        identify trends, and predict outcomes. Provide confidence scores and reasoning for all predictions.`;
        
        userPrompt = `Based on this historical data, predict future performance:
        
Historical Data: ${JSON.stringify(historicalData)}
Recent Metrics: ${JSON.stringify(performanceData)}
Context: ${JSON.stringify(context)}

Predict:
1. Expected performance in next 7, 30, 90 days
2. Trend direction (improving/declining/stable) with confidence score
3. Potential bottlenecks or opportunities
4. Recommended actions to improve trajectory
5. Risk-adjusted performance ranges (best/likely/worst case)

Format as JSON with: predictions, trends, opportunities, actions, ranges`;
        break;

      case 'optimization':
        systemPrompt = `You are an AI optimization specialist. Analyze data to find specific, actionable optimizations
        that will improve performance. Prioritize by impact and feasibility. Provide concrete implementation steps.`;
        
        userPrompt = `Analyze this data and provide optimization recommendations:
        
Current Performance: ${JSON.stringify(performanceData)}
Historical Patterns: ${JSON.stringify(historicalData?.slice(0, 30))}
Context: ${JSON.stringify(context)}
Data Points: ${JSON.stringify(dataPoints)}

Provide:
1. Top 5 optimization opportunities (ranked by impact)
2. Specific implementation steps for each
3. Expected impact (quantified)
4. Effort required (low/medium/high)
5. Quick wins (high impact, low effort)
6. Long-term optimizations

Format as JSON with: optimizations (array), quickWins (array), longTerm (array)`;
        break;

      case 'insights':
        systemPrompt = `You are an intelligent insights generator. Extract meaningful, actionable insights from data.
        Focus on discoveries that users wouldn't easily notice themselves. Provide context and explanation.`;
        
        userPrompt = `Generate intelligent insights from this data:
        
Performance Data: ${JSON.stringify(performanceData)}
Historical Data: ${JSON.stringify(historicalData)}
Context: ${JSON.stringify(context)}

Generate:
1. Hidden patterns or correlations (that aren't obvious)
2. Anomalies or unusual behaviors worth investigating
3. Comparative insights (how user compares to best practices)
4. Actionable discoveries with business impact
5. Future-focused insights (emerging trends)

Format as JSON with: patterns, anomalies, comparisons, discoveries, trends`;
        break;
    }

    // Call AI for intelligent analysis
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysis = JSON.parse(aiData.choices[0].message.content);

    // Store insights for future learning
    const { error: insertError } = await supabase
      .from('ai_insights')
      .insert({
        user_id: userId,
        insight_type: analysisType,
        analysis_data: analysis,
        context: context,
        created_at: new Date().toISOString()
      });

    if (insertError) console.error('Error storing insights:', insertError);

    console.log(`Analysis complete for ${analysisType}`);

    return new Response(JSON.stringify({
      success: true,
      analysisType,
      analysis,
      dataPointsAnalyzed: (historicalData?.length || 0) + (performanceData?.length || 0),
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI Analytics Engine Error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      details: 'AI analytics processing failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
