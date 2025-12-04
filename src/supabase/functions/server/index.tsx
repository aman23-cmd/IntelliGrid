import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Health check endpoint
app.get("/make-server-bd6686dd/health", (c) => {
  return c.json({ status: "ok" });
});

// Generate OTP for signup
app.post("/make-server-bd6686dd/generate-otp", async (c) => {
  try {
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }
    
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in KV store with 10-minute expiration
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    await kv.set(`otp:${email}`, { otp, expiresAt, email });
    
    console.log(`Generated OTP for ${email}: ${otp}`);
    
    // In a real app, you would send this via email
    // For demo purposes, we return it in the response
    return c.json({ 
      success: true, 
      message: "OTP generated successfully",
      // DEMO ONLY: In production, never return the OTP in the response
      otp: otp,
      note: "In production, this would be sent via email"
    });
  } catch (error) {
    console.log(`OTP generation error: ${error}`);
    return c.json({ error: "Failed to generate OTP" }, 500);
  }
});

// Verify OTP
app.post("/make-server-bd6686dd/verify-otp", async (c) => {
  try {
    const { email, otp } = await c.req.json();
    
    if (!email || !otp) {
      return c.json({ error: "Email and OTP are required" }, 400);
    }
    
    // Get stored OTP
    const storedData = await kv.get(`otp:${email}`);
    
    if (!storedData) {
      return c.json({ error: "OTP not found or expired" }, 400);
    }
    
    // Check if OTP is expired
    if (Date.now() > storedData.expiresAt) {
      await kv.del(`otp:${email}`);
      return c.json({ error: "OTP has expired" }, 400);
    }
    
    // Verify OTP
    if (storedData.otp !== otp) {
      return c.json({ error: "Invalid OTP" }, 400);
    }
    
    // OTP is valid, delete it
    await kv.del(`otp:${email}`);
    
    return c.json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.log(`OTP verification error: ${error}`);
    return c.json({ error: "Failed to verify OTP" }, 500);
  }
});

// User signup endpoint
app.post("/make-server-bd6686dd/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });
    
    if (error) {
      console.log(`Signup error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ user: data.user });
  } catch (error) {
    console.log(`Signup exception: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Add energy usage data
app.post("/make-server-bd6686dd/energy-usage", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { date, usage, appliance, cost } = await c.req.json();
    
    const usageData = {
      userId: user.id,
      date,
      usage: parseFloat(usage),
      appliance: appliance || 'General',
      cost: parseFloat(cost) || 0,
      timestamp: new Date().toISOString()
    };
    
    await kv.set(`usage:${user.id}:${Date.now()}`, usageData);
    
    return c.json({ success: true, data: usageData });
  } catch (error) {
    console.log(`Energy usage add error: ${error}`);
    return c.json({ error: "Failed to add energy usage" }, 500);
  }
});

// Get user's energy usage data
app.get("/make-server-bd6686dd/energy-usage", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const usageData = await kv.getByPrefix(`usage:${user.id}:`);
    
    // Sort by timestamp descending
    const sortedData = usageData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return c.json({ data: sortedData });
  } catch (error) {
    console.log(`Energy usage fetch error: ${error}`);
    return c.json({ error: "Failed to fetch energy usage" }, 500);
  }
});

// Calculate monthly bill
app.post("/make-server-bd6686dd/calculate-bill", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { month, year, ratePerKwh = 0.12 } = await c.req.json();
    
    const usageData = await kv.getByPrefix(`usage:${user.id}:`);
    
    // Filter data for the specified month/year
    const monthlyData = usageData.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === month - 1 && entryDate.getFullYear() === year;
    });
    
    const totalUsage = monthlyData.reduce((sum, entry) => sum + entry.usage, 0);
    const estimatedCost = totalUsage * ratePerKwh;
    
    const billData = {
      month,
      year,
      totalUsage,
      ratePerKwh,
      estimatedCost,
      entriesCount: monthlyData.length
    };
    
    return c.json({ bill: billData });
  } catch (error) {
    console.log(`Bill calculation error: ${error}`);
    return c.json({ error: "Failed to calculate bill" }, 500);
  }
});

