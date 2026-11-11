# Category cleanup reconciliation: batch-001-pilot.tsv

Before: `origin/main`. After: working tree. Generated 2026-11-11T01:54:35.449Z.

**Result: every difference is attributed to an approved batch record; no unexpected differences.**

| Measure | Before | After | Change |
|---|---|---|---|
| Registry identities | 78239 | 78239 | 0 |
| Live canonical pages | 78239 | 78218 | -21 |
| UUID map rows | 78239 | 78218 | -21 (removed 23, added 2, changed 0) |
| Legacy 301 sources | 77720 | 77705 | -15 (to 410: 15, retargeted: 8) |
| Redirect rules | 155623 | 155669 | +92 / -46 |

## Every changed identity

| Decision | Facility | Old URL | Now | Evidence |
|---|---|---|---|---|
| reclassify | Peregrine Crossgate | /adult-day-services/new-york/albany/peregrine-crossgate-196215347/ | 301 → /assisted-living/new-york/albany/peregrine-crossgate-196215347/ | NY DOH Health Facility General Information 14609: Enriched Housing Program |
| reclassify | Peregrine Shaker | /adult-day-services/new-york/albany/peregrine-shaker-499366096/ | 301 → /assisted-living/new-york/albany/peregrine-shaker-499366096/ | NY DOH Health Facility General Information 14610: Enriched Housing Program |
| consolidate | The Villas at Dominican Village | /adult-day-services/new-york/amityville/the-villas-at-dominican-village-3608647698/ | 301 → /assisted-living/new-york/amityville/dominican-village-enriched-housing-program-1-3709202207/ | NY DOH Health Facility General Information 15070: Enriched Housing Program |
| consolidate | Daughters of Sarah Nursing Center | /adult-day-services/new-york/albany/daughters-of-sarah-nursing-center-3614767261/ | 301 → /nursing-homes/new-york/albany/daughters-of-sarah-nursing-center-8983/ | NY DOH Health Facility General Information 22: Residential Health Care Facility - SNF |
| consolidate | Shaker Place Rehabilitation and Nursing Center | /adult-day-services/new-york/albany/shaker-place-rehabilitation-and-nursing-center-3821638911/ | 301 → /nursing-homes/new-york/albany/shaker-place-rehabilitation-and-nursing-center-8953/ | NY DOH Health Facility General Information 30: Residential Health Care Facility - SNF |
| consolidate | St. Margaret's Center | /adult-day-services/new-york/albany/st-margaret-s-center-1495317794/ | 301 → /nursing-homes/new-york/albany/st-margarets-center-9260/ | NY DOH Health Facility General Information 19: Residential Health Care Facility - SNF |
| consolidate | The Commons on St. Anthony, a Skilled Nursing & Short Term Rehabilitation Community | /assisted-living/new-york/auburn/the-commons-on-st-anthony-a-skilled-nursing-short-term-rehabilitation-community-651992568/ | 301 → /nursing-homes/new-york/auburn/the-commons-on-st-anthony-a-s-n-f-short-t-r-c-8916/ | NY DOH Health Facility General Information 92: Residential Health Care Facility - SNF |
| consolidate | Bridgewater Center for Rehabilitation & Nursing, LLC | /assisted-living/new-york/binghamton/bridgewater-center-for-rehabilitation-nursing-llc-2545159438/ | 301 → /nursing-homes/new-york/binghamton/bridgewater-center-for-rehab-nursing-l-l-c-8810/ | NY DOH Health Facility General Information 50: Residential Health Care Facility - SNF |
| retire | Adams Family Health Center | /adult-day-services/new-york/adams/adams-family-health-center-1027143968/ | 410 Gone | NY DOH Health Facility General Information 9727: Hospital Extension Clinic |
| retire | Caring Connections Llc | /adult-day-services/new-york/airmont/caring-connections-llc-1457106821/ | 410 Gone | NY DOH Health Facility General Information 13506: Licensed Home Care Services Agency |
| retire | Albany County Health Dept | /adult-day-services/new-york/albany/albany-county-health-dept-841886180/ | 410 Gone | NY DOH Health Facility General Information 8: Diagnostic and Treatment Center |
| retire | Allergy and Immunology Clinic of AMCH | /adult-day-services/new-york/albany/allergy-and-immunology-clinic-of-amch-3237620165/ | 410 Gone | NY DOH Health Facility General Information 10391: Hospital Extension Clinic |
| retire | Attentive Care Of Albany, Inc. | /adult-day-services/new-york/albany/attentive-care-of-albany-inc-2773549347/ | 410 Gone | NY DOH Health Facility General Information 12474: Licensed Home Care Services Agency |
| retire | Balanced Care Licensed Home Care Agency | /adult-day-services/new-york/albany/balanced-care-licensed-home-care-agency-672657275/ | 410 Gone | NY DOH Health Facility General Information 13171: Licensed Home Care Services Agency |
| retire | ALBANY JEWISH COMMUNITY CENTER | /assisted-living/new-york/albany/albany-jewish-community-center-3171846333/ | 410 Gone | NY OCFS Child Care Regulated Programs 39186: child care program type DCC |
| retire | ALBANY MED KIDS | /assisted-living/new-york/albany/albany-med-kids-2049345141/ | 410 Gone | NY OCFS Child Care Regulated Programs 541618: child care program type DCC |
| retire | CAPITAL MILESTONES CHILD CARE, INC. | /assisted-living/new-york/albany/capital-milestones-child-care-inc-1317863738/ | 410 Gone | NY OCFS Child Care Regulated Programs 762476: child care program type DCC |
| retire | CLUB FED CHILD CARE CENTER | /assisted-living/new-york/albany/club-fed-child-care-center-1732292829/ | 410 Gone | NY OCFS Child Care Regulated Programs 39167: child care program type DCC |
| retire | TRINITY ALLIANCE OF THE CAPITAL REGION, INC. ARBOR HILL CENTER | /assisted-living/new-york/albany/trinity-alliance-of-the-capital-region-inc-arbor-hill-center-2612421208/ | 410 Gone | NY OCFS Child Care Regulated Programs 45277: child care program type SACC |
| retire | TRINITY CENTER | /assisted-living/new-york/albany/trinity-center-1575397434/ | 410 Gone | NY OCFS Child Care Regulated Programs 44257: child care program type SACC |
| retire | RISSE AFTER SCHOOL PROGRAM AT ALBANY INTERNATIONAL ACADEMY | /assisted-living/new-york/albany/risse-after-school-program-at-albany-international-academy-3523341316/ | 410 Gone | source licence authority field : UNLICENSED: SCHOOL-RUN; name identifies a school |
| retire | 30234 PS 234 | /assisted-living/new-york/astoria/30234-ps-234-3296145851/ | 410 Gone | source licence authority field : UNLICENSED: SCHOOL-RUN; name identifies a school |
| retire | 07018 PS 18 | /assisted-living/new-york/bronx/07018-ps-18-2382236488/ | 410 Gone | source licence authority field : UNLICENSED: SCHOOL-RUN; name identifies a school |

