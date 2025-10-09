-- Fix variation types constraint first
ALTER TABLE prompt_variations DROP CONSTRAINT IF EXISTS prompt_variations_variation_type_check;

-- Create prompt knowledge graph tables (simplified without vector embeddings)
CREATE TABLE IF NOT EXISTS prompt_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  prompt_text TEXT NOT NULL,
  prompt_type TEXT NOT NULL, -- 'original', 'optimized', 'variation'
  category TEXT,
  platform TEXT,
  keywords TEXT[], -- For semantic search
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Relationships between prompts
CREATE TABLE IF NOT EXISTS prompt_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_prompt_id UUID NOT NULL REFERENCES prompt_nodes(id) ON DELETE CASCADE,
  target_prompt_id UUID NOT NULL REFERENCES prompt_nodes(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL, -- 'derived_from', 'similar_to', 'inspired_by', 'prerequisite_for', 'alternative_to'
  strength NUMERIC DEFAULT 1.0, -- 0.0 to 1.0
  ai_confidence NUMERIC DEFAULT 1.0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(source_prompt_id, target_prompt_id, relationship_type)
);

-- Topic/concept nodes for semantic clustering
CREATE TABLE IF NOT EXISTS prompt_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  topic_name TEXT NOT NULL,
  description TEXT,
  parent_topic_id UUID REFERENCES prompt_topics(id) ON DELETE CASCADE,
  prompt_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, topic_name)
);

-- Junction table for many-to-many prompt-topic relationship
CREATE TABLE IF NOT EXISTS prompt_topic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompt_nodes(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES prompt_topics(id) ON DELETE CASCADE,
  relevance_score NUMERIC DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(prompt_id, topic_id)
);

-- Network insights and analytics
CREATE TABLE IF NOT EXISTS prompt_network_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  insight_type TEXT NOT NULL, -- 'cluster', 'trend', 'pattern', 'opportunity'
  title TEXT NOT NULL,
  description TEXT,
  affected_prompts UUID[],
  affected_topics UUID[],
  confidence_score NUMERIC DEFAULT 0.5,
  actionable_suggestion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE prompt_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_topic_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_network_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prompt_nodes
CREATE POLICY "Users can view their own prompt nodes"
  ON prompt_nodes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prompt nodes"
  ON prompt_nodes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompt nodes"
  ON prompt_nodes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompt nodes"
  ON prompt_nodes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for prompt_relationships
CREATE POLICY "Users can view relationships for their prompts"
  ON prompt_relationships FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM prompt_nodes 
    WHERE id = source_prompt_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create relationships for their prompts"
  ON prompt_relationships FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM prompt_nodes 
    WHERE id = source_prompt_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete relationships for their prompts"
  ON prompt_relationships FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM prompt_nodes 
    WHERE id = source_prompt_id AND user_id = auth.uid()
  ));

-- RLS Policies for prompt_topics
CREATE POLICY "Users can view their own topics"
  ON prompt_topics FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can create their own topics"
  ON prompt_topics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own topics"
  ON prompt_topics FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for prompt_topic_links
CREATE POLICY "Users can view links for their prompts"
  ON prompt_topic_links FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM prompt_nodes 
    WHERE id = prompt_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create links for their prompts"
  ON prompt_topic_links FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM prompt_nodes 
    WHERE id = prompt_id AND user_id = auth.uid()
  ));

-- RLS Policies for insights
CREATE POLICY "Users can view their own insights"
  ON prompt_network_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own insights"
  ON prompt_network_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_prompt_nodes_user_id ON prompt_nodes(user_id);
CREATE INDEX idx_prompt_nodes_category ON prompt_nodes(category);
CREATE INDEX idx_prompt_nodes_created_at ON prompt_nodes(created_at DESC);
CREATE INDEX idx_prompt_nodes_keywords ON prompt_nodes USING GIN(keywords);
CREATE INDEX idx_prompt_relationships_source ON prompt_relationships(source_prompt_id);
CREATE INDEX idx_prompt_relationships_target ON prompt_relationships(target_prompt_id);
CREATE INDEX idx_prompt_relationships_type ON prompt_relationships(relationship_type);
CREATE INDEX idx_prompt_topics_user_id ON prompt_topics(user_id);
CREATE INDEX idx_prompt_topic_links_prompt ON prompt_topic_links(prompt_id);
CREATE INDEX idx_prompt_topic_links_topic ON prompt_topic_links(topic_id);

-- Trigger for updated_at
CREATE TRIGGER update_prompt_nodes_updated_at
  BEFORE UPDATE ON prompt_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();