export const BACKGROUNDS = [
  {
    id: 'BEDROOM',
    label: 'Bedroom',
    prompt: 'a cozy well-decorated bedroom with soft natural lighting, pillows and home decor visible in the background',
  },
  {
    id: 'KITCHEN',
    label: 'Kitchen',
    prompt: 'a modern clean kitchen with countertops, marble surfaces, and warm natural window light',
  },
  {
    id: 'CAFE',
    label: 'Cafe',
    prompt: 'a trendy café with wooden tables, coffee cups, warm ambient lighting and soft bokeh background',
  },
  {
    id: 'OUTDOOR',
    label: 'Outdoor',
    prompt: 'an outdoor setting with natural sunlight, lush greenery or a stylish urban street backdrop',
  },
  {
    id: 'TABLE',
    label: 'Table',
    prompt: 'a clean minimal table surface with a soft neutral background and subtle natural shadows',
  },
  {
    id: 'DRUGSTORE',
    label: 'Drugstore',
    prompt: 'a pharmacy or health & beauty store setting with product shelves visible in the background',
  },
  {
    id: 'LIVING_ROOM',
    label: 'Living Room',
    prompt: 'a comfortable modern living room with a cozy sofa, indoor plants, and warm ambient lighting',
  },
  {
    id: 'OFFICE_DESK',
    label: 'Office Desk',
    prompt: 'a clean professional office desk setup with a laptop, notebook, and minimal workspace accessories',
  },
  {
    id: 'GYM',
    label: 'Gym',
    prompt: 'a modern gym or fitness center with weights and exercise equipment visible in the background',
  },
  {
    id: 'CAR',
    label: 'Car',
    prompt: 'inside a clean modern car interior with natural light through windows and the dashboard partially visible',
  },
  {
    id: 'OFFICE',
    label: 'Office',
    prompt: 'a bright modern open-plan office environment with a clean, professional setting',
  },
]

const HAND_DESCRIPTIONS = {
  neutral: 'a hand',
  female: 'an elegant female hand with natural nails',
  male: 'a masculine male hand',
}

export function buildPrompt(handModel, backgroundId, customInstructions) {
  const hand = HAND_DESCRIPTIONS[handModel] || HAND_DESCRIPTIONS.neutral
  const bg = BACKGROUNDS.find((b) => b.id === backgroundId)
  const bgPrompt = bg?.prompt || 'a clean neutral setting'

  return `You are a professional product photographer creating lifestyle content for TikTok and Instagram.

Using the provided product image, create a photorealistic lifestyle photo where:
- The product is naturally held by ${hand}
- The setting is: ${bgPrompt}
- The product's exact branding, labels, colors, and packaging are fully preserved and clearly visible
- The lighting is natural and flattering for the environment
- The composition looks authentic and candid, like real social media lifestyle content
- Portrait orientation (vertical, for mobile viewing)
${customInstructions ? `\nAdditional creative direction: ${customInstructions}` : ''}

Generate a single lifestyle product photo. No text overlays. No graphics. Natural and authentic.`
}