## Legacy URLs changed

| Legacy URL | Before | After |
|---|---|---|
| /adult-day-services/new-york/adams/adams-family-health-center-313/ | 301 → /adult-day-services/new-york/adams/adams-family-health-center-1027143968/ | 410 Gone |
| /adult-day-services/new-york/airmont/caring-connections-llc-18153/ | 301 → /adult-day-services/new-york/airmont/caring-connections-llc-1457106821/ | 410 Gone |
| /adult-day-services/new-york/albany/albany-county-health-dept-30113/ | 301 → /adult-day-services/new-york/albany/albany-county-health-dept-841886180/ | 410 Gone |
| /adult-day-services/new-york/albany/allergy-and-immunology-clinic-of-amch-30150/ | 301 → /adult-day-services/new-york/albany/allergy-and-immunology-clinic-of-amch-3237620165/ | 410 Gone |
| /adult-day-services/new-york/albany/attentive-care-of-albany-inc-8980/ | 301 → /adult-day-services/new-york/albany/attentive-care-of-albany-inc-2773549347/ | 410 Gone |
| /adult-day-services/new-york/albany/balanced-care-licensed-home-care-agency-25944/ | 301 → /adult-day-services/new-york/albany/balanced-care-licensed-home-care-agency-672657275/ | 410 Gone |
| /assisted-living/new-york/albany/albany-jewish-community-center-1164/ | 301 → /assisted-living/new-york/albany/albany-jewish-community-center-3171846333/ | 410 Gone |
| /assisted-living/new-york/albany/albany-med-kids-8723/ | 301 → /assisted-living/new-york/albany/albany-med-kids-2049345141/ | 410 Gone |
| /assisted-living/new-york/albany/capital-milestones-child-care-inc-67103/ | 301 → /assisted-living/new-york/albany/capital-milestones-child-care-inc-1317863738/ | 410 Gone |
| /assisted-living/new-york/albany/club-fed-child-care-center-44615/ | 301 → /assisted-living/new-york/albany/club-fed-child-care-center-1732292829/ | 410 Gone |
| /assisted-living/new-york/albany/risse-after-school-program-at-albany-international-academy-60482/ | 301 → /assisted-living/new-york/albany/risse-after-school-program-at-albany-international-academy-3523341316/ | 410 Gone |
| /assisted-living/new-york/albany/trinity-alliance-of-the-capital-region-inc-arbor-hill-center-13370/ | 301 → /assisted-living/new-york/albany/trinity-alliance-of-the-capital-region-inc-arbor-hill-center-2612421208/ | 410 Gone |
| /assisted-living/new-york/albany/trinity-center-34017/ | 301 → /assisted-living/new-york/albany/trinity-center-1575397434/ | 410 Gone |
| /assisted-living/new-york/astoria/30234-ps-234-1014/ | 301 → /assisted-living/new-york/astoria/30234-ps-234-3296145851/ | 410 Gone |
| /assisted-living/new-york/bronx/07018-ps-18-17908/ | 301 → /assisted-living/new-york/bronx/07018-ps-18-2382236488/ | 410 Gone |
| /adult-day-services/new-york/albany/daughters-of-sarah-nursing-center-22090/ | 301 → /adult-day-services/new-york/albany/daughters-of-sarah-nursing-center-3614767261/ | 301 → /nursing-homes/new-york/albany/daughters-of-sarah-nursing-center-8983/ |
| /adult-day-services/new-york/albany/peregrine-crossgate-28537/ | 301 → /adult-day-services/new-york/albany/peregrine-crossgate-196215347/ | 301 → /assisted-living/new-york/albany/peregrine-crossgate-196215347/ |
| /adult-day-services/new-york/albany/peregrine-shaker-12265/ | 301 → /adult-day-services/new-york/albany/peregrine-shaker-499366096/ | 301 → /assisted-living/new-york/albany/peregrine-shaker-499366096/ |
| /adult-day-services/new-york/albany/shaker-place-rehabilitation-and-nursing-center-47120/ | 301 → /adult-day-services/new-york/albany/shaker-place-rehabilitation-and-nursing-center-3821638911/ | 301 → /nursing-homes/new-york/albany/shaker-place-rehabilitation-and-nursing-center-8953/ |
| /adult-day-services/new-york/albany/st-margaret-s-center-56334/ | 301 → /adult-day-services/new-york/albany/st-margaret-s-center-1495317794/ | 301 → /nursing-homes/new-york/albany/st-margarets-center-9260/ |
| /adult-day-services/new-york/amityville/the-villas-at-dominican-village-7169/ | 301 → /adult-day-services/new-york/amityville/the-villas-at-dominican-village-3608647698/ | 301 → /assisted-living/new-york/amityville/dominican-village-enriched-housing-program-1-3709202207/ |
| /assisted-living/new-york/auburn/the-commons-on-st-anthony-a-skilled-nursing-short-term-rehabilitation-community-84351/ | 301 → /assisted-living/new-york/auburn/the-commons-on-st-anthony-a-skilled-nursing-short-term-rehabilitation-community-651992568/ | 301 → /nursing-homes/new-york/auburn/the-commons-on-st-anthony-a-s-n-f-short-t-r-c-8916/ |
| /assisted-living/new-york/binghamton/bridgewater-center-for-rehabilitation-nursing-llc-74791/ | 301 → /assisted-living/new-york/binghamton/bridgewater-center-for-rehabilitation-nursing-llc-2545159438/ | 301 → /nursing-homes/new-york/binghamton/bridgewater-center-for-rehab-nursing-l-l-c-8810/ |

