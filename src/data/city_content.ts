export interface CityRichContent {
    intro: string;
    demographics: {
        seniorPopulation: string;
        averageAge: string;
        costOfLiving: string;
    };
    hospitals: string[];
    localResources: string[];
    history?: string;
}

export const cityContent: Record<string, CityRichContent> = {
    "indianapolis-in": {
        intro: `
      <p class="mb-4">Indianapolis, the bustling capital of Indiana, offers a unique blend of Midwestern hospitality and big-city amenities, making it an attractive destination for seniors. Known as the "Crossroads of America," Indy provides easy access to world-class healthcare, cultural attractions like the Indianapolis Museum of Art, and a vibrant sports scene.</p>
      <p>For families seeking assisted living, Indianapolis presents a wide array of options, from historic communities in Meridian-Kessler to modern developments in the suburbs. The city's relatively low cost of living compared to national averages allows seniors to stretch their retirement savings further without compromising on quality of care.</p>
    `,
        demographics: {
            seniorPopulation: "12%",
            averageAge: "34",
            costOfLiving: "8% lower than national avg"
        },
        hospitals: [
            "IU Health Methodist Hospital",
            "Ascension St. Vincent Indianapolis",
            "Community Hospital North"
        ],
        localResources: [
            "CICOA Aging & In-Home Solutions",
            "Indianapolis Senior Center",
            "John H. Boner Community Center"
        ]
    },
    "san-diego-ca": {
        intro: `
      <p class="mb-4">San Diego is widely considered one of the finest places to retire in the United States, thanks to its idyllic year-round climate and laid-back coastal lifestyle. With over 70 miles of coastline, seniors here enjoy a high quality of life that encourages outdoor activity and social engagement.</p>
      <p>The assisted living landscape in San Diego is diverse, ranging from luxury resort-style communities in La Jolla to intimate board and care homes in residential neighborhoods. While the cost of living is higher, the access to top-tier medical facilities like UC San Diego Health and the sheer variety of senior-focused amenities make it a premier choice for aging in place.</p>
    `,
        demographics: {
            seniorPopulation: "14%",
            averageAge: "35",
            costOfLiving: "44% higher than national avg"
        },
        hospitals: [
            "UC San Diego Health",
            "Scripps Memorial Hospital La Jolla",
            "Sharp Memorial Hospital"
        ],
        localResources: [
            "Gary and Mary West Senior Wellness Center",
            "Serving Seniors",
            "ElderHelp of San Diego"
        ]
    },
    "los-angeles-ca": {
        intro: `
      <p class="mb-4">Los Angeles offers a vibrant and diverse environment for seniors who want to remain close to the cultural heartbeat of the world. From the quiet, leafy streets of Brentwood to the historic charm of Pasadena, LA's assisted living options are as varied as its neighborhoods.</p>
      <p>Seniors in Los Angeles benefit from access to some of the nation's best hospitals, including Cedars-Sinai and UCLA Medical Center. The city's vast network of senior centers and cultural institutions ensures that there is always something to do, whether it's visiting the Getty Center or enjoying a walk in Griffith Park.</p>
    `,
        demographics: {
            seniorPopulation: "11%",
            averageAge: "36",
            costOfLiving: "50% higher than national avg"
        },
        hospitals: [
            "Cedars-Sinai Medical Center",
            "UCLA Medical Center",
            "Keck Hospital of USC"
        ],
        localResources: [
            "Los Angeles Department of Aging",
            "St. Barnabas Senior Services",
            "ONEgeneration Senior Enrichment Center"
        ]
    },
    "san-francisco-ca": {
        intro: `
      <p class="mb-4">San Francisco offers a unique urban retirement experience with its iconic hills, Victorian architecture, and world-class dining. For seniors who value walkability, culture, and diversity, the City by the Bay is unmatched.</p>
      <p>Assisted living in San Francisco tends to be more upscale, often located in renovated historic buildings or modern high-rises. Residents have access to UCSF Medical Center, consistently ranked among the top hospitals in the nation.</p>
    `,
        demographics: {
            seniorPopulation: "15%",
            averageAge: "38",
            costOfLiving: "80% higher than national avg"
        },
        hospitals: [
            "UCSF Medical Center",
            "California Pacific Medical Center",
            "Saint Francis Memorial Hospital"
        ],
        localResources: [
            "Department of Disability and Aging Services",
            "San Francisco Senior Center",
            "Curry Senior Center"
        ]
    },
    "sacramento-ca": {
        intro: `
      <p class="mb-4">As the state capital, Sacramento provides a more relaxed pace of life compared to its coastal counterparts, along with a more affordable cost of living. The city is known for its tree-lined streets, farm-to-fork cuisine, and rich history.</p>
      <p>Sacramento has a high concentration of quality assisted living facilities and board and care homes. Its central location offers easy access to both the Sierra Nevada mountains and the Bay Area, making it a convenient hub for visiting family.</p>
    `,
        demographics: {
            seniorPopulation: "13%",
            averageAge: "34",
            costOfLiving: "20% higher than national avg"
        },
        hospitals: [
            "UC Davis Medical Center",
            "Sutter Medical Center",
            "Mercy General Hospital"
        ],
        localResources: [
            "Agency on Aging Area 4",
            "Hart Senior Center",
            "Sacramento County Department of Human Assistance"
        ]
    },
    "fort-wayne-in": {
        intro: `
      <p class="mb-4">Fort Wayne is a family-friendly city that prides itself on its affordability and strong sense of community. It has been recognized as one of the best places to retire due to its low cost of living and high quality of healthcare.</p>
      <p>Seniors in Fort Wayne can choose from a variety of assisted living communities that offer a high standard of care at a fraction of the cost found in larger cities. The Parkview Health system is a major asset to the region.</p>
    `,
        demographics: {
            seniorPopulation: "14%",
            averageAge: "35",
            costOfLiving: "15% lower than national avg"
        },
        hospitals: [
            "Parkview Regional Medical Center",
            "Lutheran Hospital",
            "St. Joseph Hospital"
        ],
        localResources: [
            "Aging & In-Home Services of Northeast Indiana",
            "Fort Wayne Community Center",
            "Life Care Center of Fort Wayne"
        ]
    },
    "evansville-in": {
        intro: `
      <p class="mb-4">Located on the banks of the Ohio River, Evansville serves as the commercial and medical hub for the tri-state area. It offers a small-town feel with the amenities of a larger city, including a vibrant arts district and riverfront parks.</p>
      <p>Assisted living in Evansville is known for its personal touch and affordability. The Deaconess Health System provides comprehensive geriatric care, ensuring seniors have access to excellent medical services close to home.</p>
    `,
        demographics: {
            seniorPopulation: "16%",
            averageAge: "37",
            costOfLiving: "12% lower than national avg"
        },
        hospitals: [
            "Deaconess Hospital",
            "St. Vincent Evansville",
            "Select Specialty Hospital"
        ],
        localResources: [
            "SWIRCA & More",
            "Carver Community Organization",
            "Evansville Rescue Mission"
        ]
    }
};
