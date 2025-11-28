import { CityRichContent } from '@/src/data/city_content';

const INTRO_TEMPLATES = [
    (city: string, state: string) => `Finding the right assisted living community in ${city}, ${state} can be a journey, but you don't have to do it alone. ${city} offers a variety of senior care options designed to meet different needs and budgets.`,
    (city: string, state: string) => `Welcome to our guide for assisted living in ${city}, ${state}. Whether you are looking for a vibrant community with active social calendars or a quiet, home-like setting, ${city} has something to offer.`,
    (city: string, state: string) => `Navigating senior care options in ${city}, ${state} requires having the right information. Our directory lists verified facilities to help you make an informed decision for yourself or your loved one.`
];

const COST_TEMPLATES = [
    (city: string) => `Costs in ${city} vary depending on the level of care required and the amenities offered. It's important to ask about all-inclusive pricing versus fee-for-service models when touring facilities.`,
    (city: string) => `When budgeting for care in ${city}, consider that prices often reflect the location, room size, and care ratio. Many families use a combination of private funds, long-term care insurance, and VA benefits.`
];

export const generateCityContent = (city: string, state: string, facilityCount: number): CityRichContent => {
    // Deterministic random selection based on city name length to keep it stable per city
    const seed = city.length;
    const introTemplate = INTRO_TEMPLATES[seed % INTRO_TEMPLATES.length];
    const costTemplate = COST_TEMPLATES[seed % COST_TEMPLATES.length];

    const generatedIntro = `
    <p class="mb-4">${introTemplate(city, state)}</p>
    <p class="mb-4">We have identified ${facilityCount} licensed facilities in the ${city} area. These communities are regulated by the state to ensure safety and quality of care standards are met.</p>
    <p>${costTemplate(city)}</p>
  `;

    return {
        intro: generatedIntro,
        demographics: {
            seniorPopulation: "N/A",
            averageAge: "N/A",
            costOfLiving: "N/A"
        },
        hospitals: [],
        localResources: []
    };
};