## Registry entries changed

- `adult-day-services/new-york/adams/adams-family-health-center-1027143968`: status **retired**
- `adult-day-services/new-york/airmont/caring-connections-llc-1457106821`: status **retired**
- `adult-day-services/new-york/albany/albany-county-health-dept-841886180`: status **retired**
- `adult-day-services/new-york/albany/allergy-and-immunology-clinic-of-amch-3237620165`: status **retired**
- `adult-day-services/new-york/albany/attentive-care-of-albany-inc-2773549347`: status **retired**
- `adult-day-services/new-york/albany/balanced-care-licensed-home-care-agency-672657275`: status **retired**
- `adult-day-services/new-york/albany/daughters-of-sarah-nursing-center-3614767261`: status **consolidated** → `nursing-homes/new-york/albany/daughters-of-sarah-nursing-center-8983`
- `adult-day-services/new-york/albany/peregrine-crossgate-196215347`: moved to `assisted-living/new-york/albany/peregrine-crossgate-196215347` (was `adult-day-services/new-york/albany/peregrine-crossgate-196215347`)
- `adult-day-services/new-york/albany/peregrine-shaker-499366096`: moved to `assisted-living/new-york/albany/peregrine-shaker-499366096` (was `adult-day-services/new-york/albany/peregrine-shaker-499366096`)
- `adult-day-services/new-york/albany/shaker-place-rehabilitation-and-nursing-center-3821638911`: status **consolidated** → `nursing-homes/new-york/albany/shaker-place-rehabilitation-and-nursing-center-8953`
- `adult-day-services/new-york/albany/st-margaret-s-center-1495317794`: status **consolidated** → `nursing-homes/new-york/albany/st-margarets-center-9260`
- `adult-day-services/new-york/amityville/the-villas-at-dominican-village-3608647698`: status **consolidated** → `assisted-living/new-york/amityville/dominican-village-enriched-housing-program-1-3709202207`
- `assisted-living/new-york/albany/albany-jewish-community-center-3171846333`: status **retired**
- `assisted-living/new-york/albany/albany-med-kids-2049345141`: status **retired**
- `assisted-living/new-york/albany/capital-milestones-child-care-inc-1317863738`: status **retired**
- `assisted-living/new-york/albany/club-fed-child-care-center-1732292829`: status **retired**
- `assisted-living/new-york/albany/risse-after-school-program-at-albany-international-academy-3523341316`: status **retired**
- `assisted-living/new-york/albany/trinity-alliance-of-the-capital-region-inc-arbor-hill-center-2612421208`: status **retired**
- `assisted-living/new-york/albany/trinity-center-1575397434`: status **retired**
- `assisted-living/new-york/astoria/30234-ps-234-3296145851`: status **retired**
- `assisted-living/new-york/auburn/the-commons-on-st-anthony-a-skilled-nursing-short-term-rehabilitation-community-651992568`: status **consolidated** → `nursing-homes/new-york/auburn/the-commons-on-st-anthony-a-s-n-f-short-t-r-c-8916`
- `assisted-living/new-york/binghamton/bridgewater-center-for-rehabilitation-nursing-llc-2545159438`: status **consolidated** → `nursing-homes/new-york/binghamton/bridgewater-center-for-rehab-nursing-l-l-c-8810`
- `assisted-living/new-york/bronx/07018-ps-18-2382236488`: status **retired**

## UUID map rows

