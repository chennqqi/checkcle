
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { UptimeData } from "@/types/service.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { useMemo } from "react";
import { format } from "date-fns";

interface ResponseTimeChartProps {
  uptimeData: UptimeData[];
}

export function ResponseTimeChart({ uptimeData }: ResponseTimeChartProps) {
  const { theme } = useTheme();
  
  // Format data for the chart with enhanced time formatting
  const chartData = useMemo(() => {
    if (!uptimeData || uptimeData.length === 0) return [];
    
    // Sort by timestamp ascending (oldest to newest)
    const sortedData = [...uptimeData].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Get time format based on data density
    const isShortTimeRange = uptimeData.length > 0 &&
      (new Date(uptimeData[0].timestamp).getTime() - new Date(uptimeData[uptimeData.length - 1].timestamp).getTime()) < 2 * 60 * 60 * 1000;
    
    return sortedData.map(data => {
      const timestamp = new Date(data.timestamp);
      
      return {
        time: isShortTimeRange 
          ? format(timestamp, 'HH:mm:ss') // Include seconds for short time ranges like 60min
          : format(timestamp, 'HH:mm'),
        rawTime: timestamp.getTime(),
        date: format(timestamp, 'MMM dd, yyyy'),
        value: data.status === "paused" ? null : data.responseTime,
        status: data.status,
        // Separate values for different statuses with proper positioning
        upValue: data.status === "up" ? data.responseTime : null,
        downValue: data.status === "down" ? data.responseTime : null,
        warningValue: data.status === "warning" ? data.responseTime : null,
      };
    });
  }, [uptimeData]);
  
  // Calculate Y-axis domain for better positioning
  const yAxisDomain = useMemo(() => {
    if (!chartData.length) return ['dataMin - 10', 'dataMax + 10'];
    
    const allValues = chartData
      .filter(d => d.value !== null && d.status !== 'paused')
      .map(d => d.value);
    
    if (allValues.length === 0) return [0, 100];
    
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const padding = (maxValue - minValue) * 0.1 || 10;
    
    return [Math.max(0, minValue - padding), maxValue + padding];
  }, [chartData]);
  
  // Create a custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      // Set background color based on status
      let statusColor = "bg-emerald-800";
      let statusText = "Up";
      
      if (data.status === "down") {
        statusColor = "bg-red-800";
        statusText = "Down";
      } else if (data.status === "warning") {
        statusColor = "bg-yellow-800";
        statusText = "Warning";
      } else if (data.status === "paused") {
        statusColor = "bg-gray-800";
        statusText = "Paused";
      }
      
      return (
        <div className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} p-2 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded shadow-md`}>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{data.date}</p>
          <div className={`flex items-center gap-2 mt-1 ${data.status === "paused" ? "opacity-70" : ""}`}>
            <div className={`w-3 h-3 rounded-full ${statusColor}`}></div>
            <span>{statusText}</span>
          </div>
          <p className="mt-1 font-mono text-sm">
            {data.status === "paused" ? "Monitoring paused" : 
             data.value !== null ? `${data.value} ms` : "No data"}
          </p>
        </div>
      );
    }
    return null;
  };

  // Check if we have any data to display - be more lenient by checking raw uptimeData
  const hasData = uptimeData.length > 0;
  
  // Get date range for display
  const dateRange = useMemo(() => {
    if (!chartData.length) return { start: "", end: "" };
    
    const sortedData = [...chartData].sort((a, b) => a.rawTime - b.rawTime);
    return {
      start: sortedData[0]?.date || "",
      end: sortedData[sortedData.length - 1]?.date || ""
    };
  }, [chartData]);
  
  // Display date range if different dates
  const dateRangeDisplay = dateRange.start === dateRange.end 
    ? dateRange.start 
    : `${dateRange.start} - ${dateRange.end}`;
  
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
          <span>Response Time History</span>
          {hasData && (
            <span className="text-sm font-normal text-muted-foreground">
              {dateRangeDisplay}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            <p>No data available for the selected time period.</p>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
                <defs>
                  <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                  </linearGradient>
                  <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2}/>
                  </linearGradient>
                  <linearGradient id="colorWarning" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333' : '#e5e7eb'} />
                <XAxis 
                  dataKey="time" 
                  stroke={theme === 'dark' ? '#666' : '#9ca3af'}
                  angle={-45}
                  textAnchor="end"
                  tick={{ fontSize: 10 }}
                  height={60}
                  interval="preserveStartEnd"
                  minTickGap={5}
                />
                <YAxis 
                  stroke={theme === 'dark' ? '#666' : '#9ca3af'} 
                  allowDecimals={false}
                  domain={yAxisDomain}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Separate area charts for each status - positioned closer together */}
                <Area 
                  type="monotone" 
                  dataKey="upValue"
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={0.4}
                  fill="url(#colorUp)" 
                  connectNulls={false}
                />
                
                <Area 
                  type="monotone" 
                  dataKey="downValue"
                  stroke="#ef4444" 
                  strokeWidth={2}
                  fillOpacity={0.4}
                  fill="url(#colorDown)" 
                  connectNulls={false}
                />
                
                <Area 
                  type="monotone" 
                  dataKey="warningValue"
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  fillOpacity={0.4}
                  fill="url(#colorWarning)" 
                  connectNulls={false}
                />
                
                {/* Add reference lines for paused periods */}
                {chartData.map((entry, index) => 
                  entry.status === 'paused' ? (
                    <ReferenceLine 
                      key={`ref-${index}`}
                      x={entry.time} 
                      stroke="#9ca3af"
                      strokeDasharray="3 3"
                    />
                  ) : null
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}