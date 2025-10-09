import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Clock, Target, Users } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsDashboardProps {
  user: User;
}

interface MetricSummary {
  timeSaved: number;
  conversionRate: number;
  engagement: number;
  totalActivities: number;
}

export default function AnalyticsDashboard({ user }: AnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<MetricSummary>({
    timeSaved: 0,
    conversionRate: 0,
    engagement: 0,
    totalActivities: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      // Fetch metrics summary
      const { data: metricsData, error: metricsError } = await supabase
        .from("analytics_metrics")
        .select("*")
        .eq("user_id", user.id);

      if (metricsError) throw metricsError;

      // Calculate summaries
      const summary = metricsData.reduce(
        (acc, metric) => {
          if (metric.metric_type === "time_saved") {
            acc.timeSaved += Number(metric.metric_value);
          } else if (metric.metric_type === "conversion_rate") {
            acc.conversionRate += Number(metric.metric_value);
          } else if (metric.metric_type === "engagement") {
            acc.engagement += Number(metric.metric_value);
          }
          return acc;
        },
        { timeSaved: 0, conversionRate: 0, engagement: 0, totalActivities: metricsData.length }
      );

      setMetrics(summary);

      // Prepare chart data (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split("T")[0];
      });

      const chartMetrics = last7Days.map((date) => {
        const dayMetrics = metricsData.filter((m) =>
          m.recorded_at.startsWith(date)
        );
        return {
          date: date.slice(5),
          timeSaved: dayMetrics
            .filter((m) => m.metric_type === "time_saved")
            .reduce((sum, m) => sum + Number(m.metric_value), 0),
          engagement: dayMetrics
            .filter((m) => m.metric_type === "engagement")
            .reduce((sum, m) => sum + Number(m.metric_value), 0),
        };
      });

      setChartData(chartMetrics);

      // Fetch activity data
      const { data: activityResult, error: activityError } = await supabase
        .from("user_activity")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (activityError) throw activityError;

      // Group by activity type
      const activityGroups = activityResult.reduce((acc: any, activity) => {
        const type = activity.activity_type;
        if (!acc[type]) {
          acc[type] = { type, count: 0 };
        }
        acc[type].count += 1;
        return acc;
      }, {});

      setActivityData(Object.values(activityGroups));
    } catch (error: any) {
      toast({
        title: "Error fetching analytics",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}min`;
    return `${hours.toFixed(1)}h`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">ROI & Analytics Dashboard</h2>
        <p className="text-muted-foreground">Track your productivity impact and ROI metrics</p>
      </div>

      {/* Impact Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(metrics.timeSaved)}</div>
            <p className="text-xs text-muted-foreground">
              Total time saved using AI prompts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Conversion</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics.conversionRate / Math.max(metrics.totalActivities, 1)).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average conversion improvement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.engagement.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total engagement score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalActivities}</div>
            <p className="text-xs text-muted-foreground">
              Prompts and workflows executed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Time Saved Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Time Saved Trend</CardTitle>
          <CardDescription>Daily time saved over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="timeSaved"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="Time Saved (hours)"
              />
              <Line
                type="monotone"
                dataKey="engagement"
                stroke="hsl(var(--secondary))"
                strokeWidth={2}
                name="Engagement Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Activity Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Breakdown</CardTitle>
          <CardDescription>Your productivity by activity type</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ROI Summary */}
      <Card>
        <CardHeader>
          <CardTitle>ROI Summary</CardTitle>
          <CardDescription>Calculate your return on investment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Time Value (@ $50/hour)</p>
              <p className="text-2xl font-bold text-primary">
                ${(metrics.timeSaved * 50).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Est. Monthly ROI</p>
              <p className="text-2xl font-bold text-primary">
                ${(metrics.timeSaved * 50 * 4).toFixed(2)}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Based on average hourly rate of $50. Customize in settings to reflect your actual rate.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