// Generate energy saving tips using simple AI logic
app.get("/make-server-bd6686dd/energy-tips", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const usageData = await kv.getByPrefix(`usage:${user.id}:`);
    
    // Simple AI logic for energy tips based on usage patterns
    const totalUsage = usageData.reduce((sum, entry) => sum + entry.usage, 0);
    const avgDailyUsage = totalUsage / Math.max(usageData.length, 1);
    
    const tips = [];
    
    if (avgDailyUsage > 30) {
      tips.push("Your daily usage is quite high. Consider switching to LED bulbs to reduce consumption by up to 80%.");
      tips.push("Unplug electronics when not in use to avoid phantom power drain.");
    }
    
    if (avgDailyUsage > 50) {
      tips.push("Consider upgrading to ENERGY STAR certified appliances for significant savings.");
      tips.push("Set your thermostat 2-3 degrees higher in summer and lower in winter.");
    }
    
    // Appliance-specific tips
    const applianceUsage = usageData.reduce((acc, entry) => {
      acc[entry.appliance] = (acc[entry.appliance] || 0) + entry.usage;
      return acc;
    }, {});
    
    const topAppliance = Object.keys(applianceUsage).reduce((a, b) => 
      applianceUsage[a] > applianceUsage[b] ? a : b, 'General');
    
    if (topAppliance === 'HVAC') {
      tips.push("HVAC is your biggest energy consumer. Regular maintenance can improve efficiency by 15%.");
    } else if (topAppliance === 'Water Heater') {
      tips.push("Lower your water heater temperature to 120°F to save energy without sacrificing comfort.");
    }
    
    // Default tips if usage is low
    if (tips.length === 0) {
      tips.push("Great job maintaining low energy usage! Consider solar panels for even greater savings.");
      tips.push("Smart power strips can help eliminate standby power consumption.");
    }
    
    return c.json({ tips });
  } catch (error) {
    console.log(`Energy tips generation error: ${error}`);
    return c.json({ error: "Failed to generate energy tips" }, 500);
  }
});

// Predict peak usage using simple regression model
app.get("/make-server-bd6686dd/predict-usage", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const usageData = await kv.getByPrefix(`usage:${user.id}:`);
    
    if (usageData.length < 7) {
      return c.json({ 
        prediction: null, 
        message: "Need at least 7 days of data for prediction" 
      });
    }
    
    // Simple linear regression for prediction
    const sortedData = usageData
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Use last 30 days
    
    const n = sortedData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    sortedData.forEach((entry, index) => {
      const x = index;
      const y = entry.usage;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Predict next 7 days
    const predictions = [];
    for (let i = 1; i <= 7; i++) {
      const predictedUsage = Math.max(0, slope * (n + i - 1) + intercept);
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      predictions.push({
        date: date.toISOString().split('T')[0],
        predictedUsage: Math.round(predictedUsage * 100) / 100
      });
    }
    
    return c.json({ predictions });
  } catch (error) {
    console.log(`Usage prediction error: ${error}`);
    return c.json({ error: "Failed to predict usage" }, 500);
  }
});

// Export data as CSV
app.get("/make-server-bd6686dd/export-csv", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const usageData = await kv.getByPrefix(`usage:${user.id}:`);
    
    // Create CSV content
    const headers = ['Date', 'Usage (kWh)', 'Appliance', 'Cost ($)'];
    const rows = usageData.map(entry => [
      entry.date,
      entry.usage,
      entry.appliance,
      entry.cost || 0
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=energy-usage.csv'
      }
    });
  } catch (error) {
    console.log(`CSV export error: ${error}`);
    return c.json({ error: "Failed to export data" }, 500);
  }
});