- removed `adult-day-services/new-york/adams/adams-family-health-center-1027143968` (mapped:7415f019-ee74-48c5-98e1-f488bb299093)
- removed `adult-day-services/new-york/airmont/caring-connections-llc-1457106821` (mapped:583c2981-9db0-4206-8ea9-1ed8e36e64c0)
- removed `adult-day-services/new-york/albany/albany-county-health-dept-841886180` (mapped:358300b1-370f-4f19-98b3-095b7e819aac)
- removed `adult-day-services/new-york/albany/allergy-and-immunology-clinic-of-amch-3237620165` (mapped:4992af2c-14dc-44a5-a37a-30ff870fc37e)
- removed `adult-day-services/new-york/albany/attentive-care-of-albany-inc-2773549347` (mapped:de8d9d70-e314-4421-91b2-4965b3e85baa)
- removed `adult-day-services/new-york/albany/balanced-care-licensed-home-care-agency-672657275` (mapped:287de3ec-aca7-4b09-8fcc-83d7981f60be)
- removed `adult-day-services/new-york/albany/daughters-of-sarah-nursing-center-3614767261` (mapped:61f88735-d7f7-4e3f-a8ee-495faf57fe72)
- removed `adult-day-services/new-york/albany/peregrine-crossgate-196215347` (mapped:0bf186ef-03a5-4518-804f-b8a9cf81c1f2)
- removed `adult-day-services/new-york/albany/peregrine-shaker-499366096` (mapped:6c389d03-7db6-49d2-9607-3f885afbcaaf)
- removed `adult-day-services/new-york/albany/shaker-place-rehabilitation-and-nursing-center-3821638911` (mapped:593bb824-c1aa-49f4-9c87-866a8d0c9dbd)
- removed `adult-day-services/new-york/albany/st-margaret-s-center-1495317794` (mapped:e688d37e-d37a-449a-a53c-090e33dac4d6)
- removed `adult-day-services/new-york/amityville/the-villas-at-dominican-village-3608647698` (mapped:9cbea41e-7f6d-487b-b934-71d06cc7f07c)
- removed `assisted-living/new-york/albany/albany-jewish-community-center-3171846333` (mapped:c4fc2c53-4b77-4d07-8c47-2259fda0712b)
- removed `assisted-living/new-york/albany/albany-med-kids-2049345141` (mapped:50a2f2d0-9c1b-40d1-8b0d-710bbf148d44)
- removed `assisted-living/new-york/albany/capital-milestones-child-care-inc-1317863738` (mapped:d8ad410b-226a-4809-9770-21e679ac4909)
- removed `assisted-living/new-york/albany/club-fed-child-care-center-1732292829` (mapped:6457dca6-7e98-4f5a-97f3-44021603bc81)
- removed `assisted-living/new-york/albany/risse-after-school-program-at-albany-international-academy-3523341316` (mapped:137c18af-2898-4902-ac44-ec33881dae8d)
- removed `assisted-living/new-york/albany/trinity-alliance-of-the-capital-region-inc-arbor-hill-center-2612421208` (mapped:6b3818f0-2822-4ea5-a7da-fb28592086da)
- removed `assisted-living/new-york/albany/trinity-center-1575397434` (mapped:85fb79cb-7d55-49b8-ae9f-40146850f930)
- removed `assisted-living/new-york/astoria/30234-ps-234-3296145851` (mapped:0a47de07-873a-44b3-bf96-00b501219ef8)
- removed `assisted-living/new-york/auburn/the-commons-on-st-anthony-a-skilled-nursing-short-term-rehabilitation-community-651992568` (unresolved:)
- removed `assisted-living/new-york/binghamton/bridgewater-center-for-rehabilitation-nursing-llc-2545159438` (unresolved:)
- removed `assisted-living/new-york/bronx/07018-ps-18-2382236488` (mapped:e566f70a-8a8d-4590-b3f5-d1bc6d6d7752)
- added `assisted-living/new-york/albany/peregrine-crossgate-196215347` (mapped:0bf186ef-03a5-4518-804f-b8a9cf81c1f2)
- added `assisted-living/new-york/albany/peregrine-shaker-499366096` (mapped:6c389d03-7db6-49d2-9607-3f885afbcaaf)

## URL checks on https://deploy-preview-45--glowing-lily-72c7c7.netlify.app

141 of 141 passed.

