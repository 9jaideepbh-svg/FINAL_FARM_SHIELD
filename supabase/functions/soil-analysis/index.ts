import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SoilTestInput {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ph: number;
  organic_matter?: number;
  soil_type?: string;
  crop_type: string;
  location?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const soilData: SoilTestInput = await req.json();

    if (!soilData.crop_type) {
      return new Response(
        JSON.stringify({ error: "Crop type is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an expert agricultural soil scientist and advisor for Farm Shield app.

Analyze the soil test data provided and give comprehensive recommendations for the specified crop.

You MUST respond with a valid JSON object in this exact format:
{
  "soil_health_score": 75,
  "soil_health_status": "Good" | "Moderate" | "Poor" | "Critical",
  "npk_analysis": {
    "nitrogen": {
      "current_level": "Value provided",
      "status": "Deficient" | "Low" | "Optimal" | "High" | "Excess",
      "ideal_range": "Ideal range for the crop",
      "recommendation": "Specific recommendation"
    },
    "phosphorus": {
      "current_level": "Value provided",
      "status": "Deficient" | "Low" | "Optimal" | "High" | "Excess",
      "ideal_range": "Ideal range for the crop",
      "recommendation": "Specific recommendation"
    },
    "potassium": {
      "current_level": "Value provided",
      "status": "Deficient" | "Low" | "Optimal" | "High" | "Excess",
      "ideal_range": "Ideal range for the crop",
      "recommendation": "Specific recommendation"
    }
  },
  "ph_analysis": {
    "current_ph": "Value provided",
    "status": "Too Acidic" | "Slightly Acidic" | "Optimal" | "Slightly Alkaline" | "Too Alkaline",
    "ideal_range": "Ideal pH range for the crop",
    "recommendation": "How to adjust pH if needed"
  },
  "fertilizer_recommendations": [
    {
      "name": "Fertilizer name (e.g., Urea, DAP, MOP)",
      "type": "organic" | "inorganic",
      "npk_ratio": "N-P-K ratio if applicable",
      "dosage": "Recommended dosage per acre/hectare",
      "application_time": "When to apply (e.g., basal, top dressing)",
      "application_method": "How to apply",
      "estimated_cost": "Approximate cost per acre",
      "benefits": ["Specific benefit 1", "Specific benefit 2"]
    }
  ],
  "organic_amendments": [
    {
      "name": "Amendment name (e.g., Vermicompost, FYM)",
      "dosage": "Recommended quantity",
      "benefits": ["Benefit 1", "Benefit 2"],
      "application_method": "How to apply"
    }
  ],
  "improvement_plan": {
    "immediate_actions": ["Action 1", "Action 2"],
    "short_term": ["2-4 week actions"],
    "long_term": ["Seasonal/yearly improvements"]
  },
  "crop_specific_advice": {
    "growth_stage_nutrition": [
      {
        "stage": "Growth stage name",
        "nutrient_focus": "Primary nutrients needed",
        "recommended_practice": "What to do"
      }
    ],
    "common_deficiency_symptoms": ["Symptom to watch for"],
    "yield_optimization_tips": ["Tip 1", "Tip 2"]
  },
  "warnings": ["Any critical warnings based on soil analysis"]
}

Guidelines:
- Provide crop-specific recommendations based on the crop type provided
- Be precise with dosage recommendations (use metric units)
- Include both organic and inorganic options
- Consider soil pH when recommending fertilizers
- Factor in organic matter content for soil health assessment
- Provide practical, actionable advice for farmers
- Include cost-effective alternatives when possible`;

    const userPrompt = `Analyze this soil test data for ${soilData.crop_type} cultivation:

- Nitrogen (N): ${soilData.nitrogen} kg/ha
- Phosphorus (P): ${soilData.phosphorus} kg/ha  
- Potassium (K): ${soilData.potassium} kg/ha
- Soil pH: ${soilData.ph}
${soilData.organic_matter ? `- Organic Matter: ${soilData.organic_matter}%` : ''}
${soilData.soil_type ? `- Soil Type: ${soilData.soil_type}` : ''}
${soilData.location ? `- Location: ${soilData.location}` : ''}

Please provide comprehensive soil analysis and recommendations for optimal ${soilData.crop_type} growth. Return ONLY the JSON object, no additional text.`;

    console.log("Sending request to Lovable AI Gateway for soil analysis...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 3000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let analysisResult;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, content];
      const jsonString = jsonMatch[1] || content;
      analysisResult = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.error("Raw content:", content);
      throw new Error("Failed to parse soil analysis results");
    }

    return new Response(
      JSON.stringify({
        ...analysisResult,
        input_data: soilData,
        analysis_date: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Soil analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
