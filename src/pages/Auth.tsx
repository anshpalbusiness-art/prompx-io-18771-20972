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
    <div className="min-h-screen relative overflow-hidden bg-black flex items-center justify-center p-4 sm:p-6">
      {/* Large background PrompX text */}
      <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
        <div 
          className="text-[32vw] font-bold text-zinc-800/50"
          style={{
            letterSpacing: '-0.05em',
            lineHeight: '1'
          }}
        >
          PrompX
        </div>
      </div>

      {/* Auth Card */}
      <Card className="w-full max-w-md relative z-20 border border-zinc-800 bg-zinc-950 shadow-2xl rounded-lg">
        <CardHeader className="space-y-2 pb-6 px-8 pt-10">
          <CardTitle className="text-3xl font-bold text-white leading-tight">
            Welcome to<br />PrompX
          </CardTitle>
          <CardDescription className="text-zinc-500 text-sm">
            Sign in to continue your journey
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 h-auto mb-6 gap-2">
              <TabsTrigger 
                value="signin"
                className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=inactive]:bg-transparent text-zinc-500 transition-all duration-200 rounded-lg py-2.5 font-medium text-sm"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=inactive]:bg-transparent text-zinc-500 transition-all duration-200 rounded-lg py-2.5 font-medium text-sm"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="mt-0 space-y-5">
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-white text-sm font-normal">
                    Email
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 h-12 rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-white text-sm font-normal">
                    Password
                  </Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 h-12 rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-zinc-700"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-white text-black hover:bg-zinc-100 font-medium mt-2 rounded-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="mt-0 space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username" className="text-white text-sm font-normal">
                    Username
                  </Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 h-12 rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-white text-sm font-normal">
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 h-12 rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-white text-sm font-normal">
                    Password
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password (min. 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 h-12 rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-zinc-700"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-white text-black hover:bg-zinc-100 font-medium mt-2 rounded-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
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
