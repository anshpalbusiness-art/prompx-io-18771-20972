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

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
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
      "model": "google/gemini-2.5-flash",
      "temperature": 0.7
    }
  ]
}

Example for "I want to launch a new AI course":
{
  "workflowName": "AI Course Launch Campaign",
  "workflowDescription": "Complete workflow to research, create content, and market a new AI course",
  "agents": [
    {
      "id": "research_agent",
      "name": "Market Research Agent",
      "category": "research",
      "description": "Analyzes market trends and competition",
      "systemPrompt": "You are a market research expert specializing in online education and AI courses. Provide data-driven insights about market opportunities, competition, and target audience.",
      "prompt": "Research the market for {{input}}. Analyze: 1) Current trends in AI education 2) Competitor courses and pricing 3) Target audience pain points 4) Market gaps and opportunities",
      "dependsOn": [],
      "capabilities": ["web_research", "competitive_analysis", "trend_identification"],
      "model": "google/gemini-2.5-flash",
      "temperature": 0.5
    },
    {
      "id": "copywriting_agent",
      "name": "Sales Copy Agent",
      "category": "content",
      "description": "Creates compelling sales page copy",
      "systemPrompt": "You are a conversion copywriter specializing in online course sales pages. Write persuasive, benefit-driven copy that converts visitors into students.",
      "prompt": "Based on this market research: {{research_agent}}, create a compelling sales page for {{input}}. Include: 1) Attention-grabbing headline 2) Key benefits and outcomes 3) Course curriculum overview 4) Social proof elements 5) Strong call-to-action",
      "dependsOn": ["research_agent"],
      "capabilities": ["copywriting", "conversion_optimization", "storytelling"],
      "model": "google/gemini-2.5-flash",
      "temperature": 0.8
    },
    {
      "id": "social_agent",
      "name": "Social Media Agent",
      "category": "marketing",
      "description": "Creates social media promotion strategy",
      "systemPrompt": "You are a social media marketing expert for educational content. Create engaging posts that drive traffic and enrollments.",
      "prompt": "Using the course details from {{copywriting_agent}} and market insights from {{research_agent}}, create a 30-day social media campaign for {{input}}. Include: 1) Platform-specific posts (LinkedIn, Twitter, Instagram) 2) Content calendar 3) Hashtag strategy 4) Engagement tactics",
      "dependsOn": ["research_agent", "copywriting_agent"],
      "capabilities": ["social_media_marketing", "content_planning", "community_building"],
      "model": "google/gemini-2.5-flash",
      "temperature": 0.7
    },
    {
      "id": "ad_agent",
      "name": "Paid Ads Agent",
      "category": "marketing",
      "description": "Creates paid advertising campaigns",
      "systemPrompt": "You are a performance marketing expert specializing in course launches. Create data-driven ad campaigns for maximum ROI.",
      "prompt": "Based on {{research_agent}} insights and {{copywriting_agent}} messaging, create paid ad campaigns for {{input}}. Include: 1) Google Ads (search & display) 2) Facebook/Instagram ads 3) LinkedIn ads 4) Ad copy variations 5) Targeting parameters 6) Budget recommendations",
      "dependsOn": ["research_agent", "copywriting_agent"],
      "capabilities": ["paid_advertising", "audience_targeting", "roi_optimization"],
      "model": "google/gemini-2.5-flash",
      "temperature": 0.6
    }
  ]
}

Respond ONLY with valid JSON. No markdown, no code blocks, no explanations.`;

    console.log('Calling OpenAI to generate workflow structure...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: naturalLanguageInput }
        ],
        temperature: 0.2,
        tools: [
          {
            type: 'function',
            function: {
              name: 'build_workflow',
              description: 'Return a structured multi-agent workflow for the given goal',
              parameters: {
                type: 'object',
                properties: {
                  workflowName: { type: 'string' },
                  workflowDescription: { type: 'string' },
                  agents: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        category: { type: 'string' },
                        description: { type: 'string' },
                        systemPrompt: { type: 'string' },
                        prompt: { type: 'string' },
                        dependsOn: { type: 'array', items: { type: 'string' }, default: [] },
                        capabilities: { type: 'array', items: { type: 'string' }, default: [] },
                        model: { type: 'string', enum: ['gpt-4o','gpt-4o-mini','gpt-4-turbo','o1-preview','o1-mini'] },
                        temperature: { type: 'number' }
                      },
                      required: ['id','name','category','description','systemPrompt','prompt']
                    }
                  }
                },
                required: ['workflowName','workflowDescription','agents'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'build_workflow' } }
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
    const choice = data.choices?.[0];

    // Parse structured output from tool calls when available
    let workflowStructure: any;
    try {
      const toolCalls = choice?.message?.tool_calls;
      if (Array.isArray(toolCalls) && toolCalls.length > 0) {
        const fnCall = toolCalls.find((tc: any) => tc.type === 'function' && tc.function?.name === 'build_workflow') || toolCalls[0];
        const argsStr = fnCall?.function?.arguments ?? '';
        workflowStructure = JSON.parse(argsStr);
      } else {
        // Fallback: parse from plain content
        const content: string = choice?.message?.content ?? '';
        console.log('AI response (content):', content);
        let cleanContent = content.replace(/```json\s*/g, '').replace(/```/g, '').trim();
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
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError, 'Raw:', JSON.stringify(choice));
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
