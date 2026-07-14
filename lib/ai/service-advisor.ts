import { getGeminiClient, GEMINI_MODEL, Type } from '@/lib/ai/gemini'

export type ServiceAdvisorInput = {
  complaint: string
  vehicle?: { make?: string; model?: string; year?: number; mileage?: number }
}

export type ServiceAdvisorResult = {
  possible_causes: string[]
  inspection_checklist: string[]
  technician_tasks: string[]
}

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    possible_causes: { type: Type.ARRAY, items: { type: Type.STRING } },
    inspection_checklist: { type: Type.ARRAY, items: { type: Type.STRING } },
    technician_tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['possible_causes', 'inspection_checklist', 'technician_tasks'],
}

/** Returns null when AI isn't configured or the call fails — never throws, so callers can fall back to manual entry. */
export async function getServiceAdvisorSuggestion(
  input: ServiceAdvisorInput
): Promise<ServiceAdvisorResult | null> {
  const ai = getGeminiClient()
  if (!ai) return null

  const vehicleLine = input.vehicle
    ? `Vehicle: ${[input.vehicle.year, input.vehicle.make, input.vehicle.model].filter(Boolean).join(' ')}${input.vehicle.mileage ? `, ${input.vehicle.mileage} km` : ''}`
    : 'Vehicle: not specified'

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text:
                'You are a senior automotive service advisor at a UAE workshop. ' +
                'A customer has described a problem in plain language. Turn it into a structured triage ' +
                'for the service team: likely causes ordered from most to least probable, a concrete ' +
                'inspection checklist a technician can follow, and the specific tasks required to diagnose/fix it. ' +
                'Be specific to the vehicle when given. Keep each item short (one line).\n\n' +
                `${vehicleLine}\nCustomer complaint: "${input.complaint}"`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    })

    const text = response.text
    if (!text) return null
    return JSON.parse(text) as ServiceAdvisorResult
  } catch (err) {
    console.error('[ai/service-advisor] generation failed:', err)
    return null
  }
}
