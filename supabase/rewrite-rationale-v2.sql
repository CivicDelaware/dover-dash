-- Dover Dash — Rationale Rewrite v2
-- Each entry now directly answers: does this cost me money, save me money,
-- or protect me from a cost — and when?
-- Run in Supabase SQL Editor after update-rationale.sql has been applied.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── STEP 1: Add missing periods to any rationale that lacks one ───────────────
UPDATE classifications
SET rationale = rationale || '.'
WHERE session_number = 153
  AND rationale IS NOT NULL
  AND rationale NOT LIKE '%.';


-- ── HOMEOWNER 🏠 ──────────────────────────────────────────────────────────────

-- HB 363 | 20 mph Speed Limit
-- Old: vague, no wallet connection
UPDATE classifications
SET rationale = 'This law doesn''t change your property taxes or utility bills. What it does is lower the speed limit on residential streets — including yours — to 20 mph, effective now, with signage phasing in over five years. If you drive through neighborhoods at 25 mph, you can now be ticketed. The longer-term benefit: slower traffic on your block generally supports neighborhood desirability, which tends to hold or improve property values over time.'
WHERE session_number = 153 AND profile_key = 'homeowner'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 363');

-- HB 445 | Renewable Energy for Large Facilities
-- Old: "would otherwise come" — too speculative
UPDATE classifications
SET rationale = 'This law doesn''t lower your current electric bill. What it does is require large data centers and industrial energy users to generate their own renewable power within 10 years rather than pulling from the shared grid. If those facilities drew from the same grid as your home, Delmarva would have grounds to request major rate increases to cover the added demand. Requiring them to generate their own power removes that future cost pressure from your bill.'
WHERE session_number = 153 AND profile_key = 'homeowner'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 445');

-- HB 458 | Backflow Preventer Exemption
-- Old: confusing (reversed the water source logic)
UPDATE classifications
SET rationale = 'If your single-family home is classified as low-hazard and connected to a public water system, this law clarifies which backflow preventer inspection requirements apply to you. In some cases, stricter inspection rules could still apply depending on how your property is classified by your municipality. Before assuming you''re exempt, confirm your home''s hazard classification with your local water authority — a required inspection or equipment upgrade can run several hundred to a few thousand dollars if you''re not prepared.'
WHERE session_number = 153 AND profile_key = 'homeowner'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 458');

-- HB 461 | NCC School Tax Reset
-- Old: good but missing the "NCC only" context
UPDATE classifications
SET rationale = 'This law applies only to New Castle County homeowners. It requires your school district to reset its 2026–2027 tax rate so it doesn''t collect more than last year''s revenue while property reassessment appeals are still being resolved. In practical terms: your school tax increase this year is capped at your district''s historical growth rate — as low as 0.31% for Smyrna homeowners or up to 3.68% for Appoquinimink. If you live in Kent or Sussex County, this bill doesn''t affect you.'
WHERE session_number = 153 AND profile_key = 'homeowner'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 461');

-- HB 462 | NCC Split School Tax Rate
-- Old: "may slow" too vague, missing NCC note
UPDATE classifications
SET rationale = 'This law applies only to New Castle County homeowners. It lets your school district keep charging commercial and industrial properties a higher school tax rate — up to 1.85 times your residential rate. In practice, this means businesses carry more of the school funding burden, which reduces the pressure on your property tax bill to cover the same costs. Without this rate differential, your district would have to spread that same funding need more evenly across all property owners, including you.'
WHERE session_number = 153 AND profile_key = 'homeowner'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 462');

-- SB 192 | Utility Call Center Relocation Notice
-- Old: "potentially declines" too soft
UPDATE classifications
SET rationale = 'This law doesn''t change your electric or gas bill. What it does is require your utility to give advance notice before moving its customer service operation out of state — so regulators can review the decision before it happens. The practical benefit: if you have a billing dispute, report a gas leak, or lose power, your call is more likely to be handled by someone with real accountability to Delaware service standards rather than a remote center with no local stake.'
WHERE session_number = 153 AND profile_key = 'homeowner'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 192');

-- SB 275 | Underground Utility Safety
-- User flagged: too vague, doesn't explain wallet impact
UPDATE classifications
SET rationale = 'This law doesn''t raise your utility bill. What it does is shift legal liability: if a contractor, landscaper, or any hired worker digs on your property without first calling 811 to have underground lines marked and then hits a gas pipe, water line, or electric cable, the financial and legal responsibility falls on them — not you. The law is in effect now. Before any digging project on your property, confirm your contractor has requested a 811 line marking. If they skip it and cause damage, you have a clear legal basis to hold them responsible for the repair costs.'
WHERE session_number = 153 AND profile_key = 'homeowner'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 275');

