// This service folder is structured to hold API logic for future integrations
// such as accessing the Gemini API for the AI Move-In Engine (Layer 2)
// or fetching real-time real estate data for the Intelligence Platform (Layer 4).

export const API_CONFIG = {
  baseUrl: process.env.API_URL || 'https://api.silvertechdirectory.com',
  version: 'v1'
};
