import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = authSchema.parse({ email, password, username });
      
      const { error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username: validated.username,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "Account exists",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Success!",
          description: "Your account has been created. You can now sign in.",
        });
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "An error occurred during sign up",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = authSchema.omit({ username: true }).parse({ email, password });

      const { error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Invalid credentials",
            description: "Please check your email and password and try again.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "An error occurred during sign in",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center p-4 sm:p-6">
      {/* Animated PromptX background text with gradient effect - Enhanced for Mobile */}
      <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
        <div 
          className="text-[clamp(5rem,20vw,24vw)] sm:text-[clamp(8rem,20vw,26vw)] font-extrabold whitespace-nowrap tracking-tighter"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.12) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.05em'
          }}
        >
          PrompX
        </div>
      </div>

      {/* Enhanced animated gradient orbs with glow */}
      <div className="absolute top-0 -left-48 -z-10 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse-subtle pointer-events-none" />
      <div className="absolute bottom-0 -right-48 -z-10 w-96 h-96 bg-gradient-to-tl from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse-subtle pointer-events-none" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl animate-pulse-subtle pointer-events-none" style={{ animationDelay: '0.5s' }} />
      
      {/* Enhanced grid pattern with shimmer effect */}
      <div 
        className="absolute inset-0 -z-20 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }}
      />

      {/* Premium card with enhanced glassmorphism */}
      <Card className="w-full max-w-md relative z-20 border border-white/10 bg-zinc-900/90 backdrop-blur-3xl shadow-elegant animate-scale-in overflow-hidden group">
        {/* Animated gradient border effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
        
        {/* Subtle top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        
        <CardHeader className="space-y-3 sm:space-y-4 pb-8 px-6 sm:px-8 pt-10 relative z-10">
          <div className="space-y-3">
            <CardTitle className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
              Welcome to <span className="bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">PrompX</span>
            </CardTitle>
            <CardDescription className="text-zinc-400 text-base leading-relaxed font-light">
              Sign in to continue your journey
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pb-10">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-zinc-950/90 border border-white/10 p-1.5 h-12 rounded-xl mb-8 shadow-lg">
              <TabsTrigger 
                value="signin"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-white data-[state=active]:to-zinc-100 data-[state=active]:text-zinc-900 data-[state=active]:shadow-lg text-zinc-400 hover:text-zinc-100 transition-all duration-300 text-sm font-semibold rounded-lg"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-white data-[state=active]:to-zinc-100 data-[state=active]:text-zinc-900 data-[state=active]:shadow-lg text-zinc-400 hover:text-zinc-100 transition-all duration-300 text-sm font-semibold rounded-lg"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="mt-0 space-y-6">
              <form onSubmit={handleSignIn} className="space-y-6">
                <div className="space-y-2.5">
                  <Label htmlFor="signin-email" className="text-zinc-100 text-sm font-semibold">
                    Email
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-zinc-950/60 border-white/10 text-white placeholder:text-zinc-500 focus:border-white/40 focus:ring-2 focus:ring-white/20 h-13 text-base transition-all duration-300 hover:border-white/20 hover:bg-zinc-950/80 rounded-lg"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="signin-password" className="text-zinc-100 text-sm font-semibold">
                    Password
                  </Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-zinc-950/60 border-white/10 text-white placeholder:text-zinc-500 focus:border-white/40 focus:ring-2 focus:ring-white/20 h-13 text-base transition-all duration-300 hover:border-white/20 hover:bg-zinc-950/80 rounded-lg"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-13 bg-gradient-to-r from-white to-zinc-100 text-zinc-900 hover:from-zinc-50 hover:to-white font-bold transition-all duration-300 hover:shadow-2xl hover:shadow-white/30 text-base mt-8 rounded-lg hover:scale-[1.02] active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="mt-0 space-y-6">
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2.5">
                  <Label htmlFor="signup-username" className="text-zinc-100 text-sm font-semibold">
                    Username
                  </Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="bg-zinc-950/60 border-white/10 text-white placeholder:text-zinc-500 focus:border-white/40 focus:ring-2 focus:ring-white/20 h-13 text-base transition-all duration-300 hover:border-white/20 hover:bg-zinc-950/80 rounded-lg"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="signup-email" className="text-zinc-100 text-sm font-semibold">
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-zinc-950/60 border-white/10 text-white placeholder:text-zinc-500 focus:border-white/40 focus:ring-2 focus:ring-white/20 h-13 text-base transition-all duration-300 hover:border-white/20 hover:bg-zinc-950/80 rounded-lg"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="signup-password" className="text-zinc-100 text-sm font-semibold">
                    Password
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password (min. 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-zinc-950/60 border-white/10 text-white placeholder:text-zinc-500 focus:border-white/40 focus:ring-2 focus:ring-white/20 h-13 text-base transition-all duration-300 hover:border-white/20 hover:bg-zinc-950/80 rounded-lg"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-13 bg-gradient-to-r from-white to-zinc-100 text-zinc-900 hover:from-zinc-50 hover:to-white font-bold transition-all duration-300 hover:shadow-2xl hover:shadow-white/30 text-base mt-8 rounded-lg hover:scale-[1.02] active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
