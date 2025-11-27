export interface StateContent {
    name: string;
    abbreviation: string;
    overview: {
        title: string;
        content: string;
        bullets: string[];
    };
    licensing: {
        authority: string;
        division: string;
        website: string;
        searchUrl: string;
        regulations: string;
        hotline: string;
    };
    requirements: {
        admission: {
            allowed: string[];
            prohibited: string[];
        };
        staffing: string[];
    };
    medication: {
        allowed: string[];
        prohibited: string[];
    };
    eviction: {
        noticeDays: number;
        validReasons: string[];
        rights: string[];
    };
    memoryCare: {
        requirements: string[];
    };
    financialAssistance: {
        programs: Array<{
            name: string;
            description: string;
            coverage: string[];
            eligibility: string[];
            counties?: string[];
            contactUrl?: string;
        }>;
    };
    complaints: {
        methods: Array<{
            name: string;
            contact: string;
        }>;
        scope: string[];
    };
    legalNotices: string[];
    faqs: Array<{
        question: string;
        answer: string;
    }>;
    seo: {
        title: string;
        description: string;
        schema: any;
    };
    capitalCoordinates?: {
        lat: number;
        lng: number;
    };
}

export const stateContent: Record<string, StateContent> = {
    california: {
        name: "California",
        abbreviation: "CA",
        overview: {
            title: "Assisted Living in California",
            content: "California does not license assisted living under the name “Assisted Living.” Instead, facilities are regulated as Residential Care Facilities for the Elderly (RCFE). Roughly 7,400 RCFEs operate in the state, ranging from boutique 6-bed Board and Care homes to large corporate assisted living campuses.",
            bullets: [
                "Boutique 6 bed Board and Care homes",
                "Large corporate assisted living campuses",
                "Dementia and memory care units",
                "Hybrid Independent + Assisted campuses",
                "Continuing Care Retirement Communities (CCRCs)"
            ]
        },
        licensing: {
            authority: "California Department of Social Services (CDSS)",
            division: "Community Care Licensing Division (CCLD)",
            website: "https://www.cdss.ca.gov",
            searchUrl: "https://www.ccld.dss.ca.gov/carefacilitysearch",
            regulations: "Title 22, Division 6, Chapter 8",
            hotline: "1-844-538-8766"
        },
        requirements: {
            admission: {
                allowed: [
                    "Need help with ADLs (bathing, dressing, toileting)",
                    "Have dementia needs",
                    "Need medication management",
                    "Need supervision for safety"
                ],
                prohibited: [
                    "24 hour skilled nursing",
                    "Ongoing IV therapy",
                    "Stage 3 or 4 pressure ulcers",
                    "Oxygen administration without assistance",
                    "Tube feeding",
                    "Catheters that require skilled care"
                ]
            },
            staffing: [
                "Administrator on duty",
                "Direct care staff sufficient to meet resident needs",
                "Dementia training",
                "First aid certification",
                "Annual training hours",
                "Criminal background checks"
            ]
        },
        medication: {
            allowed: [
                "Opening bottles",
                "Bringing meds to residents",
                "Offering water",
                "Observing intake",
                "Documenting administration"
            ],
            prohibited: [
                "Injecting",
                "Preparing doses",
                "Deciding whether to give or withhold meds"
            ]
        },
        eviction: {
            noticeDays: 30,
            validReasons: [
                "Non payment",
                "Dangerous behavior",
                "Facility cannot meet needs",
                "Closure of facility",
                "Non compliance with care plan"
            ],
            rights: [
                "The right to appeal",
                "The right to a safe discharge",
                "The right to stay unless legally transferred"
            ]
        },
        memoryCare: {
            requirements: [
                "Have secured perimeters",
                "Provide dementia specific training",
                "Offer appropriate activity programming",
                "Follow Title 22 dementia regulations",
                "Maintain staffing levels suited to cognitive needs"
            ]
        },
        financialAssistance: {
            programs: [
                {
                    name: "Assisted Living Waiver Program (ALW)",
                    description: "Medi-Cal funded program available in select counties.",
                    coverage: [
                        "Room and board subsidy",
                        "Personal care",
                        "Medication assistance",
                        "Dementia care",
                        "Activities",
                        "ADL support"
                    ],
                    eligibility: [
                        "Must qualify for Medi-Cal",
                        "Must require assisted living at nursing home level of care",
                        "Must reside in a participating county",
                        "Must move into a participating ALW facility"
                    ],
                    counties: [
                        "Los Angeles", "Sacramento", "Riverside", "San Bernardino",
                        "San Diego", "Alameda", "Contra Costa", "Sonoma"
                    ],
                    contactUrl: "https://www.dhcs.ca.gov/services/ltc/Pages/AssistedLivingWaiver.aspx"
                }
            ]
        },
        complaints: {
            methods: [
                { name: "CDSS Complaint Hotline", contact: "1-844-538-8766" },
                { name: "Local Regional Office", contact: "Submit online or call directly" },
                { name: "Long Term Care Ombudsman", contact: "1-800-231-4024" }
            ],
            scope: [
                "Abuse", "Neglect", "Poor care", "Injury",
                "Staffing issues", "Medication errors", "Illegal evictions"
            ]
        },
        legalNotices: [
            "Admission Agreement",
            "Emergency plans",
            "License on display",
            "Administrator name",
            "Staffing plan",
            "Resident rights",
            "Grievance procedures"
        ],
        faqs: [
            {
                question: "How do I check if a California assisted living facility is licensed?",
                answer: "Use the CDSS facility search tool at https://www.ccld.dss.ca.gov/carefacilitysearch."
            },
            {
                question: "Does Medi-Cal pay for assisted living?",
                answer: "Not directly. Only through the Assisted Living Waiver (ALW) program in participating counties."
            },
            {
                question: "What is a Board and Care home?",
                answer: "A small RCFE with 6 or fewer residents, often in a residential home setting."
            },
            {
                question: "Can a facility evict my parent?",
                answer: "Only under specific legal conditions like non-payment or if the facility can no longer meet their needs, and they must provide 30 days notice."
            },
            {
                question: "Is memory care different than assisted living?",
                answer: "Yes. Memory care units require secured perimeters, specific dementia training for staff, and specialized activity programming."
            }
        ],
        seo: {
            title: "Assisted Living in California | Complete Guide & Directory",
            description: "Full guide to assisted living in California. Licensing rules, RCFE laws, Medi-Cal Assisted Living Waiver, resident rights, complaints, inspections, and how to choose the right facility.",
            schema: {
                "@context": "https://schema.org/",
                "@type": "WebPage",
                "name": "Assisted Living in California",
                "description": "Full guide to assisted living in California. Licensing rules, RCFE laws, Medi Cal Assisted Living Waiver, resident rights, complaints, inspections, and how to choose the right facility.",
                "url": "https://silvertechdirectory.com/assisted-living/california",
                "about": {
                    "@type": "State",
                    "name": "California"
                }
            }
        }
    },
    capitalCoordinates: {
        lat: 38.5816,
        lng: -121.4944
    }
};
