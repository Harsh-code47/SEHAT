// Edge runtime types

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
    const { reportText } = await req.json();

    if (!reportText) {
      throw new Error('Report text is required');
    }

    console.log('Analyzing report text...');

    // Reference ranges for common tests
    const referenceRanges: Record<string, { min: number; max: number; unit: string }> = {
      hemoglobin: { min: 13, max: 17, unit: 'g/dL' },
      wbc: { min: 4000, max: 11000, unit: 'cells/μL' },
      platelet: { min: 150000, max: 400000, unit: 'cells/μL' },
      glucose: { min: 70, max: 100, unit: 'mg/dL' },
      cholesterol: { min: 0, max: 200, unit: 'mg/dL' },
      hdl: { min: 40, max: 999, unit: 'mg/dL' },
      ldl: { min: 0, max: 100, unit: 'mg/dL' },
      triglycerides: { min: 0, max: 150, unit: 'mg/dL' },
    };

    // Extract test values using regex and NER-like patterns
    const tests: TestResult[] = [];
    const lines = reportText.split('\n');

    for (const line of lines) {
      // Hemoglobin pattern
      const hbMatch = line.match(/hemoglobin[:\s]+(\d+\.?\d*)\s*(g\/dL)?/i);
      if (hbMatch) {
        const value = parseFloat(hbMatch[1]);
        const ref = referenceRanges.hemoglobin;
        tests.push({
          name: 'Hemoglobin',
          value,
          unit: ref.unit,
          referenceRange: `${ref.min}-${ref.max} ${ref.unit}`,
          minNormal: ref.min,
          maxNormal: ref.max,
          status: value < ref.min ? 'Low' : value > ref.max ? 'High' : 'Normal',
        });
      }

      // WBC pattern
      const wbcMatch = line.match(/(?:wbc|white blood cell)[:\s]+(\d+\.?\d*)\s*(?:cells\/μL)?/i);
      if (wbcMatch) {
        const value = parseFloat(wbcMatch[1]);
        const ref = referenceRanges.wbc;
        tests.push({
          name: 'WBC',
          value,
          unit: ref.unit,
          referenceRange: `${ref.min}-${ref.max} ${ref.unit}`,
          minNormal: ref.min,
          maxNormal: ref.max,
          status: value < ref.min ? 'Low' : value > ref.max ? 'High' : 'Normal',
        });
      }

      // Glucose pattern
      const glucoseMatch = line.match(/glucose[:\s]+(\d+\.?\d*)\s*(?:mg\/dL)?/i);
      if (glucoseMatch) {
        const value = parseFloat(glucoseMatch[1]);
        const ref = referenceRanges.glucose;
        tests.push({
          name: 'Glucose',
          value,
          unit: ref.unit,
          referenceRange: `${ref.min}-${ref.max} ${ref.unit}`,
          minNormal: ref.min,
          maxNormal: ref.max,
          status: value < ref.min ? 'Low' : value > ref.max ? 'High' : 'Normal',
        });
      }

      // Cholesterol pattern
      const cholMatch = line.match(/cholesterol[:\s]+(\d+\.?\d*)\s*(?:mg\/dL)?/i);
      if (cholMatch) {
        const value = parseFloat(cholMatch[1]);
        const ref = referenceRanges.cholesterol;
        tests.push({
          name: 'Cholesterol',
          value,
          unit: ref.unit,
          referenceRange: `<${ref.max} ${ref.unit}`,
          minNormal: ref.min,
          maxNormal: ref.max,
          status: value > ref.max ? 'High' : 'Normal',
        });
      }

      // HDL pattern
      const hdlMatch = line.match(/hdl[:\s]+(\d+\.?\d*)\s*(?:mg\/dL)?/i);
      if (hdlMatch) {
        const value = parseFloat(hdlMatch[1]);
        const ref = referenceRanges.hdl;
        tests.push({
          name: 'HDL',
          value,
          unit: ref.unit,
          referenceRange: `>${ref.min} ${ref.unit}`,
          minNormal: ref.min,
          maxNormal: ref.max,
          status: value < ref.min ? 'Low' : 'Normal',
        });
      }

      // LDL pattern
      const ldlMatch = line.match(/ldl[:\s]+(\d+\.?\d*)\s*(?:mg\/dL)?/i);
      if (ldlMatch) {
        const value = parseFloat(ldlMatch[1]);
        const ref = referenceRanges.ldl;
        tests.push({
          name: 'LDL',
          value,
          unit: ref.unit,
          referenceRange: `<${ref.max} ${ref.unit}`,
          minNormal: ref.min,
          maxNormal: ref.max,
          status: value > ref.max ? 'High' : 'Normal',
        });
      }

      // Triglycerides pattern
      const trigMatch = line.match(/triglycerides?[:\s]+(\d+\.?\d*)\s*(?:mg\/dL)?/i);
      if (trigMatch) {
        const value = parseFloat(trigMatch[1]);
        const ref = referenceRanges.triglycerides;
        tests.push({
          name: 'Triglycerides',
          value,
          unit: ref.unit,
          referenceRange: `<${ref.max} ${ref.unit}`,
          minNormal: ref.min,
          maxNormal: ref.max,
          status: value > ref.max ? 'High' : 'Normal',
        });
      }

      // Platelet pattern
      const plateletMatch = line.match(/platelet[:\s]+(\d+\.?\d*)\s*(?:cells\/μL)?/i);
      if (plateletMatch) {
        const value = parseFloat(plateletMatch[1]);
        const ref = referenceRanges.platelet;
        tests.push({
          name: 'Platelet',
          value,
          unit: ref.unit,
          referenceRange: `${ref.min}-${ref.max} ${ref.unit}`,
          minNormal: ref.min,
          maxNormal: ref.max,
          status: value < ref.min ? 'Low' : value > ref.max ? 'High' : 'Normal',
        });
      }
    }

    // Generate AI explanation using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    let explanation = '';
    const abnormalTests = tests.filter(t => t.status !== 'Normal');
    
    if (LOVABLE_API_KEY && abnormalTests.length > 0) {
      try {
        const abnormalDescription = abnormalTests.map(t => 
          `${t.name}: ${t.value} ${t.unit} (${t.status}, Normal: ${t.referenceRange})`
        ).join(', ');

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
                role: 'system',
                content: 'You are a medical assistant helping patients understand their lab results. Provide clear, simple explanations without medical jargon. Be reassuring but accurate.',
              },
              {
                role: 'user',
                content: `Explain these abnormal lab results in simple terms: ${abnormalDescription}. What might these indicate and what should the patient do?`,
              },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          explanation = aiData.choices[0]?.message?.content || '';
        }
      } catch (aiError) {
        console.error('AI explanation error:', aiError);
      }
    }

    // Generate default explanation if AI fails
    if (!explanation) {
      if (abnormalTests.length === 0) {
        explanation = 'All your test results are within normal ranges. This is a positive sign indicating good health in the measured areas.';
      } else {
        explanation = `Your report shows ${abnormalTests.length} abnormal value(s). ${abnormalTests.map(t => {
          if (t.name === 'Hemoglobin' && t.status === 'Low') {
            return 'Low hemoglobin may indicate anemia or iron deficiency.';
          } else if (t.name === 'Glucose' && t.status === 'High') {
            return 'High glucose levels may indicate diabetes or prediabetes.';
          } else if (t.name === 'Cholesterol' && t.status === 'High') {
            return 'High cholesterol increases risk of heart disease.';
          } else if (t.name === 'LDL' && t.status === 'High') {
            return 'High LDL (bad cholesterol) can lead to plaque buildup in arteries.';
          } else if (t.name === 'HDL' && t.status === 'Low') {
            return 'Low HDL (good cholesterol) reduces protection against heart disease.';
          } else if (t.name === 'Triglycerides' && t.status === 'High') {
            return 'High triglycerides increase risk of heart disease and pancreatitis.';
          }
          return `${t.name} is ${t.status.toLowerCase()}.`;
        }).join(' ')} Please consult your doctor for proper evaluation and treatment.`;
      }
    }

    // Prepare chart data
    const chartData = tests.map(test => ({
      name: test.name,
      yourValue: test.value,
      minNormal: test.minNormal,
      maxNormal: test.maxNormal,
      status: test.status,
    }));

    const abnormalValues = tests.filter(t => t.status !== 'Normal').map(t => ({
      name: t.name,
      value: t.value,
      status: t.status,
    }));

    const response = {
      analysis: {
        totalTests: tests.length,
        normalTests: tests.filter(t => t.status === 'Normal').length,
        abnormalTests: abnormalTests.length,
      },
      tests,
      chartData,
      abnormalValues,
      explanation,
      summary: abnormalTests.length === 0
        ? 'All values are within normal ranges'
        : `${abnormalTests.length} abnormal value(s) detected`,
    };

    console.log('Analysis complete:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error analyzing report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze report';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