// Save/Get energy goal
app.get("/make-server-bd6686dd/energy-goal/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    
    const goalData = await kv.get(`goal:${userId}`);
    
    return c.json({ goal: goalData?.goal || 0 });
  } catch (error) {
    console.log(`Energy goal fetch error: ${error}`);
    return c.json({ error: "Failed to fetch energy goal" }, 500);
  }
});

app.post("/make-server-bd6686dd/energy-goal", async (c) => {
  try {
    const { userId, goal } = await c.req.json();
    
    if (!userId || !goal) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    await kv.set(`goal:${userId}`, { userId, goal, updatedAt: new Date().toISOString() });
    
    return c.json({ success: true, goal });
  } catch (error) {
    console.log(`Energy goal save error: ${error}`);
    return c.json({ error: "Failed to save energy goal" }, 500);
  }
});

// Save/Get alert settings
app.get("/make-server-bd6686dd/alert-settings/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    
    const alertData = await kv.get(`alerts:${userId}`);
    
    return c.json({ 
      enabled: alertData?.enabled || false,
      threshold: alertData?.threshold || 50
    });
  } catch (error) {
    console.log(`Alert settings fetch error: ${error}`);
    return c.json({ error: "Failed to fetch alert settings" }, 500);
  }
});

app.post("/make-server-bd6686dd/alert-settings", async (c) => {
  try {
    const { userId, enabled, threshold } = await c.req.json();
    
    if (!userId || threshold === undefined) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    await kv.set(`alerts:${userId}`, { 
      userId, 
      enabled, 
      threshold,
      updatedAt: new Date().toISOString() 
    });
    
    return c.json({ success: true, enabled, threshold });
  } catch (error) {
    console.log(`Alert settings save error: ${error}`);
    return c.json({ error: "Failed to save alert settings" }, 500);
  }
});

// AI Chatbot endpoint using Google Gemini API
app.post("/make-server-bd6686dd/chat", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { message } = await c.req.json();
    
    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }
    
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!apiKey) {
      console.log('⚠️ Gemini API key not found. Returning fallback response.');
      console.log('To enable AI chatbot: Add GEMINI_API_KEY environment variable');
      console.log('Get your free API key at: https://aistudio.google.com/app/apikey');
      
      return c.json({ 
        response: "🔑 API key not configured. Please add your Google Gemini API key to enable AI features.",
        fallback: true 
      });
    }
    
    // Get user's energy data for context
    const usageData = await kv.getByPrefix(`usage:${user.id}:`);
    
    let contextInfo = '';
    if (usageData && usageData.length > 0) {
      const totalUsage = usageData.reduce((sum, entry) => sum + entry.usage, 0);
      const avgDaily = totalUsage / usageData.length;
      contextInfo = `\n\nUser Context: The user has ${usageData.length} energy usage entries with an average daily consumption of ${avgDaily.toFixed(1)} kWh.`;
    }
    
    // Call Google Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    
    const systemPrompt = `You are an intelligent Energy Assistant chatbot for a Smart Energy Consumption Dashboard. Your role is to help users:
- Understand their energy consumption patterns
- Get actionable energy-saving tips
- Learn about appliance efficiency
- Reduce their electricity bills
- Understand environmental impact of energy usage

Be friendly, concise, and provide practical advice. Use emojis sparingly for readability. Focus on actionable recommendations.${contextInfo}`;
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\nUser question: ${message}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500,
        },
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Gemini API error: ${response.status} - ${errorText}`);
      
      return c.json({ 
        error: 'Failed to get AI response',
        details: `API returned status ${response.status}`,
        fallback: true
      }, 500);
    }
    
    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      console.log('No response candidates from Gemini API');
      return c.json({ 
        response: "I couldn't generate a response. Please try rephrasing your question.",
        fallback: true 
      });
    }
    
    const aiResponse = data.candidates[0].content.parts[0].text;
    
    return c.json({ response: aiResponse, fallback: false });
    
  } catch (error) {
    console.log(`Chat endpoint error: ${error}`);
    return c.json({ 
      error: "Failed to process chat message",
      details: String(error),
      fallback: true
    }, 500);
  }
});

Deno.serve(app.fetch);