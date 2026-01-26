import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PlantIdSuggestion {
  id: string;
  name: string;
  probability: number;
  similar_images?: Array<{ url: string }>;
  details?: {
    description?: { value?: string };
    treatment?: {
      chemical?: Array<{ value?: string }>;
      biological?: Array<{ value?: string }>;
      prevention?: Array<{ value?: string }>;
    };
    cause?: { value?: string };
    common_names?: Array<{ value?: string }>;
    classification?: {
      kingdom?: { value?: string };
      phylum?: { value?: string };
      class?: { value?: string };
      order?: { value?: string };
      family?: { value?: string };
      genus?: { value?: string };
    };
  };
}

interface PlantIdResponse {
  result: {
    is_plant: { probability: number; binary: boolean };
    is_healthy: { probability: number; binary: boolean };
    disease?: {
      suggestions: PlantIdSuggestion[];
    };
    classification?: {
      suggestions: PlantIdSuggestion[];
    };
  };
  status: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PLANT_ID_API_KEY = Deno.env.get("PLANT_ID_API_KEY");
    
    if (!PLANT_ID_API_KEY) {
      throw new Error("PLANT_ID_API_KEY is not configured");
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

    console.log("Sending request to Plant.id API for plant diagnosis...");

    // Call Plant.id API v3 - using identification endpoint with health assessment
    const plantIdResponse = await fetch("https://plant.id/api/v3/identification?details=common_names,description,treatment,cause&health=all", {
      method: "POST",
      headers: {
        "Api-Key": PLANT_ID_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        images: [imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : imageUrl],
        similar_images: true,
      }),
    });

    if (!plantIdResponse.ok) {
      const errorText = await plantIdResponse.text();
      console.error("Plant.id API error:", plantIdResponse.status, errorText);
      throw new Error(`Plant.id API error: ${plantIdResponse.status} - ${errorText}`);
    }

    const plantIdData: PlantIdResponse = await plantIdResponse.json();
    console.log("Plant.id response received:", JSON.stringify(plantIdData, null, 2));

    // Parse Plant.id response
    const isHealthy = plantIdData.result.is_healthy?.binary ?? true;
    const healthProbability = plantIdData.result.is_healthy?.probability ?? 1;
    
    // Get plant classification
    const plantSuggestion = plantIdData.result.classification?.suggestions?.[0];
    const cropName = plantSuggestion?.name || "Unknown Plant";
    
    // Get disease information
    const diseaseSuggestions = plantIdData.result.disease?.suggestions || [];
    const topDisease = diseaseSuggestions[0];
    
    const diseaseName = isHealthy ? "Healthy" : (topDisease?.name || "Unknown Disease");
    const confidencePercentage = isHealthy 
      ? Math.round(healthProbability * 100)
      : Math.round((topDisease?.probability || 0) * 100);

    // Determine severity based on probability
    let severity: string | null = null;
    if (!isHealthy && topDisease) {
      const prob = topDisease.probability;
      if (prob >= 0.8) severity = "critical";
      else if (prob >= 0.6) severity = "high";
      else if (prob >= 0.4) severity = "medium";
      else severity = "low";
    }

    // Extract description from details
    const diseaseDescription = topDisease?.details?.description?.value || "Disease symptoms detected";
    const diseaseCause = topDisease?.details?.cause?.value || "unknown";

    // Build diagnosis details
    const diagnosisDetails = {
      symptoms_observed: isHealthy 
        ? ["Plant appears healthy with no visible disease symptoms"]
        : [diseaseDescription],
      affected_parts: isHealthy ? [] : ["leaves"],
      disease_stage: isHealthy ? null : (severity === "critical" ? "advanced" : severity === "high" ? "moderate" : "early"),
      pathogen_type: isHealthy ? "none" : diseaseCause,
      plant_id_confidence: confidencePercentage,
      alternative_diseases: diseaseSuggestions.slice(1, 4).map(d => ({
        name: d.name,
        probability: Math.round(d.probability * 100)
      }))
    };

    // Build treatment recommendations using Plant.id data
    let treatmentRecommendations: Array<{ step: string; estimated_yield_impact: string; recovery_prediction: string }> = [];
    let recommendedProducts: Array<{
      name: string;
      type: "organic" | "inorganic";
      category: string;
      dosage: string;
      application_method: string;
      frequency: string;
      benefits: string[];
      precautions: string[];
    }> = [];
    let preventionTips: string[] = [];
    let yieldImpactSummary = {
      without_treatment: isHealthy ? "N/A - Plant is healthy" : "Potential 20-50% yield loss if untreated",
      with_treatment: isHealthy ? "N/A - Maintain current care" : "80-95% yield recovery expected",
      treatment_window: isHealthy ? "N/A" : "Within 7-14 days for best results"
    };
    let recoveryPrediction = {
      timeline: isHealthy ? "N/A" : "2-4 weeks with proper treatment",
      success_rate: isHealthy ? "N/A" : "85% with recommended treatment",
      factors: isHealthy 
        ? ["Continue regular care", "Monitor for any changes"]
        : ["Early detection", "Proper treatment application", "Environmental conditions"]
    };

