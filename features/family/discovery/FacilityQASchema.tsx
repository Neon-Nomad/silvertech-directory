import React from 'react';
import { Helmet } from 'react-helmet-async';
import { FacilityQuestion } from '@/src/hooks/useFacilityQuestions';
import { FacilityFaq } from '@/src/hooks/useFacilityFaqs';
import { FEATURE_FLAGS } from '@/src/config/featureFlags';
import { trackEvent } from '@/src/utils/analytics';
import { buildFacilityCanonicalUrl } from '@/src/utils/facilityPath';

interface FacilityQASchemaProps {
  facilityId: string;
  questions: FacilityQuestion[];
  officialFaqs: FacilityFaq[];
  isPremiumFacility: boolean;
}

export const FacilityQASchema: React.FC<FacilityQASchemaProps> = ({
  facilityId,
  questions,
  officialFaqs,
  isPremiumFacility,
}) => {
  const questionsWithAnswers = questions.filter((q) => q.answers.length > 0);
  const hasQAPage = questionsWithAnswers.length > 0;
  const hasFAQPage = FEATURE_FLAGS.qa_premium_faq_schema && isPremiumFacility && officialFaqs.length > 0;
  if (!hasQAPage && !hasFAQPage) return null;

  React.useEffect(() => {
    if (!hasFAQPage) return;
    trackEvent('qa_faq_schema_rendered', { facilityId });
  }, [hasFAQPage, facilityId]);

  const canonicalUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : buildFacilityCanonicalUrl({ id: facilityId });

  const qaSchema = {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: questionsWithAnswers.map((question) => ({
      '@type': 'Question',
      name: question.question_text,
      acceptedAnswer: {
        '@type': 'Answer',
        text: question.answers[0]?.answer_text || '',
        dateCreated: question.answers[0]?.answer_date || undefined,
        url: canonicalUrl,
      },
      dateCreated: question.question_date,
      url: canonicalUrl,
    })),
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: officialFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question_text,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer_text,
      },
    })),
  };

  return (
    <Helmet>
      {hasQAPage && <script type="application/ld+json">{JSON.stringify(qaSchema)}</script>}
      {hasFAQPage && <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>}
    </Helmet>
  );
};
