import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Copy, Loader2, Sparkles, CheckCircle, Shield, AlertTriangle, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PersonaSelector } from "./PersonaSelector";

export const PromptInterface = () => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSanitizing, setIsSanitizing] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [personaPrefix, setPersonaPrefix] = useState("");
  const [safetyWarning, setSafetyWarning] = useState<{
    issues: string[];
    sanitizedPrompt: string;
  } | null>(null);
  const { toast } = useToast();

  const handlePersonaSelect = (personaId: string | null, prefix: string) => {
    setSelectedPersonaId(personaId);
    setPersonaPrefix(prefix);
  };

  const sanitizePrompt = async () => {
    setIsSanitizing(true);
    setSafetyWarning(null);

    try {
      const { data, error } = await supabase.functions.invoke("sanitize-prompt", {
        body: { prompt: prompt },
      });

      if (error) throw error;

      if (!data.isSafe && data.sanitizedPrompt) {
        setSafetyWarning({
          issues: data.issues || [],
          sanitizedPrompt: data.sanitizedPrompt,
        });
        toast({
          title: "Prompt Sanitized",
          description: "Your prompt has been rewritten to be safer",
        });
      } else if (!data.isSafe && !data.sanitizedPrompt) {
        toast({
          title: "Unsafe Prompt",
          description: "This prompt cannot be made safe and should not be used",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Prompt is Safe",
          description: "No issues detected with your prompt",
        });
      }
    } catch (error: any) {
      console.error("Error sanitizing:", error);
      toast({
        title: "Error",
        description: "Failed to check prompt safety",
        variant: "destructive",
      });
    } finally {
      setIsSanitizing(false);
    }
  };

  const useSanitizedPrompt = () => {
    if (safetyWarning?.sanitizedPrompt) {
      setPrompt(safetyWarning.sanitizedPrompt);
      setSafetyWarning(null);
      toast({
        title: "Prompt Updated",
        description: "Using the safer version of your prompt",
      });
    }
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResponse("");
    setSafetyWarning(null);

    try {
      // First sanitize the prompt automatically
      const { data: sanitizeData, error: sanitizeError } = await supabase.functions.invoke("sanitize-prompt", {
        body: { prompt: prompt },
      });

      // Check if we have a reframed response already
      if (!sanitizeError && sanitizeData && !sanitizeData.isSafe && sanitizeData.sanitizedPrompt) {
        // The sanitized prompt is actually a complete answer, use it directly
        setResponse(sanitizeData.sanitizedPrompt);
        toast({
          title: "Response Generated",
          description: "Provided a helpful, ethical response",
        });
        setIsLoading(false);
        return;
      }

      let promptToUse = prompt;

      // Enhance with persona if selected
      if (personaPrefix && selectedPersonaId) {
        promptToUse = `${personaPrefix}\n\n${prompt}`;
      }

      const { data, error } = await supabase.functions.invoke("execute-prompt", {
        body: { 
          prompt: promptToUse,
          model: "google/gemini-2.5-flash",
          systemPrompt: "You are a helpful AI assistant. Provide clear, concise, and accurate responses.",
          personaId: selectedPersonaId
        },
      });

      if (error) throw error;

      if (data?.response) {
        setResponse(data.response);
        toast({
          title: "Success!",
          description: "AI response generated",
        });
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!response) return;
    
    try {
      await navigator.clipboard.writeText(response);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Response copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-white/10 bg-zinc-900/60 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white text-xl sm:text-2xl">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
          Ask Lovable AI
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="prompt" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-800/50">
            <TabsTrigger value="prompt" className="data-[state=active]:bg-zinc-700">
              <Sparkles className="w-4 h-4 mr-2" />
              Prompt
            </TabsTrigger>
            <TabsTrigger value="persona" className="data-[state=active]:bg-zinc-700">
              <User className="w-4 h-4 mr-2" />
              AI Persona
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prompt" className="space-y-4 mt-4">
            {selectedPersonaId && (
              <Badge variant="secondary" className="mb-2">
                <User className="w-3 h-3 mr-1" />
                AI Persona Active
              </Badge>
            )}

            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Your Prompt</label>
              <Textarea
                placeholder="Enter your prompt here... (e.g., 'Write a professional email about...')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] bg-zinc-800/50 border-white/10 text-white placeholder:text-zinc-500 resize-none"
                disabled={isLoading || isSanitizing}
              />
            </div>

            {safetyWarning && (
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-zinc-300">
                  <div className="space-y-2">
                    <p className="font-semibold">Safety issues detected:</p>
                    <ul className="list-disc list-inside text-sm">
                      {safetyWarning.issues.map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={useSanitizedPrompt}
                      className="mt-2 bg-zinc-800 border-amber-500/50 text-white hover:bg-zinc-700"
                    >
                      Use Safer Version
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={sanitizePrompt}
                disabled={isLoading || isSanitizing || !prompt.trim()}
                variant="outline"
                className="flex-1 border-white/20 bg-zinc-800/50 text-white hover:bg-zinc-700"
              >
                {isSanitizing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Check Safety
                  </>
                )}
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={isLoading || isSanitizing || !prompt.trim()}
                className="flex-1 bg-gradient-to-r from-white to-zinc-100 text-zinc-900 hover:from-zinc-50 hover:to-white font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>

            {response && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-zinc-400">AI Response</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="text-zinc-400 hover:text-white"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-zinc-800/50 border border-white/10 rounded-lg p-4 text-white whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                  {response}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="persona" className="mt-4">
            <PersonaSelector
              selectedPersonaId={selectedPersonaId}
              onPersonaSelect={handlePersonaSelect}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
