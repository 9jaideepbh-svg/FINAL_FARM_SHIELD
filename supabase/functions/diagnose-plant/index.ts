import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface DiagnosisResult {
  plant_name: string;
  condition: string;
  is_healthy: boolean;
  confidence_percentage: number;
  symptoms_observed: string[];
  action_plan: {
    immediate_actions: string[];
    short_term: string[];
    long_term: string[];
  };
  improvements: {
    soil_management: string[];
    water_management: string[];
    nutrient_management: string[];
    pest_prevention: string[];
  };
  severity?: string;
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

    const { imageBase64, imageUrl, userId } = await req.json();

    if (!imageBase64 && !imageUrl) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Sending request to Lovable AI Gateway for plant diagnosis...");

    const systemPrompt = `You are an expert agricultural scientist and plant pathologist. Analyze the provided plant image and provide a comprehensive diagnosis.

Your response MUST be a valid JSON object with this exact structure:
{
  "plant_name": "Scientific name (Common name)",
  "condition": "Healthy" or "Disease/Issue name",
  "is_healthy": true/false,
  "confidence_percentage": 0-100,
  "symptoms_observed": ["symptom 1", "symptom 2"],
  "action_plan": {
    "immediate_actions": ["action 1", "action 2"],
    "short_term": ["action for next 1-2 weeks"],
    "long_term": ["action for next month+"]
  },
  "improvements": {
    "soil_management": ["improvement 1"],
    "water_management": ["improvement 1"],
    "nutrient_management": ["improvement 1"],
    "pest_prevention": ["improvement 1"]
  },
  "severity": "none" | "low" | "medium" | "high" | "critical"
}

Be specific, practical, and actionable in your recommendations. Focus on organic solutions when possible.`;

    const imageContent = imageBase64 
      ? `data:image/jpeg;base64,${imageBase64}`
      : imageUrl;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: imageContent }
              },
              {
                type: "text",
                text: "Please analyze this plant image and provide a detailed diagnosis with action plan and improvements."
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    console.log("AI Response received:", content);

    // Parse the JSON response from the AI
    let diagnosisData: DiagnosisResult;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      diagnosisData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Provide a fallback response
      diagnosisData = {
        plant_name: "Unknown Plant",
        condition: "Unable to analyze",
        is_healthy: false,
        confidence_percentage: 0,
        symptoms_observed: ["Image analysis failed - please try with a clearer image"],
        action_plan: {
          immediate_actions: ["Retake photo with better lighting"],
          short_term: ["Consult local agricultural expert"],
          long_term: ["Regular plant monitoring recommended"]
        },
        improvements: {
          soil_management: ["Test soil pH and nutrients"],
          water_management: ["Ensure proper drainage"],
          nutrient_management: ["Apply balanced fertilizer"],
          pest_prevention: ["Inspect plants regularly"]
        },
        severity: "medium"
      };
    }

    // Build result in the format expected by the frontend
    const serverTimestamp = new Date().toISOString();
    
    const result = {
      crop_name: diagnosisData.plant_name,
      disease_name: diagnosisData.condition,
      confidence_percentage: diagnosisData.confidence_percentage,
      is_healthy: diagnosisData.is_healthy,
      severity: diagnosisData.is_healthy ? null : diagnosisData.severity,
      diagnosis_details: {
        symptoms_observed: diagnosisData.symptoms_observed,
        affected_parts: [],
        disease_stage: diagnosisData.severity === "critical" ? "advanced" : 
                       diagnosisData.severity === "high" ? "moderate" : "early",
        pathogen_type: diagnosisData.is_healthy ? "none" : "unknown"
      },
      action_plan: diagnosisData.action_plan,
      improvements: diagnosisData.improvements,
      prevention_tips: [
        ...diagnosisData.improvements.pest_prevention,
        ...diagnosisData.action_plan.long_term
      ],
      treatment_recommendations: [
        ...diagnosisData.action_plan.immediate_actions.map(action => ({
          step: action,
          estimated_yield_impact: "Critical for plant recovery",
          recovery_prediction: "Immediate action needed"
        })),
        ...diagnosisData.action_plan.short_term.map(action => ({
          step: action,
          estimated_yield_impact: "Supports recovery process",
          recovery_prediction: "Expected improvement in 1-2 weeks"
        }))
      ],
      yield_impact_summary: {
        without_treatment: diagnosisData.is_healthy ? "N/A - Plant is healthy" : "Potential significant yield loss if untreated",
        with_treatment: diagnosisData.is_healthy ? "N/A - Continue current care" : "Good recovery expected with proper care",
        treatment_window: diagnosisData.is_healthy ? "N/A" : "Start treatment within 7 days for best results"
      },
      recovery_prediction: {
        timeline: diagnosisData.is_healthy ? "N/A" : "2-4 weeks with proper treatment",
        success_rate: diagnosisData.is_healthy ? "N/A" : `${Math.max(50, 100 - (diagnosisData.confidence_percentage > 80 ? 15 : 25))}% with recommended treatment`,
        factors: diagnosisData.is_healthy 
          ? ["Continue regular care", "Monitor for any changes"]
          : ["Early intervention", "Proper treatment application", "Environmental conditions", "Plant health status"]
      },
      data_source: "Lovable AI Gateway"
    };

    // Store in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: savedDiagnosis, error: dbError } = await supabase
      .from("diagnoses")
      .insert({
        user_id: userId,
        image_url: imageUrl || "base64-upload",
        crop_name: result.crop_name,
        disease_name: result.disease_name,
        confidence_percentage: result.confidence_percentage,
        is_healthy: result.is_healthy,
        diagnosis_details: {
          ...result.diagnosis_details,
          action_plan: result.action_plan,
          improvements: result.improvements
        },
        severity: result.severity,
        treatment_recommendations: result.treatment_recommendations.map(t => t.step),
        prevention_tips: result.prevention_tips,
        diagnosis_date: serverTimestamp,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
    }

    console.log("Diagnosis completed successfully:", result.disease_name);

    return new Response(
      JSON.stringify({
        ...result,
        diagnosis_id: savedDiagnosis?.id,
        diagnosis_date: serverTimestamp,
        low_confidence_warning: result.confidence_percentage < 60,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Diagnosis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
