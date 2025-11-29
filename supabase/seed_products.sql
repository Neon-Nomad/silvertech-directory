-- Seed Affiliate Products
-- Generated on 2025-11-29T22:53:17.190Z

CREATE TABLE IF NOT EXISTS affiliate_products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  affiliate_url text,
  image_url text,
  recommendation_reason text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE affiliate_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON affiliate_products FOR SELECT USING (true);

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Grab bars (angled, vertical, suction)', 'bathroom', 'https://affiliatelink.com/?product=grab-bars-angled-vertical-suction', 'https://images.silvertech.com/grab-bars-angled-vertical-suction.jpg', 'Essential for stability and preventing common slips in wet areas.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Raised toilet seats (with arms / without arms)', 'bathroom', 'https://affiliatelink.com/?product=raised-toilet-seats-with-arms-without-arms', 'https://images.silvertech.com/raised-toilet-seats-with-arms-without-arms.jpg', 'Improves bathroom safety and ease of use.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Toilet safety rails', 'bathroom', 'https://affiliatelink.com/?product=toilet-safety-rails', 'https://images.silvertech.com/toilet-safety-rails.jpg', 'Improves bathroom safety and ease of use.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Bidet attachments', 'bathroom', 'https://affiliatelink.com/?product=bidet-attachments', 'https://images.silvertech.com/bidet-attachments.jpg', 'Increases safety and independence in the bathroom.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Bariatric commodes', 'bathroom', 'https://affiliatelink.com/?product=bariatric-commodes', 'https://images.silvertech.com/bariatric-commodes.jpg', 'Increases safety and independence in the bathroom.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Transfer benches', 'bathroom', 'https://affiliatelink.com/?product=transfer-benches', 'https://images.silvertech.com/transfer-benches.jpg', 'Increases safety and independence in the bathroom.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Shower stools', 'bathroom', 'https://affiliatelink.com/?product=shower-stools', 'https://images.silvertech.com/shower-stools.jpg', 'Reduces slip risks and makes bathing safer and more comfortable.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Anti-slip shower mats', 'bathroom', 'https://affiliatelink.com/?product=anti-slip-shower-mats', 'https://images.silvertech.com/anti-slip-shower-mats.jpg', 'Reduces slip risks and makes bathing safer and more comfortable.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Anti-slip floor strips', 'bathroom', 'https://affiliatelink.com/?product=anti-slip-floor-strips', 'https://images.silvertech.com/anti-slip-floor-strips.jpg', 'Increases safety and independence in the bathroom.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Handheld shower heads', 'bathroom', 'https://affiliatelink.com/?product=handheld-shower-heads', 'https://images.silvertech.com/handheld-shower-heads.jpg', 'Reduces slip risks and makes bathing safer and more comfortable.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Shower step reducer kits', 'bathroom', 'https://affiliatelink.com/?product=shower-step-reducer-kits', 'https://images.silvertech.com/shower-step-reducer-kits.jpg', 'Reduces slip risks and makes bathing safer and more comfortable.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Bathroom motion lights', 'bathroom', 'https://affiliatelink.com/?product=bathroom-motion-lights', 'https://images.silvertech.com/bathroom-motion-lights.jpg', 'Reduces slip risks and makes bathing safer and more comfortable.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('No-slip bath rugs', 'bathroom', 'https://affiliatelink.com/?product=no-slip-bath-rugs', 'https://images.silvertech.com/no-slip-bath-rugs.jpg', 'Reduces slip risks and makes bathing safer and more comfortable.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Waterproof call buttons', 'bathroom', 'https://affiliatelink.com/?product=waterproof-call-buttons', 'https://images.silvertech.com/waterproof-call-buttons.jpg', 'Increases safety and independence in the bathroom.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Walk-in bathtub conversion kits', 'bathroom', 'https://affiliatelink.com/?product=walk-in-bathtub-conversion-kits', 'https://images.silvertech.com/walk-in-bathtub-conversion-kits.jpg', 'Reduces slip risks and makes bathing safer and more comfortable.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Rollators (4-wheel)', 'mobility', 'https://affiliatelink.com/?product=rollators-4-wheel', 'https://images.silvertech.com/rollators-4-wheel.jpg', 'Provides critical support and stability for maintaining mobility.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Upright walkers', 'mobility', 'https://affiliatelink.com/?product=upright-walkers', 'https://images.silvertech.com/upright-walkers.jpg', 'Provides critical support and stability for maintaining mobility.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Standard walkers', 'mobility', 'https://affiliatelink.com/?product=standard-walkers', 'https://images.silvertech.com/standard-walkers.jpg', 'Provides critical support and stability for maintaining mobility.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Folding canes', 'mobility', 'https://affiliatelink.com/?product=folding-canes', 'https://images.silvertech.com/folding-canes.jpg', 'Offers extra balance support for safer walking.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Quad canes', 'mobility', 'https://affiliatelink.com/?product=quad-canes', 'https://images.silvertech.com/quad-canes.jpg', 'Offers extra balance support for safer walking.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Transport wheelchairs', 'mobility', 'https://affiliatelink.com/?product=transport-wheelchairs', 'https://images.silvertech.com/transport-wheelchairs.jpg', 'Ensures comfortable and safe mobility for those with limited movement.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Lightweight wheelchairs', 'mobility', 'https://affiliatelink.com/?product=lightweight-wheelchairs', 'https://images.silvertech.com/lightweight-wheelchairs.jpg', 'Ensures comfortable and safe mobility for those with limited movement.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Power chairs', 'mobility', 'https://affiliatelink.com/?product=power-chairs', 'https://images.silvertech.com/power-chairs.jpg', 'Ensures comfortable and safe mobility for those with limited movement.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Gait belts', 'mobility', 'https://affiliatelink.com/?product=gait-belts', 'https://images.silvertech.com/gait-belts.jpg', 'Supports safe movement and prevents falls.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Bed handles', 'mobility', 'https://affiliatelink.com/?product=bed-handles', 'https://images.silvertech.com/bed-handles.jpg', 'Enhances comfort and safety during sleep and rest.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Bed rails (adjustable)', 'mobility', 'https://affiliatelink.com/?product=bed-rails-adjustable', 'https://images.silvertech.com/bed-rails-adjustable.jpg', 'Enhances comfort and safety during sleep and rest.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Fall detection wearable devices', 'mobility', 'https://affiliatelink.com/?product=fall-detection-wearable-devices', 'https://images.silvertech.com/fall-detection-wearable-devices.jpg', 'Supports safe movement and prevents falls.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Hip-protective pads', 'mobility', 'https://affiliatelink.com/?product=hip-protective-pads', 'https://images.silvertech.com/hip-protective-pads.jpg', 'Supports safe movement and prevents falls.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Non-slip socks (hospital grade)', 'mobility', 'https://affiliatelink.com/?product=non-slip-socks-hospital-grade', 'https://images.silvertech.com/non-slip-socks-hospital-grade.jpg', 'Makes dressing easier and safer.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Bed alarms', 'mobility', 'https://affiliatelink.com/?product=bed-alarms', 'https://images.silvertech.com/bed-alarms.jpg', 'Enhances comfort and safety during sleep and rest.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Chair alarms', 'mobility', 'https://affiliatelink.com/?product=chair-alarms', 'https://images.silvertech.com/chair-alarms.jpg', 'Ensures comfortable and safe mobility for those with limited movement.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Wheelchair cushions (gel, memory)', 'mobility', 'https://affiliatelink.com/?product=wheelchair-cushions-gel-memory', 'https://images.silvertech.com/wheelchair-cushions-gel-memory.jpg', 'Ensures comfortable and safe mobility for those with limited movement.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Fall-proof bedside lighting', 'mobility', 'https://affiliatelink.com/?product=fall-proof-bedside-lighting', 'https://images.silvertech.com/fall-proof-bedside-lighting.jpg', 'Enhances comfort and safety during sleep and rest.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Adjustable beds', 'bedroom', 'https://affiliatelink.com/?product=adjustable-beds', 'https://images.silvertech.com/adjustable-beds.jpg', 'Enhances comfort and safety during sleep and rest.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Bed wedges', 'bedroom', 'https://affiliatelink.com/?product=bed-wedges', 'https://images.silvertech.com/bed-wedges.jpg', 'Enhances comfort and safety during sleep and rest.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Overbed tables', 'bedroom', 'https://affiliatelink.com/?product=overbed-tables', 'https://images.silvertech.com/overbed-tables.jpg', 'Enhances comfort and safety during sleep and rest.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Waterproof mattress protectors', 'bedroom', 'https://affiliatelink.com/?product=waterproof-mattress-protectors', 'https://images.silvertech.com/waterproof-mattress-protectors.jpg', 'Ensures a safe and comfortable sleeping environment.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Weighted blankets', 'bedroom', 'https://affiliatelink.com/?product=weighted-blankets', 'https://images.silvertech.com/weighted-blankets.jpg', 'Ensures a safe and comfortable sleeping environment.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Bedside commodes', 'bedroom', 'https://affiliatelink.com/?product=bedside-commodes', 'https://images.silvertech.com/bedside-commodes.jpg', 'Enhances comfort and safety during sleep and rest.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Bedside fall mats', 'bedroom', 'https://affiliatelink.com/?product=bedside-fall-mats', 'https://images.silvertech.com/bedside-fall-mats.jpg', 'Enhances comfort and safety during sleep and rest.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Oxygen tank holders', 'bedroom', 'https://affiliatelink.com/?product=oxygen-tank-holders', 'https://images.silvertech.com/oxygen-tank-holders.jpg', 'Ensures a safe and comfortable sleeping environment.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('CPAP machines', 'bedroom', 'https://affiliatelink.com/?product=cpap-machines', 'https://images.silvertech.com/cpap-machines.jpg', 'Ensures a safe and comfortable sleeping environment.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('CPAP hose keepers', 'bedroom', 'https://affiliatelink.com/?product=cpap-hose-keepers', 'https://images.silvertech.com/cpap-hose-keepers.jpg', 'Ensures a safe and comfortable sleeping environment.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Night lights with motion sensors', 'bedroom', 'https://affiliatelink.com/?product=night-lights-with-motion-sensors', 'https://images.silvertech.com/night-lights-with-motion-sensors.jpg', 'Provides peace of mind by alerting caregivers to potential issues.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Senior-friendly alarm clocks', 'bedroom', 'https://affiliatelink.com/?product=senior-friendly-alarm-clocks', 'https://images.silvertech.com/senior-friendly-alarm-clocks.jpg', 'Provides peace of mind by alerting caregivers to potential issues.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Bed risers', 'bedroom', 'https://affiliatelink.com/?product=bed-risers', 'https://images.silvertech.com/bed-risers.jpg', 'Enhances comfort and safety during sleep and rest.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Adaptive eating utensils', 'kitchen', 'https://affiliatelink.com/?product=adaptive-eating-utensils', 'https://images.silvertech.com/adaptive-eating-utensils.jpg', 'Makes dining and meal prep easier and more independent.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Non-spill bowls', 'kitchen', 'https://affiliatelink.com/?product=non-spill-bowls', 'https://images.silvertech.com/non-spill-bowls.jpg', 'Helps manage medication schedules accurately and safely.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Weighted utensils', 'kitchen', 'https://affiliatelink.com/?product=weighted-utensils', 'https://images.silvertech.com/weighted-utensils.jpg', 'Makes dining and meal prep easier and more independent.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Anti-tip drinking cups', 'kitchen', 'https://affiliatelink.com/?product=anti-tip-drinking-cups', 'https://images.silvertech.com/anti-tip-drinking-cups.jpg', 'Promotes independence in the kitchen.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Electric jar openers', 'kitchen', 'https://affiliatelink.com/?product=electric-jar-openers', 'https://images.silvertech.com/electric-jar-openers.jpg', 'Makes dining and meal prep easier and more independent.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Can-opening assist tools', 'kitchen', 'https://affiliatelink.com/?product=can-opening-assist-tools', 'https://images.silvertech.com/can-opening-assist-tools.jpg', 'Promotes independence in the kitchen.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Easy-grip knives', 'kitchen', 'https://affiliatelink.com/?product=easy-grip-knives', 'https://images.silvertech.com/easy-grip-knives.jpg', 'Promotes independence in the kitchen.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Counter-height stools with arms', 'kitchen', 'https://affiliatelink.com/?product=counter-height-stools-with-arms', 'https://images.silvertech.com/counter-height-stools-with-arms.jpg', 'Promotes independence in the kitchen.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Anti-fatigue kitchen mats', 'kitchen', 'https://affiliatelink.com/?product=anti-fatigue-kitchen-mats', 'https://images.silvertech.com/anti-fatigue-kitchen-mats.jpg', 'Promotes independence in the kitchen.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Reacher grabbers', 'kitchen', 'https://affiliatelink.com/?product=reacher-grabbers', 'https://images.silvertech.com/reacher-grabbers.jpg', 'Promotes independence in the kitchen.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Plate guards', 'kitchen', 'https://affiliatelink.com/?product=plate-guards', 'https://images.silvertech.com/plate-guards.jpg', 'Promotes independence in the kitchen.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Large-print measuring sets', 'kitchen', 'https://affiliatelink.com/?product=large-print-measuring-sets', 'https://images.silvertech.com/large-print-measuring-sets.jpg', 'Promotes independence in the kitchen.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Auto-shutoff kettles', 'kitchen', 'https://affiliatelink.com/?product=auto-shutoff-kettles', 'https://images.silvertech.com/auto-shutoff-kettles.jpg', 'Promotes independence in the kitchen.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Medical alert devices', 'monitoring', 'https://affiliatelink.com/?product=medical-alert-devices', 'https://images.silvertech.com/medical-alert-devices.jpg', 'Keeps loved ones connected and safe.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('GPS location trackers', 'monitoring', 'https://affiliatelink.com/?product=gps-location-trackers', 'https://images.silvertech.com/gps-location-trackers.jpg', 'Keeps loved ones connected and safe.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Door sensors', 'monitoring', 'https://affiliatelink.com/?product=door-sensors', 'https://images.silvertech.com/door-sensors.jpg', 'Provides peace of mind by alerting caregivers to potential issues.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Smart smoke alarms', 'monitoring', 'https://affiliatelink.com/?product=smart-smoke-alarms', 'https://images.silvertech.com/smart-smoke-alarms.jpg', 'Provides peace of mind by alerting caregivers to potential issues.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Smart carbon monoxide alarms', 'monitoring', 'https://affiliatelink.com/?product=smart-carbon-monoxide-alarms', 'https://images.silvertech.com/smart-carbon-monoxide-alarms.jpg', 'Provides peace of mind by alerting caregivers to potential issues.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Bed occupancy sensors', 'monitoring', 'https://affiliatelink.com/?product=bed-occupancy-sensors', 'https://images.silvertech.com/bed-occupancy-sensors.jpg', 'Enhances comfort and safety during sleep and rest.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Motion-detecting cameras', 'monitoring', 'https://affiliatelink.com/?product=motion-detecting-cameras', 'https://images.silvertech.com/motion-detecting-cameras.jpg', 'Keeps loved ones connected and safe.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Video doorbells', 'monitoring', 'https://affiliatelink.com/?product=video-doorbells', 'https://images.silvertech.com/video-doorbells.jpg', 'Keeps loved ones connected and safe.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Smart plugs', 'monitoring', 'https://affiliatelink.com/?product=smart-plugs', 'https://images.silvertech.com/smart-plugs.jpg', 'Keeps loved ones connected and safe.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Smart thermostats', 'monitoring', 'https://affiliatelink.com/?product=smart-thermostats', 'https://images.silvertech.com/smart-thermostats.jpg', 'Keeps loved ones connected and safe.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Smart pill reminders', 'monitoring', 'https://affiliatelink.com/?product=smart-pill-reminders', 'https://images.silvertech.com/smart-pill-reminders.jpg', 'Helps manage medication schedules accurately and safely.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Caregiver apps', 'monitoring', 'https://affiliatelink.com/?product=caregiver-apps', 'https://images.silvertech.com/caregiver-apps.jpg', 'Keeps loved ones connected and safe.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Adult diapers', 'hygiene', 'https://affiliatelink.com/?product=adult-diapers', 'https://images.silvertech.com/adult-diapers.jpg', 'Provides discreet protection and maintains dignity.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Incontinence pads', 'hygiene', 'https://affiliatelink.com/?product=incontinence-pads', 'https://images.silvertech.com/incontinence-pads.jpg', 'Provides discreet protection and maintains dignity.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Washable incontinence underwear', 'hygiene', 'https://affiliatelink.com/?product=washable-incontinence-underwear', 'https://images.silvertech.com/washable-incontinence-underwear.jpg', 'Provides discreet protection and maintains dignity.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Skin-barrier creams', 'hygiene', 'https://affiliatelink.com/?product=skin-barrier-creams', 'https://images.silvertech.com/skin-barrier-creams.jpg', 'Essential for maintaining personal hygiene and comfort.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('No-rinse shampoos', 'hygiene', 'https://affiliatelink.com/?product=no-rinse-shampoos', 'https://images.silvertech.com/no-rinse-shampoos.jpg', 'Essential for maintaining personal hygiene and comfort.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Bathing wipes', 'hygiene', 'https://affiliatelink.com/?product=bathing-wipes', 'https://images.silvertech.com/bathing-wipes.jpg', 'Reduces slip risks and makes bathing safer and more comfortable.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Perineal cleansers', 'hygiene', 'https://affiliatelink.com/?product=perineal-cleansers', 'https://images.silvertech.com/perineal-cleansers.jpg', 'Essential for maintaining personal hygiene and comfort.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Long-handled bath sponges', 'hygiene', 'https://affiliatelink.com/?product=long-handled-bath-sponges', 'https://images.silvertech.com/long-handled-bath-sponges.jpg', 'Reduces slip risks and makes bathing safer and more comfortable.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Easy-on compression socks', 'hygiene', 'https://affiliatelink.com/?product=easy-on-compression-socks', 'https://images.silvertech.com/easy-on-compression-socks.jpg', 'Makes dressing easier and safer.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Adaptive clothing', 'hygiene', 'https://affiliatelink.com/?product=adaptive-clothing', 'https://images.silvertech.com/adaptive-clothing.jpg', 'Essential for maintaining personal hygiene and comfort.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Diabetic socks', 'hygiene', 'https://affiliatelink.com/?product=diabetic-socks', 'https://images.silvertech.com/diabetic-socks.jpg', 'Makes dressing easier and safer.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Blood pressure monitors', 'medical', 'https://affiliatelink.com/?product=blood-pressure-monitors', 'https://images.silvertech.com/blood-pressure-monitors.jpg', 'Provides peace of mind by alerting caregivers to potential issues.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Glucometers', 'medical', 'https://affiliatelink.com/?product=glucometers', 'https://images.silvertech.com/glucometers.jpg', 'Critical for monitoring and managing health at home.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Pulse oximeters', 'medical', 'https://affiliatelink.com/?product=pulse-oximeters', 'https://images.silvertech.com/pulse-oximeters.jpg', 'Critical for monitoring and managing health at home.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Thermometers (contactless)', 'medical', 'https://affiliatelink.com/?product=thermometers-contactless', 'https://images.silvertech.com/thermometers-contactless.jpg', 'Critical for monitoring and managing health at home.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('TENS pain units', 'medical', 'https://affiliatelink.com/?product=tens-pain-units', 'https://images.silvertech.com/tens-pain-units.jpg', 'Critical for monitoring and managing health at home.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Nebulizers', 'medical', 'https://affiliatelink.com/?product=nebulizers', 'https://images.silvertech.com/nebulizers.jpg', 'Critical for monitoring and managing health at home.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Prescription organizers', 'medical', 'https://affiliatelink.com/?product=prescription-organizers', 'https://images.silvertech.com/prescription-organizers.jpg', 'Critical for monitoring and managing health at home.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Pill crushers', 'medical', 'https://affiliatelink.com/?product=pill-crushers', 'https://images.silvertech.com/pill-crushers.jpg', 'Helps manage medication schedules accurately and safely.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Weekly pill boxes', 'medical', 'https://affiliatelink.com/?product=weekly-pill-boxes', 'https://images.silvertech.com/weekly-pill-boxes.jpg', 'Helps manage medication schedules accurately and safely.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Magnifying medicine readers', 'medical', 'https://affiliatelink.com/?product=magnifying-medicine-readers', 'https://images.silvertech.com/magnifying-medicine-readers.jpg', 'Critical for monitoring and managing health at home.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Memory clocks', 'dementia', 'https://affiliatelink.com/?product=memory-clocks', 'https://images.silvertech.com/memory-clocks.jpg', 'Aids orientation and helps manage daily routines.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Wandering-prevention door bars', 'dementia', 'https://affiliatelink.com/?product=wandering-prevention-door-bars', 'https://images.silvertech.com/wandering-prevention-door-bars.jpg', 'Supports cognitive function and reduces anxiety.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Wander alarms', 'dementia', 'https://affiliatelink.com/?product=wander-alarms', 'https://images.silvertech.com/wander-alarms.jpg', 'Provides peace of mind by alerting caregivers to potential issues.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Fidget blankets', 'dementia', 'https://affiliatelink.com/?product=fidget-blankets', 'https://images.silvertech.com/fidget-blankets.jpg', 'Supports cognitive function and reduces anxiety.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Dementia ID bracelets', 'dementia', 'https://affiliatelink.com/?product=dementia-id-bracelets', 'https://images.silvertech.com/dementia-id-bracelets.jpg', 'Supports cognitive function and reduces anxiety.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Orientation signage kits', 'dementia', 'https://affiliatelink.com/?product=orientation-signage-kits', 'https://images.silvertech.com/orientation-signage-kits.jpg', 'Supports cognitive function and reduces anxiety.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Simplified TV remotes', 'dementia', 'https://affiliatelink.com/?product=simplified-tv-remotes', 'https://images.silvertech.com/simplified-tv-remotes.jpg', 'Supports cognitive function and reduces anxiety.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Audio players (one-button)', 'dementia', 'https://affiliatelink.com/?product=audio-players-one-button', 'https://images.silvertech.com/audio-players-one-button.jpg', 'Supports cognitive function and reduces anxiety.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Activity boards', 'dementia', 'https://affiliatelink.com/?product=activity-boards', 'https://images.silvertech.com/activity-boards.jpg', 'Supports cognitive function and reduces anxiety.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Lock covers', 'dementia', 'https://affiliatelink.com/?product=lock-covers', 'https://images.silvertech.com/lock-covers.jpg', 'Supports cognitive function and reduces anxiety.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Jar grippers', 'daily-living', 'https://affiliatelink.com/?product=jar-grippers', 'https://images.silvertech.com/jar-grippers.jpg', 'Simplifies everyday tasks for better quality of life.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Extra-long shoehorns', 'daily-living', 'https://affiliatelink.com/?product=extra-long-shoehorns', 'https://images.silvertech.com/extra-long-shoehorns.jpg', 'Makes dressing easier and safer.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Elastic shoe laces', 'daily-living', 'https://affiliatelink.com/?product=elastic-shoe-laces', 'https://images.silvertech.com/elastic-shoe-laces.jpg', 'Makes dressing easier and safer.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Sock sliders', 'daily-living', 'https://affiliatelink.com/?product=sock-sliders', 'https://images.silvertech.com/sock-sliders.jpg', 'Makes dressing easier and safer.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Reacher tools', 'daily-living', 'https://affiliatelink.com/?product=reacher-tools', 'https://images.silvertech.com/reacher-tools.jpg', 'Simplifies everyday tasks for better quality of life.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Long-handled dustpans', 'daily-living', 'https://affiliatelink.com/?product=long-handled-dustpans', 'https://images.silvertech.com/long-handled-dustpans.jpg', 'Simplifies everyday tasks for better quality of life.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Voice-controlled plugs', 'daily-living', 'https://affiliatelink.com/?product=voice-controlled-plugs', 'https://images.silvertech.com/voice-controlled-plugs.jpg', 'Simplifies everyday tasks for better quality of life.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Easy-lift recliners', 'daily-living', 'https://affiliatelink.com/?product=easy-lift-recliners', 'https://images.silvertech.com/easy-lift-recliners.jpg', 'Simplifies everyday tasks for better quality of life.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Low-glare lighting', 'daily-living', 'https://affiliatelink.com/?product=low-glare-lighting', 'https://images.silvertech.com/low-glare-lighting.jpg', 'Improves visibility to prevent trips and falls in dim areas.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Blue-light-filtering lamps', 'daily-living', 'https://affiliatelink.com/?product=blue-light-filtering-lamps', 'https://images.silvertech.com/blue-light-filtering-lamps.jpg', 'Improves visibility to prevent trips and falls in dim areas.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Large-button phones', 'daily-living', 'https://affiliatelink.com/?product=large-button-phones', 'https://images.silvertech.com/large-button-phones.jpg', 'Simplifies everyday tasks for better quality of life.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Large-display remotes', 'daily-living', 'https://affiliatelink.com/?product=large-display-remotes', 'https://images.silvertech.com/large-display-remotes.jpg', 'Simplifies everyday tasks for better quality of life.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Keyless entry pads', 'daily-living', 'https://affiliatelink.com/?product=keyless-entry-pads', 'https://images.silvertech.com/keyless-entry-pads.jpg', 'Simplifies everyday tasks for better quality of life.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Mobility scooters', 'outdoor', 'https://affiliatelink.com/?product=mobility-scooters', 'https://images.silvertech.com/mobility-scooters.jpg', 'Enables safe and active outdoor experiences.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Outdoor rollators', 'outdoor', 'https://affiliatelink.com/?product=outdoor-rollators', 'https://images.silvertech.com/outdoor-rollators.jpg', 'Provides critical support and stability for maintaining mobility.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Porch ramps', 'outdoor', 'https://affiliatelink.com/?product=porch-ramps', 'https://images.silvertech.com/porch-ramps.jpg', 'Improves accessibility for entering and exiting the home.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Threshold ramps', 'outdoor', 'https://affiliatelink.com/?product=threshold-ramps', 'https://images.silvertech.com/threshold-ramps.jpg', 'Improves accessibility for entering and exiting the home.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Exterior grab bars', 'outdoor', 'https://affiliatelink.com/?product=exterior-grab-bars', 'https://images.silvertech.com/exterior-grab-bars.jpg', 'Essential for stability and preventing common slips in wet areas.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Weather-resistant cane tips', 'outdoor', 'https://affiliatelink.com/?product=weather-resistant-cane-tips', 'https://images.silvertech.com/weather-resistant-cane-tips.jpg', 'Offers extra balance support for safer walking.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Cane/rollator cup holders', 'outdoor', 'https://affiliatelink.com/?product=cane-rollator-cup-holders', 'https://images.silvertech.com/cane-rollator-cup-holders.jpg', 'Provides critical support and stability for maintaining mobility.');

INSERT INTO affiliate_products (name, category, affiliate_url, image_url, recommendation_reason)
VALUES ('Outdoor chair lifts', 'outdoor', 'https://affiliatelink.com/?product=outdoor-chair-lifts', 'https://images.silvertech.com/outdoor-chair-lifts.jpg', 'Ensures comfortable and safe mobility for those with limited movement.');