| Group | URL | Expected | Got | Pass |
|---|---|---|---|---|
| reclassifyd page | /adult-day-services/new-york/albany/peregrine-crossgate-196215347/ | 301 → /assisted-living/new-york/albany/peregrine-crossgate-196215347/ | 301 → /assisted-living/new-york/albany/peregrine-crossgate-196215347/ | yes |
| legacy URL of moved page | /adult-day-services/new-york/albany/peregrine-crossgate-28537/ | 301 → /assisted-living/new-york/albany/peregrine-crossgate-196215347/ | 301 → /assisted-living/new-york/albany/peregrine-crossgate-196215347/ | yes |
| surviving page | /assisted-living/new-york/albany/peregrine-crossgate-196215347/ | 200 (self canonical) | 200 | yes |
| reclassifyd page | /adult-day-services/new-york/albany/peregrine-shaker-499366096/ | 301 → /assisted-living/new-york/albany/peregrine-shaker-499366096/ | 301 → /assisted-living/new-york/albany/peregrine-shaker-499366096/ | yes |
| legacy URL of moved page | /adult-day-services/new-york/albany/peregrine-shaker-12265/ | 301 → /assisted-living/new-york/albany/peregrine-shaker-499366096/ | 301 → /assisted-living/new-york/albany/peregrine-shaker-499366096/ | yes |
| surviving page | /assisted-living/new-york/albany/peregrine-shaker-499366096/ | 200 (self canonical) | 200 | yes |
| consolidated page | /adult-day-services/new-york/amityville/the-villas-at-dominican-village-3608647698/ | 301 → /assisted-living/new-york/amityville/dominican-village-enriched-housing-program-1-3709202207/ | 301 → /assisted-living/new-york/amityville/dominican-village-enriched-housing-program-1-3709202207/ | yes |
| legacy URL of moved page | /adult-day-services/new-york/amityville/the-villas-at-dominican-village-7169/ | 301 → /assisted-living/new-york/amityville/dominican-village-enriched-housing-program-1-3709202207/ | 301 → /assisted-living/new-york/amityville/dominican-village-enriched-housing-program-1-3709202207/ | yes |
| surviving page | /assisted-living/new-york/amityville/dominican-village-enriched-housing-program-1-3709202207/ | 200 (self canonical) | 200 | yes |
| consolidated page | /adult-day-services/new-york/albany/daughters-of-sarah-nursing-center-3614767261/ | 301 → /nursing-homes/new-york/albany/daughters-of-sarah-nursing-center-8983/ | 301 → /nursing-homes/new-york/albany/daughters-of-sarah-nursing-center-8983/ | yes |
| legacy URL of moved page | /adult-day-services/new-york/albany/daughters-of-sarah-nursing-center-22090/ | 301 → /nursing-homes/new-york/albany/daughters-of-sarah-nursing-center-8983/ | 301 → /nursing-homes/new-york/albany/daughters-of-sarah-nursing-center-8983/ | yes |
| surviving page | /nursing-homes/new-york/albany/daughters-of-sarah-nursing-center-8983/ | 200 (self canonical) | 200 | yes |
| consolidated page | /adult-day-services/new-york/albany/shaker-place-rehabilitation-and-nursing-center-3821638911/ | 301 → /nursing-homes/new-york/albany/shaker-place-rehabilitation-and-nursing-center-8953/ | 301 → /nursing-homes/new-york/albany/shaker-place-rehabilitation-and-nursing-center-8953/ | yes |
| legacy URL of moved page | /adult-day-services/new-york/albany/shaker-place-rehabilitation-and-nursing-center-47120/ | 301 → /nursing-homes/new-york/albany/shaker-place-rehabilitation-and-nursing-center-8953/ | 301 → /nursing-homes/new-york/albany/shaker-place-rehabilitation-and-nursing-center-8953/ | yes |
| surviving page | /nursing-homes/new-york/albany/shaker-place-rehabilitation-and-nursing-center-8953/ | 200 (self canonical) | 200 | yes |
| consolidated page | /adult-day-services/new-york/albany/st-margaret-s-center-1495317794/ | 301 → /nursing-homes/new-york/albany/st-margarets-center-9260/ | 301 → /nursing-homes/new-york/albany/st-margarets-center-9260/ | yes |
| legacy URL of moved page | /adult-day-services/new-york/albany/st-margaret-s-center-56334/ | 301 → /nursing-homes/new-york/albany/st-margarets-center-9260/ | 301 → /nursing-homes/new-york/albany/st-margarets-center-9260/ | yes |
| surviving page | /nursing-homes/new-york/albany/st-margarets-center-9260/ | 200 (self canonical) | 200 | yes |
| consolidated page | /assisted-living/new-york/auburn/the-commons-on-st-anthony-a-skilled-nursing-short-term-rehabilitation-community-651992568/ | 301 → /nursing-homes/new-york/auburn/the-commons-on-st-anthony-a-s-n-f-short-t-r-c-8916/ | 301 → /nursing-homes/new-york/auburn/the-commons-on-st-anthony-a-s-n-f-short-t-r-c-8916/ | yes |
| legacy URL of moved page | /assisted-living/new-york/auburn/the-commons-on-st-anthony-a-skilled-nursing-short-term-rehabilitation-community-84351/ | 301 → /nursing-homes/new-york/auburn/the-commons-on-st-anthony-a-s-n-f-short-t-r-c-8916/ | 301 → /nursing-homes/new-york/auburn/the-commons-on-st-anthony-a-s-n-f-short-t-r-c-8916/ | yes |
| surviving page | /nursing-homes/new-york/auburn/the-commons-on-st-anthony-a-s-n-f-short-t-r-c-8916/ | 200 (self canonical) | 200 | yes |
| consolidated page | /assisted-living/new-york/binghamton/bridgewater-center-for-rehabilitation-nursing-llc-2545159438/ | 301 → /nursing-homes/new-york/binghamton/bridgewater-center-for-rehab-nursing-l-l-c-8810/ | 301 → /nursing-homes/new-york/binghamton/bridgewater-center-for-rehab-nursing-l-l-c-8810/ | yes |
| legacy URL of moved page | /assisted-living/new-york/binghamton/bridgewater-center-for-rehabilitation-nursing-llc-74791/ | 301 → /nursing-homes/new-york/binghamton/bridgewater-center-for-rehab-nursing-l-l-c-8810/ | 301 → /nursing-homes/new-york/binghamton/bridgewater-center-for-rehab-nursing-l-l-c-8810/ | yes |
| surviving page | /nursing-homes/new-york/binghamton/bridgewater-center-for-rehab-nursing-l-l-c-8810/ | 200 (self canonical) | 200 | yes |
| retired page | /adult-day-services/new-york/adams/adams-family-health-center-1027143968/ | 410 | 410 | yes |
| retired page (no slash) | /adult-day-services/new-york/adams/adams-family-health-center-1027143968 | 410 | 410 | yes |
| legacy URL of retired page | /adult-day-services/new-york/adams/adams-family-health-center-313/ | 410 | 410 | yes |
| retired page | /adult-day-services/new-york/airmont/caring-connections-llc-1457106821/ | 410 | 410 | yes |
| retired page (no slash) | /adult-day-services/new-york/airmont/caring-connections-llc-1457106821 | 410 | 410 | yes |
| legacy URL of retired page | /adult-day-services/new-york/airmont/caring-connections-llc-18153/ | 410 | 410 | yes |
| retired page | /adult-day-services/new-york/albany/albany-county-health-dept-841886180/ | 410 | 410 | yes |
| retired page (no slash) | /adult-day-services/new-york/albany/albany-county-health-dept-841886180 | 410 | 410 | yes |
| legacy URL of retired page | /adult-day-services/new-york/albany/albany-county-health-dept-30113/ | 410 | 410 | yes |
| retired page | /adult-day-services/new-york/albany/allergy-and-immunology-clinic-of-amch-3237620165/ | 410 | 410 | yes |
| retired page (no slash) | /adult-day-services/new-york/albany/allergy-and-immunology-clinic-of-amch-3237620165 | 410 | 410 | yes |
| legacy URL of retired page | /adult-day-services/new-york/albany/allergy-and-immunology-clinic-of-amch-30150/ | 410 | 410 | yes |
| retired page | /adult-day-services/new-york/albany/attentive-care-of-albany-inc-2773549347/ | 410 | 410 | yes |
| retired page (no slash) | /adult-day-services/new-york/albany/attentive-care-of-albany-inc-2773549347 | 410 | 410 | yes |
| legacy URL of retired page | /adult-day-services/new-york/albany/attentive-care-of-albany-inc-8980/ | 410 | 410 | yes |
| retired page | /adult-day-services/new-york/albany/balanced-care-licensed-home-care-agency-672657275/ | 410 | 410 | yes |
| retired page (no slash) | /adult-day-services/new-york/albany/balanced-care-licensed-home-care-agency-672657275 | 410 | 410 | yes |
| legacy URL of retired page | /adult-day-services/new-york/albany/balanced-care-licensed-home-care-agency-25944/ | 410 | 410 | yes |
| retired page | /assisted-living/new-york/albany/albany-jewish-community-center-3171846333/ | 410 | 410 | yes |
| retired page (no slash) | /assisted-living/new-york/albany/albany-jewish-community-center-3171846333 | 410 | 410 | yes |
| legacy URL of retired page | /assisted-living/new-york/albany/albany-jewish-community-center-1164/ | 410 | 410 | yes |
| retired page | /assisted-living/new-york/albany/albany-med-kids-2049345141/ | 410 | 410 | yes |
| retired page (no slash) | /assisted-living/new-york/albany/albany-med-kids-2049345141 | 410 | 410 | yes |
| legacy URL of retired page | /assisted-living/new-york/albany/albany-med-kids-8723/ | 410 | 410 | yes |
| retired page | /assisted-living/new-york/albany/capital-milestones-child-care-inc-1317863738/ | 410 | 410 | yes |
| retired page (no slash) | /assisted-living/new-york/albany/capital-milestones-child-care-inc-1317863738 | 410 | 410 | yes |
| legacy URL of retired page | /assisted-living/new-york/albany/capital-milestones-child-care-inc-67103/ | 410 | 410 | yes |
| retired page | /assisted-living/new-york/albany/club-fed-child-care-center-1732292829/ | 410 | 410 | yes |
| retired page (no slash) | /assisted-living/new-york/albany/club-fed-child-care-center-1732292829 | 410 | 410 | yes |
| legacy URL of retired page | /assisted-living/new-york/albany/club-fed-child-care-center-44615/ | 410 | 410 | yes |
| retired page | /assisted-living/new-york/albany/trinity-alliance-of-the-capital-region-inc-arbor-hill-center-2612421208/ | 410 | 410 | yes |
| retired page (no slash) | /assisted-living/new-york/albany/trinity-alliance-of-the-capital-region-inc-arbor-hill-center-2612421208 | 410 | 410 | yes |
| legacy URL of retired page | /assisted-living/new-york/albany/trinity-alliance-of-the-capital-region-inc-arbor-hill-center-13370/ | 410 | 410 | yes |
| retired page | /assisted-living/new-york/albany/trinity-center-1575397434/ | 410 | 410 | yes |
| retired page (no slash) | /assisted-living/new-york/albany/trinity-center-1575397434 | 410 | 410 | yes |
| legacy URL of retired page | /assisted-living/new-york/albany/trinity-center-34017/ | 410 | 410 | yes |
| retired page | /assisted-living/new-york/albany/risse-after-school-program-at-albany-international-academy-3523341316/ | 410 | 410 | yes |
| retired page (no slash) | /assisted-living/new-york/albany/risse-after-school-program-at-albany-international-academy-3523341316 | 410 | 410 | yes |
| legacy URL of retired page | /assisted-living/new-york/albany/risse-after-school-program-at-albany-international-academy-60482/ | 410 | 410 | yes |
| retired page | /assisted-living/new-york/astoria/30234-ps-234-3296145851/ | 410 | 410 | yes |
| retired page (no slash) | /assisted-living/new-york/astoria/30234-ps-234-3296145851 | 410 | 410 | yes |
| legacy URL of retired page | /assisted-living/new-york/astoria/30234-ps-234-1014/ | 410 | 410 | yes |
| retired page | /assisted-living/new-york/bronx/07018-ps-18-2382236488/ | 410 | 410 | yes |
| retired page (no slash) | /assisted-living/new-york/bronx/07018-ps-18-2382236488 | 410 | 410 | yes |
| legacy URL of retired page | /assisted-living/new-york/bronx/07018-ps-18-17908/ | 410 | 410 | yes |
| control: legit_ny_assisted_living | /assisted-living/new-york/albany/massry-residence-at-daughters-of-sarah-832165469/ | 200 | 200 | yes |
| control: legit_ny_assisted_living | /assisted-living/new-york/albany/promenade-at-university-place-1420043245/ | 200 | 200 | yes |
| control: legit_ny_assisted_living | /assisted-living/new-york/amherst/the-amberleigh-4173478660/ | 200 | 200 | yes |
| control: legit_ny_assisted_living | /assisted-living/new-york/amsterdam/hillcrest-spring-residential-3564736031/ | 200 | 200 | yes |
| control: legit_ny_assisted_living | /assisted-living/new-york/amsterdam/sarah-jane-sanford-home-2535847309/ | 200 | 200 | yes |
| control: legit_ny_assisted_living | /assisted-living/new-york/amsterdam/the-sentinel-of-amsterdam-llc-808299843/ | 200 | 200 | yes |
| control: ambiguous_office_for_the_aging | /assisted-living/new-york/albany/newgate-social-adult-day-services-2870975386/ | 200 | 200 | yes |
| control: ambiguous_office_for_the_aging | /assisted-living/new-york/allegany/allegany-linwood-center-3286164536/ | 200 | 200 | yes |
| control: ambiguous_office_for_the_aging | /assisted-living/new-york/baldwinsville/silver-fox-senior-social-club-4006268176/ | 200 | 200 | yes |
| control: control_adult_day_outside_ny | /adult-day-services/california/tustin/jenn-s-adult-daycare-llc-3258628290/ | 200 | 200 | yes |
| control: control_adult_day_outside_ny | /adult-day-services/florida/miami/sunny-day-health-services-inc-3713511234/ | 200 | 200 | yes |
| control: control_adult_day_outside_ny | /adult-day-services/kansas/topeka/aldersgate-village-3939470160/ | 200 | 200 | yes |
| control: control_ny_nursing_home | /nursing-homes/new-york/albany/daughters-of-sarah-nursing-center-8983/ | 200 | 200 | yes |
| control: control_ny_nursing_home | /nursing-homes/new-york/albany/hudson-park-rehabilitation-and-nursing-center-9244/ | 200 | 200 | yes |
| control: control_ny_nursing_home | /nursing-homes/new-york/albany/shaker-place-rehabilitation-and-nursing-center-8953/ | 200 | 200 | yes |
| control: control_assisted_living_outside_ny | /assisted-living/california/acton/acton-senior-housing-care-inc-1413982581/ | 200 | 200 | yes |
| control: control_assisted_living_outside_ny | /assisted-living/california/acton/community-care-group-1741929605/ | 200 | 200 | yes |
| unrelated (CA) | /adult-day-services/california/tustin/jenn-s-adult-daycare-llc-3258628290/ | 200 | 200 | yes |
| unrelated (NY) | /adult-day-services/new-york/syracuse/nascentia-independent-care-1237877184/ | 200 | 200 | yes |
| unrelated (CA) | /assisted-living/california/cerritos/european-christian-home-vi-2351383155/ | 200 | 200 | yes |
| unrelated (CA) | /assisted-living/california/whittier/tiffany-s-board-care-979126161/ | 200 | 200 | yes |
| unrelated (GA) | /assisted-living/georgia/marietta/arbor-terrace-of-east-cobb-1211381283/ | 200 | 200 | yes |
| unrelated (MA) | /assisted-living/massachusetts/chelmsford/chelmsford-crossings-3633183658/ | 200 | 200 | yes |
| unrelated (MI) | /assisted-living/michigan/southfield/meadowood-763104636/ | 200 | 200 | yes |
| unrelated (NY) | /assisted-living/new-york/bronx/09126-ps126-woodycrest-ctr-for-human-dev-3460781767/ | 200 | 200 | yes |
| unrelated (NY) | /assisted-living/new-york/orchard-park/absolutcare-of-orchard-brooke-2945845433/ | 200 | 200 | yes |
| unrelated (TX) | /assisted-living/texas/lewisville/breezewood-assisted-living-inc-927772470/ | 200 | 200 | yes |
| unrelated (WI) | /assisted-living/wisconsin/muscoda/kanton-home-697108659/ | 200 | 200 | yes |
| unrelated (MN) | /memory-care/minnesota/hugo/the-encore-at-hugo-767501046/ | 200 | 200 | yes |
| unrelated (GA) | /nursing-homes/georgia/augusta/pruitthealth-augusta-2994/ | 200 | 200 | yes |
| unrelated (IA) | /nursing-homes/iowa/dubuque/mount-carmel-bluffs-4957/ | 200 | 200 | yes |
| unrelated (MS) | /nursing-homes/mississippi/clinton/clinton-healthcare-llc-snf-7333/ | 200 | 200 | yes |
| unrelated (OH) | /nursing-homes/ohio/vermilion/kingston-of-vermilion-10083/ | 200 | 200 | yes |
| unrelated (TX) | /nursing-homes/texas/lubbock/whisperwood-nursing-rehabilitation-center-12905/ | 200 | 200 | yes |
| unrelated (CA) | /residential-care/california/grover-beach/full-circle-residence-i-634185514/ | 200 | 200 | yes |
| unrelated (CA) | /residential-care/california/torrance/daniella-s-home-451766151/ | 200 | 200 | yes |
| unrelated (OH) | /residential-care/ohio/cincinnati/wellington-at-north-bend-crossing-the-2380097459/ | 200 | 200 | yes |
| state hub | /states/new-york/ | 200 | 200 | yes |
| care-state hub | /adult-day-services/new-york/ | 200 | 200 | yes |
| state hub | /states/california/ | 200 | 200 | yes |
| care-state hub | /adult-day-services/california/ | 200 | 200 | yes |
| sitemap: removed | /adult-day-services/new-york/albany/peregrine-crossgate-196215347/ | absent | absent | yes |
| sitemap: surviving | /assisted-living/new-york/albany/peregrine-crossgate-196215347/ | listed once | listed 1x | yes |
| sitemap: removed | /adult-day-services/new-york/albany/peregrine-shaker-499366096/ | absent | absent | yes |
| sitemap: surviving | /assisted-living/new-york/albany/peregrine-shaker-499366096/ | listed once | listed 1x | yes |
| sitemap: removed | /adult-day-services/new-york/amityville/the-villas-at-dominican-village-3608647698/ | absent | absent | yes |
| sitemap: surviving | /assisted-living/new-york/amityville/dominican-village-enriched-housing-program-1-3709202207/ | listed once | listed 1x | yes |
| sitemap: removed | /adult-day-services/new-york/albany/daughters-of-sarah-nursing-center-3614767261/ | absent | absent | yes |
| sitemap: surviving | /nursing-homes/new-york/albany/daughters-of-sarah-nursing-center-8983/ | listed once | listed 1x | yes |
| sitemap: removed | /adult-day-services/new-york/albany/shaker-place-rehabilitation-and-nursing-center-3821638911/ | absent | absent | yes |
| sitemap: surviving | /nursing-homes/new-york/albany/shaker-place-rehabilitation-and-nursing-center-8953/ | listed once | listed 1x | yes |
| sitemap: removed | /adult-day-services/new-york/albany/st-margaret-s-center-1495317794/ | absent | absent | yes |
| sitemap: surviving | /nursing-homes/new-york/albany/st-margarets-center-9260/ | listed once | listed 1x | yes |
| sitemap: removed | /assisted-living/new-york/auburn/the-commons-on-st-anthony-a-skilled-nursing-short-term-rehabilitation-community-651992568/ | absent | absent | yes |
| sitemap: surviving | /nursing-homes/new-york/auburn/the-commons-on-st-anthony-a-s-n-f-short-t-r-c-8916/ | listed once | listed 1x | yes |
| sitemap: removed | /assisted-living/new-york/binghamton/bridgewater-center-for-rehabilitation-nursing-llc-2545159438/ | absent | absent | yes |
| sitemap: surviving | /nursing-homes/new-york/binghamton/bridgewater-center-for-rehab-nursing-l-l-c-8810/ | listed once | listed 1x | yes |
| sitemap: removed | /adult-day-services/new-york/adams/adams-family-health-center-1027143968/ | absent | absent | yes |
| sitemap: removed | /adult-day-services/new-york/airmont/caring-connections-llc-1457106821/ | absent | absent | yes |
| sitemap: removed | /adult-day-services/new-york/albany/albany-county-health-dept-841886180/ | absent | absent | yes |
| sitemap: removed | /adult-day-services/new-york/albany/allergy-and-immunology-clinic-of-amch-3237620165/ | absent | absent | yes |
| sitemap: removed | /adult-day-services/new-york/albany/attentive-care-of-albany-inc-2773549347/ | absent | absent | yes |
| sitemap: removed | /adult-day-services/new-york/albany/balanced-care-licensed-home-care-agency-672657275/ | absent | absent | yes |
| sitemap: removed | /assisted-living/new-york/albany/albany-jewish-community-center-3171846333/ | absent | absent | yes |
| sitemap: removed | /assisted-living/new-york/albany/albany-med-kids-2049345141/ | absent | absent | yes |
| sitemap: removed | /assisted-living/new-york/albany/capital-milestones-child-care-inc-1317863738/ | absent | absent | yes |
| sitemap: removed | /assisted-living/new-york/albany/club-fed-child-care-center-1732292829/ | absent | absent | yes |
| sitemap: removed | /assisted-living/new-york/albany/trinity-alliance-of-the-capital-region-inc-arbor-hill-center-2612421208/ | absent | absent | yes |
| sitemap: removed | /assisted-living/new-york/albany/trinity-center-1575397434/ | absent | absent | yes |
| sitemap: removed | /assisted-living/new-york/albany/risse-after-school-program-at-albany-international-academy-3523341316/ | absent | absent | yes |
| sitemap: removed | /assisted-living/new-york/astoria/30234-ps-234-3296145851/ | absent | absent | yes |
| sitemap: removed | /assisted-living/new-york/bronx/07018-ps-18-2382236488/ | absent | absent | yes |

