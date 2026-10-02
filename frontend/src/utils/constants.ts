export const CAT_LABELS: Record<string, string> = {
  admission: 'Admission', discharge: 'Discharge', infection: 'Infection Control',
  emergency: 'Emergency', clinical: 'Clinical', safety: 'Safety', admin: 'Administrative',
}

export const CAT_COLORS: Record<string, string> = {
  admission: 'bg-blue-100 text-blue-800',
  discharge: 'bg-green-100 text-green-800',
  infection: 'bg-red-100 text-red-800',
  emergency: 'bg-orange-100 text-orange-800',
  clinical: 'bg-purple-100 text-purple-800',
  safety: 'bg-pink-100 text-pink-800',
  admin: 'bg-cyan-100 text-cyan-800',
}

export const QUICK_QUERIES = [
  'How do I admit a patient?',
  'What is the patient discharge workflow?',
  'Infection control and isolation procedure',
  'Emergency Code Blue protocol steps',
  'What PPE should I use for ICU patients?',
  'Medication administration steps',
  'Fire safety and evacuation procedure',
]
