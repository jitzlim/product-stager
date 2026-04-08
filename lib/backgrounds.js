export const BACKGROUNDS = [
  {
    id: 'BEDROOM',
    label: 'Bedroom',
    gradient: 'linear-gradient(135deg, #2d1b69 0%, #0e0620 100%)',
    emoji: '🛏️',
    prompt: 'a cozy well-decorated bedroom with soft natural lighting, pillows and home decor visible in the background',
  },
  {
    id: 'KITCHEN',
    label: 'Kitchen',
    gradient: 'linear-gradient(135deg, #0f2027 0%, #1a3a4a 100%)',
    emoji: '🍳',
    prompt: 'a modern clean kitchen with countertops, marble surfaces, and warm natural window light',
  },
  {
    id: 'CAFE',
    label: 'Cafe',
    gradient: 'linear-gradient(135deg, #3d1a00 0%, #6b3a2a 100%)',
    emoji: '☕',
    prompt: 'a trendy café with wooden tables, coffee cups, warm ambient lighting and soft bokeh background',
  },
  {
    id: 'OUTDOOR',
    label: 'Outdoor',
    gradient: 'linear-gradient(135deg, #134e5e 0%, #1a3a1a 100%)',
    emoji: '🌿',
    prompt: 'an outdoor setting with natural sunlight, lush greenery or a stylish urban street backdrop',
  },
  {
    id: 'TABLE',
    label: 'Table',
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    emoji: '🪵',
    prompt: 'a clean minimal table surface with a soft neutral background and subtle natural shadows',
  },
  {
    id: 'DRUGSTORE',
    label: 'Drugstore',
    gradient: 'linear-gradient(135deg, #0a1628 0%, #102040 100%)',
    emoji: '💊',
    prompt: 'a pharmacy or health & beauty store setting with product shelves visible in the background',
  },
  {
    id: 'LIVING_ROOM',
    label: 'Living Room',
    gradient: 'linear-gradient(135deg, #2c1654 0%, #1a0533 100%)',
    emoji: '🛋️',
    prompt: 'a comfortable modern living room with a cozy sofa, indoor plants, and warm ambient lighting',
  },
  {
    id: 'OFFICE_DESK',
    label: 'Office Desk',
    gradient: 'linear-gradient(135deg, #0d1b2a 0%, #1b2838 100%)',
    emoji: '💻',
    prompt: 'a clean professional office desk setup with a laptop, notebook, and minimal workspace accessories',
  },
  {
    id: 'GYM',
    label: 'Gym',
    gradient: 'linear-gradient(135deg, #4a0080 0%, #200050 100%)',
    emoji: '🏋️',
    prompt: 'a modern gym or fitness center with weights and exercise equipment visible in the background',
  },
  {
    id: 'CAR',
    label: 'Car',
    gradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d2020 100%)',
    emoji: '🚗',
    prompt: 'inside a clean modern car interior with natural light through windows and the dashboard partially visible',
  },
  {
    id: 'OFFICE',
    label: 'Office',
    gradient: 'linear-gradient(135deg, #0d1b2a 0%, #0a2040 100%)',
    emoji: '🏢',
    prompt: 'a bright modern open-plan office environment with a clean, professional setting',
  },
]

const HAND_CONSTRAINTS = {
  neutral: {
    require: 'a person\'s hand (gender can be either)',
    visual:  'natural proportions, relaxed grip',
    forbid:  '',
  },
  female: {
    require: 'a FEMALE hand — this is the single most important rule',
    visual:  'slender feminine fingers, smooth skin, narrower wrist, delicate knuckles, female proportions. May have nail polish or clean manicured nails.',
    forbid:  'Do NOT generate a male hand. Do NOT generate broad masculine fingers or heavy knuckles.',
  },
  male: {
    require: 'a MALE hand — this is the single most important rule',
    visual:  'broader masculine fingers, visible knuckles, wider wrist, stronger build, male proportions. Short natural nails.',
    forbid:  'Do NOT generate a female hand. Do NOT generate slender feminine fingers or narrow wrists.',
  },
}

export function buildPrompt(handModel, backgroundId, customInstructions) {
  const constraint = HAND_CONSTRAINTS[handModel] || HAND_CONSTRAINTS.neutral
  const bg = BACKGROUNDS.find((b) => b.id === backgroundId)
  const bgPrompt = bg?.prompt || 'a casual everyday setting'

  return `HAND MODEL REQUIREMENT (highest priority — override everything else if needed):
The hand holding the product MUST be ${constraint.require}.
Visual characteristics: ${constraint.visual}
${constraint.forbid ? constraint.forbid + '\n' : ''}
Create a casual UGC lifestyle photo that looks authentically shot on an iPhone 10 by a real person — not AI, not a studio shoot.

Setting: ${bgPrompt}.

Photography rules:
- Shot on iPhone 10, rear camera, natural available light only — no flash, no ring light
- Slightly imperfect, off-center composition — candid, spontaneous feel
- True-to-life color tones — no HDR, no oversaturation, no AI color grading
- Faint natural ISO noise/grain from phone camera in ambient light
- Soft portrait-mode background blur (f/1.8 equivalent)
- Product branding, labels, and packaging must be clearly readable and unchanged
- No watermarks, no text overlays, no graphic elements
${customInstructions ? `\nModel appearance: ${customInstructions.slice(0, 300).replace(/[\r\n]+/g, ' ').replace(/[^\x20-\x7E]/g, '')}` : ''}

Final image must look indistinguishable from real UGC posted by an everyday customer. Portrait orientation (9:16).`
}