    if (isHealthy) {
      treatmentRecommendations = [
        {
          step: "Continue regular watering and fertilization schedule",
          estimated_yield_impact: "Maintains optimal yield potential",
          recovery_prediction: "N/A - Plant is healthy"
        },
        {
          step: "Monitor regularly for any signs of stress or disease",
          estimated_yield_impact: "Early detection prevents yield loss",
          recovery_prediction: "N/A - Preventive measure"
        }
      ];
      preventionTips = [
        "Maintain proper spacing between plants for air circulation",
        "Water at the base of plants to avoid wet foliage",
        "Remove dead or yellowing leaves promptly",
        "Rotate crops annually to prevent soil-borne diseases"
      ];
      recommendedProducts = [
        {
          name: "Balanced NPK Fertilizer (10-10-10)",
          type: "inorganic",
          category: "fertilizer",
          dosage: "1-2 tablespoons per plant",
          application_method: "Soil application",
          frequency: "Every 2-3 weeks during growing season",
          benefits: ["Promotes healthy growth", "Supports fruit development"],
          precautions: ["Avoid over-fertilization", "Water after application"]
        },
        {
          name: "Neem Oil Spray",
          type: "organic",
          category: "pesticide",
          dosage: "2-3 ml per liter of water",
          application_method: "Foliar spray",
          frequency: "Weekly as preventive",
          benefits: ["Natural pest deterrent", "Prevents fungal infections"],
          precautions: ["Apply in evening", "Test on small area first"]
        }
      ];
    } else {
      // Get treatment info from Plant.id
      const treatment = topDisease?.details?.treatment;
      
      if (treatment?.chemical?.length) {
        treatment.chemical.forEach((chem, idx) => {
          const chemValue = typeof chem === 'string' ? chem : chem?.value;
          if (chemValue) {
            treatmentRecommendations.push({
              step: chemValue,
              estimated_yield_impact: idx === 0 ? "+25-35% yield recovery" : "+10-15% additional improvement",
              recovery_prediction: "Visible improvement in 7-14 days"
            });
          }
        });
      }
      
      if (treatment?.biological?.length) {
        treatment.biological.forEach((bio) => {
          const bioValue = typeof bio === 'string' ? bio : bio?.value;
          if (bioValue) {
            treatmentRecommendations.push({
              step: bioValue,
              estimated_yield_impact: "+15-25% yield recovery (organic method)",
              recovery_prediction: "Gradual improvement over 2-3 weeks"
            });
          }
        });
      }

      // Extract prevention tips
      if (treatment?.prevention?.length) {
        preventionTips = treatment.prevention.map(p => typeof p === 'string' ? p : p?.value || '').filter(Boolean);
      }
      
      if (preventionTips.length === 0) {
        preventionTips = [
          "Ensure proper plant spacing for air circulation",
          "Avoid overhead watering",
          "Remove and destroy infected plant parts",
          "Practice crop rotation"
        ];
      }

      // Add recommended products based on disease type
      recommendedProducts = [
        {
          name: "Copper Fungicide",
          type: "inorganic",
          category: "fungicide",
          dosage: "2-3 grams per liter of water",
          application_method: "Foliar spray",
          frequency: "Every 7-10 days until symptoms subside",
          benefits: ["Broad-spectrum fungal control", "Prevents spore spread"],
          precautions: ["Avoid spraying in hot sun", "Wear protective gear"]
        },
        {
          name: "Trichoderma viride",
          type: "organic",
          category: "bio-agent",
          dosage: "5 grams per liter of water",
          application_method: "Soil drench or foliar spray",
          frequency: "Every 15 days",
          benefits: ["Natural disease suppression", "Improves soil health", "Safe for beneficial insects"],
          precautions: ["Store in cool place", "Use fresh solution"]
        },
        {
          name: "Mancozeb 75% WP",
          type: "inorganic",
          category: "fungicide",
          dosage: "2 grams per liter of water",
          application_method: "Foliar spray",
          frequency: "Every 7 days during active infection",
          benefits: ["Effective against multiple fungal diseases", "Prevents new infections"],
          precautions: ["Maintain 7-day pre-harvest interval", "Rotate with other fungicides"]
        },
        {
          name: "Pseudomonas fluorescens",
          type: "organic",
          category: "bio-agent",
          dosage: "10 grams per liter of water",
          application_method: "Foliar spray or seed treatment",
          frequency: "Every 10-15 days",
          benefits: ["Induces plant immunity", "Competes with pathogens", "Eco-friendly"],
          precautions: ["Apply in evening hours", "Avoid mixing with chemical pesticides"]
        }
      ];

      // If no treatment recommendations from Plant.id, add generic ones
      if (treatmentRecommendations.length === 0) {
        treatmentRecommendations = [
          {
            step: "Remove and destroy all infected plant parts immediately",
            estimated_yield_impact: "Prevents 20-30% additional yield loss",
            recovery_prediction: "Stops disease spread within 3-5 days"
          },
          {
            step: "Apply appropriate fungicide or treatment based on disease type",
            estimated_yield_impact: "+25-40% yield recovery",
            recovery_prediction: "Improvement visible in 7-14 days"
          },
          {
            step: "Improve air circulation and reduce humidity around plants",
            estimated_yield_impact: "Reduces disease pressure by 15-20%",
            recovery_prediction: "Long-term prevention measure"
          }
        ];
      }
    }

    // Build final result
    const diagnosisResult = {
      crop_name: cropName,
      disease_name: diseaseName,
      confidence_percentage: confidencePercentage,
      is_healthy: isHealthy,
      severity,
      diagnosis_details: diagnosisDetails,
      treatment_recommendations: treatmentRecommendations,
      recommended_products: recommendedProducts,
      yield_impact_summary: yieldImpactSummary,
      recovery_prediction: recoveryPrediction,
      prevention_tips: preventionTips,
      data_source: "Plant.id API"
    };

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
        severity: diagnosisResult.severity,
        treatment_recommendations: treatmentRecommendations.map(t => t.step),
        prevention_tips: diagnosisResult.prevention_tips,
        diagnosis_date: serverTimestamp,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
    }

    console.log("Diagnosis completed successfully:", diagnosisResult.disease_name);

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
