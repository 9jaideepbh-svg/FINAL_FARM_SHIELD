import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
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

    const imageContent = imageBase64 
      ? { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
      : { type: "image_url", image_url: { url: imageUrl } };

    const systemPrompt = `You are an expert agricultural plant pathologist and AI assistant for Farm Shield, an agriculture advisory app. 
    
Your task is to analyze plant images and diagnose diseases with high accuracy.

When analyzing a plant image, you MUST respond with a valid JSON object in this exact format:
{
  "crop_name": "Name of the crop/plant",
  "disease_name": "Name of the disease or 'Healthy' if no disease detected",
  "confidence_percentage": 85,
  "is_healthy": false,
  "severity": "low" | "medium" | "high" | "critical",
  "diagnosis_details": {
    "symptoms_observed": ["List of visible symptoms"],
    "affected_parts": ["leaves", "stem", "fruit", etc.],
    "disease_stage": "early" | "moderate" | "advanced",
    "pathogen_type": "fungal" | "bacterial" | "viral" | "nutrient_deficiency" | "pest" | "environmental" | "none"
  },
  "treatment_recommendations": [
    {
      "step": "Specific treatment step description",
      "estimated_yield_impact": "+15% to +25% yield recovery if applied within 7 days",
      "recovery_prediction": "Full recovery expected in 2-3 weeks with proper application"
    }
  ],
  "recommended_products": [
    {
      "name": "Product Name (e.g., NPK 19-19-19 Fertilizer)",
      "type": "organic" | "inorganic",
      "category": "fertilizer" | "pesticide" | "fungicide" | "bio-agent" | "growth-regulator",
      "dosage": "Recommended dosage (e.g., 2-3 grams per liter of water)",
      "application_method": "How to apply (e.g., foliar spray, soil drench)",
      "frequency": "Application frequency (e.g., every 7-10 days)",
      "benefits": ["Why this product helps", "Specific benefit for this disease"],
      "precautions": ["Safety precaution 1", "Safety precaution 2"]
    }
  ],
  "yield_impact_summary": {
    "without_treatment": "Expected yield loss without treatment (e.g., 30-50% yield reduction)",
    "with_treatment": "Expected outcome with treatment (e.g., 80-95% yield recovery)",
    "treatment_window": "Optimal treatment timeframe (e.g., Within 7 days for best results)"
  },
  "recovery_prediction": {
    "timeline": "Expected recovery timeline (e.g., 2-4 weeks)",
    "success_rate": "Probability of recovery (e.g., 85% with proper treatment)",
    "factors": ["Factors affecting recovery", "Environmental conditions needed"]
  },
  "prevention_tips": [
    "Prevention tip 1",
    "Prevention tip 2",
    "Prevention tip 3"
  ]
}

Guidelines:
- Be precise and scientific in your analysis
- Confidence should reflect actual certainty (0-100)
- If image quality is poor or plant is not clearly visible, lower confidence accordingly
- If you cannot identify the plant or disease, set confidence below 40 and explain in diagnosis_details
- Always provide actionable treatment and prevention recommendations
- Include both organic and inorganic product options when possible
- For recommended_products, include at least 2-4 products (mix of organic and inorganic)
- Popular organic products: Neem Oil, Trichoderma, Pseudomonas, Bacillus subtilis, Vermicompost, Panchagavya
- Popular inorganic products: NPK fertilizers, Mancozeb, Carbendazim, Copper Oxychloride, Imidacloprid
- Provide realistic yield impact estimates based on disease severity and treatment timing
- Recovery predictions should be honest and based on agricultural research
- Consider environmental factors and farming practices in your recommendations
- For healthy plants, set is_healthy to true, disease_name to "Healthy", severity to null, and provide maintenance tips instead`;

    console.log("Sending request to Lovable AI Gateway for plant diagnosis...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Please analyze this plant image and provide a detailed diagnosis. Return ONLY the JSON object, no additional text." },
              imageContent
            ]
          }
        ],
        max_tokens: 2000,
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
    console.log("AI Response received:", JSON.stringify(aiResponse, null, 2));

    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response from the AI
    let diagnosisResult;
    try {
      // Try to extract JSON from the response (handles markdown code blocks)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, content];
      const jsonString = jsonMatch[1] || content;
      diagnosisResult = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.error("Raw content:", content);
      
      // Return a fallback response
      diagnosisResult = {
        crop_name: "Unknown",
        disease_name: "Analysis Failed",
        confidence_percentage: 0,
        is_healthy: false,
        severity: null,
        diagnosis_details: {
          symptoms_observed: ["Unable to analyze image"],
          affected_parts: [],
          disease_stage: null,
          pathogen_type: null,
          error: "Failed to parse diagnosis result"
        },
        treatment_recommendations: ["Please try uploading a clearer image"],
        prevention_tips: ["Ensure good lighting when taking photos"]
      };
    }

    // Add server timestamp
    const serverTimestamp = new Date().toISOString();

    // Store in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: savedDiagnosis, error: dbError } = await supabase
      .from("diagnoses")
      .insert({
        user_id: userId,
        image_url: imageUrl || "base64-upload",
        crop_name: diagnosisResult.crop_name,
        disease_name: diagnosisResult.disease_name,
        confidence_percentage: diagnosisResult.confidence_percentage,
        is_healthy: diagnosisResult.is_healthy,
        diagnosis_details: diagnosisResult.diagnosis_details,
        severity: diagnosisResult.is_healthy ? null : diagnosisResult.severity,
        treatment_recommendations: diagnosisResult.treatment_recommendations,
        prevention_tips: diagnosisResult.prevention_tips,
        diagnosis_date: serverTimestamp,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      // Still return the diagnosis even if storage fails
    }

    return new Response(
      JSON.stringify({
        ...diagnosisResult,
        diagnosis_id: savedDiagnosis?.id,
        diagnosis_date: serverTimestamp,
        low_confidence_warning: diagnosisResult.confidence_percentage < 60,
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