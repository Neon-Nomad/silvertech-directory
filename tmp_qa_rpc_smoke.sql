BEGIN;

DO $$
DECLARE
  v_question_id uuid;
  v_owner_id uuid;
  v_answer_id uuid;
  v_allowed boolean;
  v_reason text;
  v_answers_this_month integer;
  v_plan text;
  v_premium_facility_id uuid;
  v_premium_owner_id uuid;
  v_free_facility_id uuid;
  v_free_owner_id uuid;
  v_faq_id uuid;
BEGIN
  -- pick a question for an owned facility
  SELECT fq.id, f.owner_id
  INTO v_question_id, v_owner_id
  FROM facility_questions fq
  JOIN facilities f ON f.id = fq.facility_id
  WHERE f.owner_id IS NOT NULL
  ORDER BY fq.created_at DESC
  LIMIT 1;

  IF v_question_id IS NULL OR v_owner_id IS NULL THEN
    RAISE NOTICE 'SKIP: No owned facility questions found for answer RPC smoke test.';
  ELSE
    PERFORM set_config('request.jwt.claim.sub', v_owner_id::text, true);
    PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

    SELECT allowed, reason, answers_this_month, plan
    INTO v_allowed, v_reason, v_answers_this_month, v_plan
    FROM can_operator_answer(v_question_id);

    RAISE NOTICE 'can_operator_answer => allowed=%, reason=%, answers_this_month=%, plan=%',
      v_allowed, v_reason, v_answers_this_month, v_plan;

    BEGIN
      SELECT submit_operator_answer(v_question_id, 'Smoke test answer from automation') INTO v_answer_id;
      RAISE NOTICE 'submit_operator_answer inserted id=%', v_answer_id;
      DELETE FROM facility_answers WHERE id = v_answer_id;
      RAISE NOTICE 'submit_operator_answer cleanup done for id=%', v_answer_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'submit_operator_answer failed: %', SQLERRM;
    END;
  END IF;

  -- premium FAQ path
  SELECT f.id, f.owner_id
  INTO v_premium_facility_id, v_premium_owner_id
  FROM facilities f
  JOIN user_profiles up ON up.id = f.owner_id
  WHERE up.plan IN ('featured','priority','lead_suite')
  ORDER BY f.created_at DESC
  LIMIT 1;

  IF v_premium_facility_id IS NOT NULL THEN
    PERFORM set_config('request.jwt.claim.sub', v_premium_owner_id::text, true);
    PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

    BEGIN
      SELECT submit_official_faq(
        v_premium_facility_id,
        'Smoke test FAQ question?',
        'Smoke test FAQ answer.'
      ) INTO v_faq_id;
      RAISE NOTICE 'submit_official_faq inserted id=%', v_faq_id;
      DELETE FROM facility_faqs WHERE id = v_faq_id;
      RAISE NOTICE 'submit_official_faq cleanup done for id=%', v_faq_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'submit_official_faq (premium) failed: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'SKIP: No premium-owned facilities found for positive FAQ RPC path.';
  END IF;

  -- free FAQ denial path
  SELECT f.id, f.owner_id
  INTO v_free_facility_id, v_free_owner_id
  FROM facilities f
  JOIN user_profiles up ON up.id = f.owner_id
  WHERE COALESCE(up.plan, 'free') = 'free'
  ORDER BY f.created_at DESC
  LIMIT 1;

  IF v_free_facility_id IS NOT NULL THEN
    PERFORM set_config('request.jwt.claim.sub', v_free_owner_id::text, true);
    PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

    BEGIN
      PERFORM submit_official_faq(
        v_free_facility_id,
        'Should fail',
        'Should fail for free plan'
      );
      RAISE NOTICE 'ERROR: submit_official_faq unexpectedly allowed free plan.';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'submit_official_faq (free) correctly rejected: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'SKIP: No free-owned facilities found for FAQ denial path.';
  END IF;
END
$$;

ROLLBACK;
