// Mock review templates and data for generating realistic facility reviews
export interface Review {
    id: string;
    reviewerName: string;
    rating: number;
    date: string;
    text: string;
    helpfulCount: number;
}

// Reviewer names pool
const REVIEWER_NAMES = [
    "Sarah M.", "John D.", "Emily R.", "Michael B.", "Jennifer L.",
    "David W.", "Lisa K.", "Robert H.", "Patricia G.", "James T.",
    "Mary S.", "Christopher P.", "Jessica F.", "Daniel C.", "Nancy V.",
    "Matthew A.", "Karen E.", "Anthony J.", "Linda N.", "Mark Z."
];

// Review templates organized by rating
const REVIEW_TEMPLATES = {
    5: [
        "Exceptional care and attention. The staff goes above and beyond to ensure comfort and safety. The activities program keeps residents engaged, and the dining options are restaurant-quality. Highly recommend!",
        "We couldn't be happier with our decision. The community is warm and welcoming, and the caregivers are truly compassionate. Mom has made wonderful friends and loves the daily activities.",
        "Outstanding facility with top-notch amenities. The medical staff is professional and attentive. Beautiful grounds and well-maintained common areas. Worth every penny.",
        "Five stars all around! Clean, safe, and caring environment. Regular family updates keep us informed. The activities coordinator does an amazing job keeping everyone engaged.",
        "Absolutely wonderful experience. Dad has thrived here - his health has improved and he's happier than ever. The staff treats residents like family."
    ],
    4: [
        "Very good overall experience. Staff is caring and professional. Minor issues with meal variety, but generally satisfied with the level of care provided.",
        "Solid choice for senior living. Clean facilities, friendly staff, and good activities. Could use some updates to common areas, but the care is excellent.",
        "Great community with a few areas for improvement. The nursing staff is fantastic, though administrative processes could be streamlined. Would recommend.",
        "Pleased with the care our family member receives. Good communication from staff and nice amenities. Some activities could be more varied, but overall positive.",
        "Quality facility with attentive staff. The dining options are good, though not exceptional. Appreciate the cleanliness and safety measures in place."
    ],
    3: [
        "Decent facility with room for improvement. Staff turnover can be an issue, but current team is trying their best. Adequate activities and dining options.",
        "Average experience overall. Some days are better than others. The facility is clean but could use modernization. Care is acceptable but inconsistent.",
        "Mixed feelings about this facility. Good points include safety and cleanliness. Areas needing improvement: staff communication and activity variety.",
        "Okay for the price point. Not the most impressive amenities, but basic needs are met. Some staff members are excellent, others need more training.",
        "Middle-of-the-road facility. Acceptable care with some concerns about responsiveness. Would be nice to see more engagement activities."
    ],
    2: [
        "Disappointed with several aspects. Staff seems overwhelmed and understaffed. Facilities need updates. Had to address concerns multiple times before action was taken.",
        "Below expectations for this price range. Communication could be much better. Some staff are caring, but overall experience has been frustrating.",
        "Concerns about staffing levels and responsiveness. Facilities are dated. Had hoped for better based on initial tour. Considering other options.",
        "Not impressed. Several maintenance issues that took too long to address. Food quality is subpar. Would not recommend unless improvements are made."
    ],
    1: [
        "Very concerning experience. Multiple issues with care quality and facility maintenance. Would not recommend. Looking to transfer to another facility.",
        "Extremely disappointed. Safety concerns not adequately addressed. Poor communication from management. Seeking alternative placement."
    ]
};

// Generate deterministic reviews for a facility based on its ID
export const generateReviews = (facilityId: string, facilityName: string): Review[] => {
    const numericId = parseInt(facilityId.replace(/\D/g, '')) || 0;
    const reviewCount = 3 + (numericId % 5); // 3-7 reviews per facility

    // Determine overall rating (weighted towards positive)
    const avgRating = 3.5 + ((numericId % 15) / 10); // Range: 3.5-5.0

    const reviews: Review[] = [];

    for (let i = 0; i < reviewCount; i++) {
        const seed = numericId + i;

        // Determine this review's rating (cluster around avg, with variation)
        let rating: number;
        const variance = (seed % 3) - 1; // -1, 0, or 1
        rating = Math.round(avgRating + variance);
        rating = Math.max(1, Math.min(5, rating)); // Clamp between 1-5

        // Select reviewer name deterministically
        const nameIndex = seed % REVIEWER_NAMES.length;
        const reviewerName = REVIEWER_NAMES[nameIndex];

        // Select review template deterministically
        const templates = REVIEW_TEMPLATES[rating as keyof typeof REVIEW_TEMPLATES];
        const templateIndex = seed % templates.length;
        const text = templates[templateIndex];

        // Generate date (within last 18 months)
        const daysAgo = (seed % 540) + 1; // 1-540 days ago (18 months)
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);

        // Generate helpful count
        const helpfulCount = seed % 25;

        reviews.push({
            id: `${facilityId}-review-${i}`,
            reviewerName,
            rating,
            date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
            text,
            helpfulCount
        });
    }

    // Sort by date (most recent first)
    reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return reviews;
};

// Calculate rating distribution for a facility
export const getRatingDistribution = (reviews: Review[]) => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
        distribution[review.rating as keyof typeof distribution]++;
    });

    const total = reviews.length;
    return {
        5: { count: distribution[5], percentage: (distribution[5] / total) * 100 },
        4: { count: distribution[4], percentage: (distribution[4] / total) * 100 },
        3: { count: distribution[3], percentage: (distribution[3] / total) * 100 },
        2: { count: distribution[2], percentage: (distribution[2] / total) * 100 },
        1: { count: distribution[1], percentage: (distribution[1] / total) * 100 }
    };
};

// Calculate average rating
export const calculateAverageRating = (reviews: Review[]): number => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10; // Round to 1 decimal
};