## Unexpected differences

None.

## Sitemaps (deploy preview vs production, 2026-11-11)

| | Production | Preview | Change |
|---|---|---|---|
| All sitemap URLs | 102,801 | 102,779 | -22 |
| Facility URLs | 78,239 | 78,218 | -21 |

## Derived change outside the batch (explained, needs a decision)

- `/adult-day-services/new-york/adams/` left the sitemap and returns 404 on the preview. Its only listing was
  Adams Family Health Center (a hospital extension clinic, retired by this batch), so the city page has no
  listings and is not built; the existing rule for empty care-type city pages returns 404. No built page links
  to it. Larger batches will empty more NY adult-day city pages the same way; whether those should return 404
  (current rule) or 410 is a policy choice.

## Other verification

- Build gates in `build:hybrid`: UUID map validation (78,218 identities, 72,227 mapped), independent validator
  ACCEPTED (23 records, all 78,239 baseline identities reconciled), import gate PASS. The Netlify preview build,
  which re-exports from the live database, passed the same gates.
- Build output (`scripts/validate/verifyCategoryBuild.mjs`, 102,756 HTML files): no removed page built, every
  surviving page built with a self canonical, sitemaps correct, no internal links to removed URLs.
- Tests: full unit suite 407 passed, 10 skipped, 0 failed (4 workers; at default parallelism two heavy tests
  time out on this machine, both pass alone). NY cleanup 20/20, pilot 11/11, registry 11/11.
- Claim eligibility seed regenerated: 19 UUIDs removed, all pilot pages. Not loaded into any database.
