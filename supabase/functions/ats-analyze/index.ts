import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobDescription, resumeContent } = await req.json();

    if (!jobDescription || !resumeContent) {
      return new Response(
        JSON.stringify({ error: 'Job description and resume content are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `You are an expert ATS (Applicant Tracking System) optimization consultant and career advisor.

Your task is to analyze the job description and the candidate's resume to help optimize the resume for better ATS compatibility.

Follow these steps:
1. Read the job description carefully and extract the most relevant keywords, skills, technical terms, and requirements that reflect what the employer is looking for.
2. Analyze the resume content and identify which important terms or phrases are present.
3. Compare the job requirements with the resume content to find missing or underrepresented keywords.
4. Identify specific keywords, skills, and phrases that should be added or emphasized in the resume to improve ATS match score.
5. Provide actionable recommendations for improving the resume's ATS compatibility.

Return your analysis in the following JSON format (return ONLY valid JSON, no markdown):
{
  "missingKeywords": ["keyword1", "keyword2"],
  "weakKeywords": ["keyword3", "keyword4"],
  "presentKeywords": ["keyword5", "keyword6"],
  "summary": "A concise explanation of how the resume can be improved"
}

Job Description:
${jobDescription}

Resume Content:
${resumeContent}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an ATS optimization expert. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Parse JSON from AI response
    let result;
    try {
      // Remove markdown code blocks if present
      const cleanResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      result = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('Invalid JSON response from AI');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ats-analyze function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred during analysis';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