-- SB 308 | Load Forecast Accountability
-- Old: "meant to prevent" too speculative
UPDATE classifications
SET rationale = 'This law doesn''t change your current electric bill. What it does is put a check on how Delmarva justifies future rate increases. Every time the utility wants to build new grid infrastructure, it submits a demand forecast to justify the investment — and you pay for that investment through your rates. Regulators must now independently verify those forecasts before approving them. If a forecast is inflated to justify unnecessary construction, this law gives regulators the grounds to reject it before you''re billed for it.'
WHERE session_number = 153 AND profile_key = 'homeowner'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 308');

-- SB 325 | Fire Commission Background Checks
-- Old: "can improve" too vague and indirect
UPDATE classifications
SET rationale = 'This law doesn''t directly change your homeowners insurance premium or fire inspection fees. However, your home insurer assigns your property a fire protection rating based partly on the quality and reliability of your local fire company. Volunteer fire departments in Delaware with stronger screening and integrity records contribute to better community ratings — and better-rated fire protection communities typically qualify for lower homeowners insurance premiums over time. The change is gradual, not immediate.'
WHERE session_number = 153 AND profile_key = 'homeowner'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 325');

-- SB 326 | Delmarva Rate Protection
-- Old: "should slow" too soft
UPDATE classifications
SET rationale = 'Two protections for your electric bill take effect now. First, Delmarva Power can no longer charge you for infrastructure projects that aren''t necessary to serve customers — meaning speculative or non-essential grid expansions can''t be recovered through your rates. Second, the amount Delmarva can collect through interim rates while a rate increase request is under review is now capped. These don''t cut what you pay today, but they remove tools the utility previously used to increase rates faster than regulators could push back.'
WHERE session_number = 153 AND profile_key = 'homeowner'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 326');


-- ── RENTER 🔑 ──────────────────────────────────────────────────────────────────

-- HB 363 | 20 mph Speed Limit
UPDATE classifications
SET rationale = 'This law doesn''t change your rent. What it does is lower the speed limit on residential streets — including your block — to 20 mph, effective now, with signage phasing in over five years. If you regularly drive through neighborhoods at 25 mph, you can now be ticketed. The practical benefit: slower traffic makes your street safer to walk, reduces noise from cut-through drivers, and generally makes residential areas more livable — which matters for where you choose to renew a lease.'
WHERE session_number = 153 AND profile_key = 'renter'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 363');

-- HB 445 | Renewable Energy for Large Facilities
UPDATE classifications
SET rationale = 'This law doesn''t lower your utility bill today. What it does is require large data centers and industrial facilities to generate their own renewable power within 10 years rather than competing with residential customers for shared grid capacity. If those facilities drew from the same grid as your apartment, utilities would have grounds to request significant rate increases. By requiring them to supply their own power, this law removes one of the largest potential drivers of future utility rate hikes that would show up in your monthly costs.'
WHERE session_number = 153 AND profile_key = 'renter'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 445');

-- SB 192 | Utility Call Center Relocation Notice
UPDATE classifications
SET rationale = 'This law doesn''t change your utility bills. What it does is require your electric or gas company to give advance notice before relocating its customer service operation out of state. The practical benefit: billing disputes, outage reports, and service questions are more likely to stay handled by a local team with real accountability to Delaware standards. If service quality drops after a relocation, this law gives regulators and the public earlier warning to act.'
WHERE session_number = 153 AND profile_key = 'renter'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 192');

-- SB 308 | Load Forecast Accountability
UPDATE classifications
SET rationale = 'This law doesn''t change your current utility costs. What it does is require independent verification of Delmarva''s electricity demand forecasts before new grid projects are approved. Every unnecessary infrastructure project the utility builds gets recovered through customer rates — rates that flow directly into your utility bills or your landlord''s operating costs, which eventually affect what you pay. This check limits Delmarva''s ability to justify rate increases with inflated demand projections.'
WHERE session_number = 153 AND profile_key = 'renter'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 308');

-- SB 326 | Delmarva Rate Protection
UPDATE classifications
SET rationale = 'Two brakes on Delmarva rate increases take effect now. The utility can no longer charge customers for non-essential infrastructure projects, and the interim rates it can collect while a rate increase is under regulatory review are capped. If your utility costs are bundled into your rent, this limits one lever your landlord could use to justify rent increases tied to rising operating costs. If you pay utilities directly, your bills are more protected from rate creep while rate cases are pending.'
WHERE session_number = 153 AND profile_key = 'renter'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 326');


-- ── WORKING PROFESSIONAL 👔 ───────────────────────────────────────────────────

-- HB 380 | DPDPA Data Privacy Update
-- Old: "reducing your risk" too vague
UPDATE classifications
SET rationale = 'Companies that hold your personal data — including employers, platforms, and retailers — must now conduct a formal data protection assessment before selling or sharing it with third parties. This doesn''t change your paycheck, but it reduces your exposure to the financial fallout of data misuse: fraudulent loans opened in your name, tax refund theft, or identity fraud can cost hundreds of hours and real money to resolve. The law is in effect now and applies to any company doing business with Delaware residents.'
WHERE session_number = 153 AND profile_key = 'workpro'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 380');

