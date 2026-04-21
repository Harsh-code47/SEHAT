// Edge runtime types
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestResult {
  name: string;
  value: number;
  unit: string;
  referenceRange: string;
  minNormal: number;
  maxNormal: number;
  status: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log('Authenticated user:', userId);

    const body = await req.json();
    const { reportText, extractTextFromImage, imageData, fileName, language } = body;
    const isHindi = language === 'hindi';

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle text extraction from image/PDF
    if (extractTextFromImage && imageData) {
      console.log('Extracting text from file:', fileName);

      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `First, determine if this image/document is a medical or laboratory report. If it is NOT a medical report, respond with exactly "NOT_MEDICAL_REPORT" and nothing else. If it IS a medical report, extract ALL text from it. Include every single test name, value, unit, and reference range exactly as shown. Format each test on a new line. Be comprehensive and include ALL tests visible in the report.`,
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: imageData,
                    },
                  },
                ],
              },
            ],
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error('AI extraction error:', errorText);
          throw new Error('Failed to extract text from image');
        }

        const aiData = await aiResponse.json();
        const extractedText = aiData.choices[0]?.message?.content || '';
        
        // Check if AI determined it's not a medical report
        if (extractedText.trim().startsWith('NOT_MEDICAL_REPORT')) {
          return new Response(
            JSON.stringify({ error: 'The uploaded file does not appear to be a medical or laboratory report. Please upload a valid medical report.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Extracted text length:', extractedText.length);

        return new Response(
          JSON.stringify({ extractedText }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (extractError) {
        console.error('Text extraction error:', extractError);
        return new Response(
          JSON.stringify({ error: 'Failed to extract text from file' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!reportText) {
      return new Response(
        JSON.stringify({ error: 'Report text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input length to prevent abuse
    if (reportText.length > 50000) {
      return new Response(
        JSON.stringify({ error: 'Report text exceeds maximum allowed length' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate that the content is actually a medical report
    console.log('Validating if content is a medical report...');
    try {
      const validationResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-lite',
          messages: [
            {
              role: 'system',
              content: 'You are a document classifier. Determine if the given text is from a medical/lab report. A medical report contains test names, numeric values, units, and reference ranges. Respond ONLY with "yes" or "no".',
            },
            {
              role: 'user',
              content: `Is this text from a medical or laboratory report?\n\n${reportText.substring(0, 3000)}`,
            },
          ],
        }),
      });

      if (validationResponse.ok) {
        const validationData = await validationResponse.json();
        const answer = (validationData.choices[0]?.message?.content || '').trim().toLowerCase();
        if (answer.startsWith('no')) {
          return new Response(
            JSON.stringify({ error: 'The uploaded content does not appear to be a medical or laboratory report. Please upload a valid medical report.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    } catch (valError) {
      console.error('Validation check failed, proceeding with analysis:', valError);
    }

    console.log('Analyzing report text with AI...');

    // Use AI to extract ALL test values with their reference ranges from the report
    try {
      const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are a medical report analyzer. Extract ALL test results from the report and return structured JSON.

For EACH test found, extract:
- name: The test name exactly as shown
- value: The numeric value (just the number, no units)
- unit: The unit of measurement (e.g. "mg/dL", "g/dL", "cells/μL")
- referenceRange: A human-readable normal range string (e.g. "70-99 mg/dL"). NEVER return "Not provided", "N/A", or empty — always supply a value.
- minNormal: Numeric minimum normal value
- maxNormal: Numeric maximum normal value
- status: "Normal" if minNormal <= value <= maxNormal, "Low" if value < minNormal, "High" if value > maxNormal. Compute strictly from the numbers.

CRITICAL RULES:
1. If the report explicitly provides a reference range, USE IT.
2. If the report does NOT provide a reference range, YOU MUST fill in standard adult clinical reference ranges from your medical knowledge. Examples (adult, general population):
   - Hemoglobin: 12-16 g/dL (women), 13.5-17.5 g/dL (men); use 12-17 g/dL if sex unknown
   - WBC: 4000-11000 cells/μL (or 4.0-11.0 x10^3/μL)
   - RBC: 4.2-5.9 million/μL
   - Platelets: 150000-450000 /μL
   - Fasting Glucose: 70-99 mg/dL (100-125 = pre-diabetic = High, >=126 = High/diabetic)
   - Random Glucose: 70-140 mg/dL
   - HbA1c: 4.0-5.6 %
   - Total Cholesterol: <200 mg/dL → use 0-200
   - LDL: <100 mg/dL → use 0-100
   - HDL: >40 mg/dL → use 40-100
   - Triglycerides: <150 mg/dL → use 0-150
   - Creatinine: 0.6-1.3 mg/dL
   - Urea/BUN: 7-20 mg/dL
   - TSH: 0.4-4.0 mIU/L
   - Vitamin D: 30-100 ng/mL
   - Vitamin B12: 200-900 pg/mL
3. NEVER return status "Normal" if the value is outside [minNormal, maxNormal]. Recompute and verify before responding.
4. If reference range shows "<X", set minNormal=0 and maxNormal=X.
5. If reference range shows ">X", set minNormal=X and maxNormal=X*3 (or a sensible upper bound).
6. Extract ALL tests present, not just common ones.`,
            },
            {
              role: 'user',
              content: `Analyze this medical report. Extract every test with accurate reference ranges (use standard clinical ranges if not present in report) and correctly classify status:\n\n${reportText}`,
            },
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'report_analysis',
                description: 'Return the complete analysis of all medical tests',
                parameters: {
                  type: 'object',
                  properties: {
                    tests: {
                      type: 'array',
                      description: 'All tests found in the report',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string', description: 'Test name' },
                          value: { type: 'number', description: 'Numeric test value' },
                          unit: { type: 'string', description: 'Unit of measurement' },
                          referenceRange: { type: 'string', description: 'Reference range as shown in report' },
                          minNormal: { type: 'number', description: 'Minimum normal value' },
                          maxNormal: { type: 'number', description: 'Maximum normal value' },
                          status: { type: 'string', enum: ['Normal', 'Low', 'High'], description: 'Status based on reference range' },
                        },
                        required: ['name', 'value', 'unit', 'referenceRange', 'minNormal', 'maxNormal', 'status'],
                      },
                    },
                    summary: { type: 'string', description: 'Brief summary of overall findings' },
                  },
                  required: ['tests', 'summary'],
                },
              },
            },
          ],
          tool_choice: { type: 'function', function: { name: 'report_analysis' } },
        }),
      });

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        console.error('AI analysis error:', errorText);
        throw new Error('Failed to analyze report');
      }

      const analysisData = await analysisResponse.json();
      
      // Extract the tool call result
      const toolCall = analysisData.choices[0]?.message?.tool_calls?.[0];
      if (!toolCall || toolCall.function.name !== 'report_analysis') {
        throw new Error('Invalid AI response format');
      }

      const parsedResult = JSON.parse(toolCall.function.arguments);
      const rawTests = parsedResult.tests || [];
      const summary = parsedResult.summary || '';

      // Safety net: recompute status from numeric values and ensure referenceRange is never empty
      const tests = rawTests.map((t: any) => {
        const value = Number(t.value);
        const minN = Number(t.minNormal);
        const maxN = Number(t.maxNormal);
        let status = t.status;
        if (Number.isFinite(value) && Number.isFinite(minN) && Number.isFinite(maxN)) {
          if (value < minN) status = 'Low';
          else if (value > maxN) status = 'High';
          else status = 'Normal';
        }
        let referenceRange = t.referenceRange;
        if (!referenceRange || /not provided|n\/a/i.test(referenceRange)) {
          if (Number.isFinite(minN) && Number.isFinite(maxN)) {
            referenceRange = `${minN} - ${maxN}${t.unit ? ' ' + t.unit : ''}`;
          } else {
            referenceRange = 'Range not available';
          }
        }
        return { ...t, status, referenceRange };
      });

      console.log(`Extracted ${tests.length} tests from report`);

      // Generate explanation for abnormal values
      const abnormalTests = tests.filter((t: any) => t.status !== 'Normal');
      let explanation = '';

      if (abnormalTests.length > 0) {
        const explanationResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: isHindi
                  ? 'आप एक मेडिकल सहायक हैं जो मरीजों को उनकी लैब रिपोर्ट समझने में मदद करते हैं। सरल हिंदी में स्पष्ट व्याख्या दें। चिकित्सा शब्दजाल से बचें। 200 शब्दों से कम रखें।'
                  : 'You are a medical assistant helping patients understand their lab results. Provide clear, simple explanations without medical jargon. Be reassuring but accurate. Keep response under 200 words.',
              },
              {
                role: 'user',
                content: isHindi
                  ? `इन असामान्य लैब परिणामों को सरल हिंदी में समझाएं: ${abnormalTests.map((t: any) => 
                      `${t.name}: ${t.value} ${t.unit} (${t.status}, सामान्य: ${t.referenceRange})`
                    ).join(', ')}. ये क्या संकेत दे सकते हैं और मरीज को क्या करना चाहिए?`
                  : `Explain these abnormal lab results in simple terms: ${abnormalTests.map((t: any) => 
                      `${t.name}: ${t.value} ${t.unit} (${t.status}, Normal: ${t.referenceRange})`
                    ).join(', ')}. What might these indicate and what should the patient do?`,
              },
            ],
          }),
        });

        if (explanationResponse.ok) {
          const explanationData = await explanationResponse.json();
          explanation = explanationData.choices[0]?.message?.content || '';
        }
      } else {
        explanation = isHindi
          ? 'आपके सभी टेस्ट परिणाम सामान्य सीमा में हैं। यह एक सकारात्मक संकेत है जो मापे गए क्षेत्रों में अच्छे स्वास्थ्य को दर्शाता है। स्वस्थ जीवनशैली बनाए रखें।'
          : 'All your test results are within normal ranges. This is a positive sign indicating good health in the measured areas. Continue maintaining a healthy lifestyle.';
      }

      // Prepare chart data
      const chartData = tests.map((test: any) => ({
        name: test.name,
        yourValue: test.value,
        minNormal: test.minNormal,
        maxNormal: test.maxNormal,
        status: test.status,
      }));

      const abnormalValues = abnormalTests.map((t: any) => ({
        name: t.name,
        value: t.value,
        status: t.status,
      }));

      const response = {
        analysis: {
          totalTests: tests.length,
          normalTests: tests.filter((t: any) => t.status === 'Normal').length,
          abnormalTests: abnormalTests.length,
        },
        tests,
        chartData,
        abnormalValues,
        explanation,
        summary: summary || (abnormalTests.length === 0
          ? 'All values are within normal ranges'
          : `${abnormalTests.length} abnormal value(s) detected out of ${tests.length} tests`),
      };

      console.log('Analysis complete for user:', userId);

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (analysisError) {
      console.error('Analysis error:', analysisError);
      return new Response(
        JSON.stringify({ error: 'Failed to analyze report. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error analyzing report:', error);
    // Return generic error message to avoid leaking internal details
    return new Response(
      JSON.stringify({ error: 'Unable to analyze report. Please try again or contact support.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
