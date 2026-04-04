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

const HAND_DESCRIPTIONS = {
  neutral: 'a person\'s hand',
  female: 'a woman\'s hand',
  male: 'a man\'s hand',
}

export function buildPrompt(handModel, backgroundId, customInstructions) {
  const hand = HAND_DESCRIPTIONS[handModel] || HAND_DESCRIPTIONS.neutral
  const bg = BACKGROUNDS.find((b) => b.id === backgroundId)
  const bgPrompt = bg?.prompt || 'a casual everyday setting'

  return `Create a casual UGC lifestyle photo that looks authentically shot on an iPhone 10 by a real person — not AI, not a studio shoot.

Scene: ${hand} is casually holding the product. The setting is ${bgPrompt}.

Photography rules — follow all of these strictly:
- Shot on iPhone 10, rear camera, natural available light only — no flash, no ring light, no studio lighting
- Slightly imperfect, off-center composition — like someone grabbed their phone and shot it spontaneously
- Subtle natural color temperature, true-to-life tones — no HDR, no oversaturation, no AI color grading
- Faint natural ISO noise/grain visible, consistent with phone camera in ambient light
- Soft background blur from portrait mode (f/1.8 equivalent) — shallow depth of field
- The product branding, labels, and packaging must be clearly readable and unchanged
- Candid, unposed energy — this looks like it came from someone's Instagram story or TikTok
- No watermarks, no text overlays, no graphic elements
${customInstructions ? `\nModel appearance details: ${customInstructions}` : ''}

The final image must be completely indistinguishable from real organic social media content posted by an everyday customer. Portrait orientation.`
}
