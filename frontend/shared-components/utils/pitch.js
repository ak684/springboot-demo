export const PITCH_PLACEHOLDERS = {
  description: 'Your mission goes here',
  ventureDescription: 'Description goes here',
  impactDescription: 'Description goes here',
  impactInspiration: 'Inspirational quote goes here',
  outputUnits: 'Products/services/activities go here',
  change: 'Change goes here',
  innovation: 'Innovation goes here',
  stakeholders: 'Stakeholders go here',
}

export const pitchGenerated = (venture) => !!venture.pitchSettings.pitchId && !!venture.pitchSettings.description
  && venture.impacts.every(i => !!i.pitchDescription && !!i.pitchInspiration);

export const PITCH_COLORS = ['#203E5C', '#146EC7', '#1F7355', '#855186'];