-- SB 263 | Minor League Baseball Exemption
-- Old: vague relevance to workpro
UPDATE classifications
SET rationale = 'This law exempts minor league baseball players from Delaware''s minimum wage law because their pay is governed by an MLB union contract that typically pays more. This doesn''t affect your wages or employment terms unless you work directly in professional baseball under that contract. If your employer argues this creates a precedent for other industry-specific wage exemptions, that''s not accurate — the exemption is narrowly limited to players under an existing major league collective bargaining agreement.'
WHERE session_number = 153 AND profile_key = 'workpro'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 263');


-- ── PUBLIC SECTOR 🏛️ ──────────────────────────────────────────────────────────

-- SB 336 | FY2027 Supplemental Appropriation
-- Old: "may fund" too vague
UPDATE classifications
SET rationale = 'Delaware''s FY2027 supplemental budget adds $146 million in one-time spending on top of the regular operating budget. Whether any of it affects your pay, equipment, or working conditions depends entirely on how your specific agency allocates its share — some agencies will see facility improvements or deferred pay adjustments, others won''t. Check directly with your department head or union rep for specifics. This money is available for fiscal year 2027 and does not carry forward.'
WHERE session_number = 153 AND profile_key = 'pubsec'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 336');


-- ── SMALL BUSINESS 💼 ─────────────────────────────────────────────────────────

-- SB 263 | Minor League Baseball Exemption
-- Old: already clear — keep as is, just ensure period
-- (Handled by blanket period fix above)

-- SB 325 | Fire Commission Background Checks
-- Old: "can affect" too indirect
UPDATE classifications
SET rationale = 'This law doesn''t change your fire inspection fees directly. However, your commercial property insurer uses your community''s fire protection rating when setting property and liability premiums. That rating is partly based on the reliability and integrity of local volunteer fire companies. Stronger fire department screening and accountability can improve that rating over time — and a better community fire rating can lower the insurance costs you pay as a business owner. The improvement is gradual, not immediate.'
WHERE session_number = 153 AND profile_key = 'smallbiz'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 325');

-- SB 141 | Auction House Spirits (now Helps You — direction was fixed)
-- Update to match Helps You framing
UPDATE classifications
SET rationale = 'If you run a licensed auction house in Delaware, you can now add spirits to your auction catalog — a new revenue channel for high-end or collectible liquor sales. Bottles must be kept off the auction floor and out of general circulation, so check the license requirements before sourcing inventory. If you''re in liquor retail or spirits distribution rather than auction, this opens a new competitive channel you should be aware of.'
WHERE session_number = 153 AND profile_key = 'smallbiz'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 141');

-- SB 293 | Youth Camp ACA Accreditation (now Helps You — direction was fixed)
-- Update to match Helps You framing
UPDATE classifications
SET rationale = 'If your youth camp holds American Camp Association accreditation, Delaware now automatically treats you as meeting state licensing requirements. In practical terms: you skip the separate state review process, and your camp becomes eligible for Purchase of Care child care subsidies — expanding your potential enrollment base. The tradeoff is that more ACA-accredited competitors can now access the same subsidy pathway, so factor that into your enrollment and pricing strategy.'
WHERE session_number = 153 AND profile_key = 'smallbiz'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 293');


-- ── LOW WAGE ⏱️ ───────────────────────────────────────────────────────────────

-- HB 380 | DPDPA Data Privacy Update
-- Old: "reducing your risk" too vague
UPDATE classifications
SET rationale = 'Employers, retailers, and platforms must now complete a formal data protection review before selling or sharing your personal information with third parties. This law doesn''t change your paycheck, but it reduces your exposure to the financial damage from identity theft — fraudulent credit cards, tax refund theft, or debt collectors pursuing loans you didn''t take out can cost months of time and real money to untangle. The law is in effect now for any company doing business with Delaware residents.'
WHERE session_number = 153 AND profile_key = 'lowwage'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 380');

-- SB 263 | Minor League Baseball Exemption
-- Old: "may be significantly better" too soft
UPDATE classifications
SET rationale = 'Minor league baseball players are exempt from Delaware''s minimum wage because their pay is set by an MLB union contract that pays more than the state minimum. If you work at a Delaware stadium or sports venue — in concessions, security, ticketing, or maintenance — this law doesn''t apply to you. You''re still covered by Delaware''s standard minimum wage, and your pay is unaffected by this exemption.'
WHERE session_number = 153 AND profile_key = 'lowwage'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 263');


-- ── VERIFY ────────────────────────────────────────────────────────────────────
SELECT
  b.bill_number,
  c.profile_key,
  c.direction,
  RIGHT(c.rationale, 1) AS ends_with,
  LEFT(c.rationale, 80) AS preview
FROM classifications c
JOIN bills b ON b.id = c.bill_id
WHERE c.session_number = 153
  AND c.rationale IS NOT NULL
ORDER BY b.bill_number, c.profile_key;
