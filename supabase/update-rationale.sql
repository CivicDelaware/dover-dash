-- Dover Dash — Persona-Specific Rationale for All Bill-Profile Pairs
-- 153rd General Assembly | July 2026
--
-- Adds "Why it matters to you" text to every classification entry that
-- currently has no rationale. Landlord and veteran entries are already
-- populated and are protected by the IS NULL guard.
--
-- Run in Supabase → SQL Editor → New Query → Paste → Run.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── HOMEOWNER 🏠 ──────────────────────────────────────────────────────────

-- HB 283 | Realty Transfer Tax (grandparent-grandchild exemption)
UPDATE classifications SET rationale = 'Transferring your home to a grandchild now skips the state realty transfer tax entirely — potentially saving thousands at closing. Note that the grandchild won''t also qualify for the standard first-time buyer exemption on the same transaction, so review the math with your attorney before any transfer.'
WHERE session_number = 153 AND profile_key = 'homeowner' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 283');

-- HB 363 | Residential 20 mph Speed Limit
UPDATE classifications SET rationale = 'Speed limits in your neighborhood drop to 20 mph — reducing traffic noise, pedestrian accidents, and cut-through traffic in front of your property. Watch for updated signage over the next five years to avoid speeding tickets when driving through residential zones yourself.'
WHERE session_number = 153 AND profile_key = 'homeowner' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 363');

-- HB 393 | Third-Party Electric Supplier Notice
UPDATE classifications SET rationale = 'If you''ve switched to a third-party electric supplier, they must now notify you 90 and 30 days before your contract auto-renews and 15 days before any rate change — so you''re never caught off guard by a higher electric bill or locked in to terms you didn''t knowingly agree to renew.'
WHERE session_number = 153 AND profile_key = 'homeowner' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 393');

-- HB 406 | Auto Insurance Repair Choice
UPDATE classifications SET rationale = 'Your auto insurer can no longer force you to use a specific repair shop as a condition of paying your claim — you can choose any qualified mechanic or body shop and still get your repair fully covered.'
WHERE session_number = 153 AND profile_key = 'homeowner' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 406');

-- HB 445 | Renewable Energy for Large Facilities
UPDATE classifications SET rationale = 'Large data centers in Delaware must generate their own renewable power over 10 years rather than drawing from the shared grid — protecting your home electricity bill from the rate spikes that would otherwise come from massive new industrial loads competing with residential customers.'
WHERE session_number = 153 AND profile_key = 'homeowner' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 445');

-- HB 458 | Backflow Preventer Exemption
UPDATE classifications SET rationale = 'If your home uses a public well rather than municipal water, you may still be required to install backflow preventers even if classified as low-hazard — so confirm your water source before assuming you''re exempt from inspection requirements under this law.'
WHERE session_number = 153 AND profile_key = 'homeowner' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 458');

-- HB 461 | NCC School Tax Reset
UPDATE classifications SET rationale = 'New Castle County school districts must reset their 2026–2027 tax rates so revenue doesn''t exceed last year''s levels while reassessment appeals are still being sorted out — capping your school property tax increase at your district''s historical growth rate (as low as 0.31% for Smyrna, up to 3.68% for Appoquinimink).'
WHERE session_number = 153 AND profile_key = 'homeowner' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 461');

-- HB 462 | NCC Split School Tax Rate
UPDATE classifications SET rationale = 'New Castle County school districts can continue charging commercial and industrial properties up to 1.85 times your residential school tax rate — meaning businesses absorb more of the school funding burden, which may slow future residential rate increases.'
WHERE session_number = 153 AND profile_key = 'homeowner' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 462');

-- HB 89 | Home Improvement Dispute Resolution
UPDATE classifications SET rationale = 'If a contractor leaves your renovation unfinished or does poor work, you now have a state-backed dispute resolution process — and if the contractor still refuses to cooperate, you can sue for up to triple your actual damages plus attorney fees.'
WHERE session_number = 153 AND profile_key = 'homeowner' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 89');

-- SB 192 | Utility Call Center Relocation Notice
UPDATE classifications SET rationale = 'If your electric or gas utility plans to move its customer service call center out of state, they must now give advance notice to regulators, workers, and union reps — giving you earlier warning before local service quality for billing disputes and outage support potentially declines.'
WHERE session_number = 153 AND profile_key = 'homeowner' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 192');

-- SB 275 | Underground Utility Safety
UPDATE classifications SET rationale = 'If you''re planning any digging on your property — fencing, a pool, landscaping — contractors and utility operators now have tighter legal deadlines to mark underground lines first, reducing your risk of accidental gas, water, or power line damage that could leave you facing a costly emergency repair.'
WHERE session_number = 153 AND profile_key = 'homeowner' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 275');

-- SB 308 | Load Forecast Accountability
UPDATE classifications SET rationale = 'Delaware regulators must now independently verify the electricity demand forecasts utilities submit — a watchdog measure meant to prevent over- or under-investment in the grid, both of which flow through as rate increases on your home electric bill.'
WHERE session_number = 153 AND profile_key = 'homeowner' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 308');

-- SB 316 | Attorney Lien Release
UPDATE classifications SET rationale = 'If you''ve paid off any lien on your property — not just a mortgage — your attorney can now file a legal release if the creditor fails to do so, preventing a lingering title cloud that could block or delay your ability to sell or refinance your home.'
WHERE session_number = 153 AND profile_key = 'homeowner' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 316');

-- SB 321 | Community Solar Net Crediting
UPDATE classifications SET rationale = 'If you subscribe to a community solar program through Delmarva Power, your solar credits and subscription charges are now automatically netted on one monthly bill — so you see one clear number instead of juggling separate invoices and trying to calculate your actual savings.'
WHERE session_number = 153 AND profile_key = 'homeowner' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 321');

-- SB 322 | Post-Reassessment School Tax Cap
UPDATE classifications SET rationale = 'After a county property reassessment, your school district can no longer automatically raise its tax rate by up to 10% — the increase is now capped by a formula tied to actual prior revenue and property growth, directly limiting the school tax jump you''ll see on your next bill.'
WHERE session_number = 153 AND profile_key = 'homeowner' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 322');

-- SB 325 | Fire Commission Background Checks
UPDATE classifications SET rationale = 'Stricter screening of volunteer fire company members doesn''t change your inspection fees directly, but stronger fire company integrity can improve your community''s fire protection rating — which insurers use when setting homeowners insurance premiums over time.'
WHERE session_number = 153 AND profile_key = 'homeowner' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 325');

-- SB 326 | Delmarva Power Spending Limits
UPDATE classifications SET rationale = 'Delmarva Power is now barred from passing the cost of non-essential infrastructure projects to customers, and the bill caps how much the utility can collect in interim rates while a rate hike request is pending — both should slow the pace of electric bill increases hitting your home.'
WHERE session_number = 153 AND profile_key = 'homeowner' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 326');


-- ── RENTER 🔑 ──────────────────────────────────────────────────────────────

-- HB 217 | Key Return Procedures
UPDATE classifications SET rationale = 'Your lease must now spell out exactly how and when to return your keys at move-out — and if it doesn''t, state default rules apply automatically — so your landlord can''t invent vague procedures after the fact to justify withholding your security deposit.'
WHERE session_number = 153 AND profile_key = 'renter' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 217');

-- HB 363 | Residential 20 mph Speed Limit
UPDATE classifications SET rationale = 'Speed limits on your block drop to 20 mph, making it safer to walk to your car, let kids play outside, and cut traffic noise — with five years for signage to catch up, so stay alert when driving through residential zones yourself.'
WHERE session_number = 153 AND profile_key = 'renter' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 363');

-- HB 393 | Third-Party Electric Supplier Notice
UPDATE classifications SET rationale = 'If your unit uses a third-party electric supplier, you must now receive written notice 90 and 30 days before your contract auto-renews and 15 days before any rate change — so you''re not blindsided by a higher electric bill buried in a renewal you didn''t see coming.'
WHERE session_number = 153 AND profile_key = 'renter' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 393');

-- HB 445 | Renewable Energy for Large Facilities
UPDATE classifications SET rationale = 'Requiring data centers to generate their own renewable power protects the shared electric grid from overload — which keeps your monthly utility bill from spiking when massive facilities compete with residential customers for the same grid capacity.'
WHERE session_number = 153 AND profile_key = 'renter' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 445');

-- SB 192 | Utility Call Center Relocation Notice
UPDATE classifications SET rationale = 'Your electric or gas utility must give advance notice before moving its customer service call center out of state — so you''ll know earlier if the local support you rely on for billing questions and outage reporting is about to change.'
WHERE session_number = 153 AND profile_key = 'renter' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 192');

-- SB 235 | Manufactured Home Rent Cap Permanent
UPDATE classifications SET rationale = 'If you rent a lot in a manufactured home community, the formula limiting how much your lot rent can increase each year is now permanent law — replacing pilot rules that were set to expire and would have given community owners broader latitude to raise your rent.'
WHERE session_number = 153 AND profile_key = 'renter' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 235');

-- SB 292 | Reentry Housing Discharge Planning
UPDATE classifications SET rationale = 'If your rent is paid through a state reentry fund, your landlord can no longer terminate your lease without first helping you create a housing plan — and if they skip this step, they''re barred from receiving state reentry housing payments for a full year across all their units.'
WHERE session_number = 153 AND profile_key = 'renter' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 292');

-- SB 308 | Load Forecast Accountability
UPDATE classifications SET rationale = 'Independent oversight of utility electricity demand forecasts is meant to prevent grid mismanagement — which matters because both over-investment and grid failures from under-investment get passed on as rate increases in the utility portion of your monthly expenses.'
WHERE session_number = 153 AND profile_key = 'renter' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 308');

-- SB 321 | Community Solar Net Crediting
UPDATE classifications SET rationale = 'If you participate in a community solar program, Delmarva Power now automatically nets your solar credits against your subscription charges on a single monthly bill — making it easy to see your actual savings without sorting through separate invoices.'
WHERE session_number = 153 AND profile_key = 'renter' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 321');

-- SB 326 | Delmarva Power Spending Limits
UPDATE classifications SET rationale = 'Delmarva Power can no longer pass the cost of optional infrastructure upgrades to customers or collect excessive interim rates while a rate hike is pending — a direct brake on the electric bill increases that flow through to your utility costs as a renter.'
WHERE session_number = 153 AND profile_key = 'renter' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 326');


-- ── SENIOR 🌅 ──────────────────────────────────────────────────────────────

-- HB 338 | Preventive Care Continuity
UPDATE classifications SET rationale = 'Your health insurance must keep covering preventive screenings and vaccines that were federally recommended as of January 1, 2025 — protecting your no-cost access to annual checkups, cancer screenings, and flu shots regardless of any federal policy rollbacks.'
WHERE session_number = 153 AND profile_key = 'senior' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 338');

-- HB 429 | Biosimilar Step Therapy
UPDATE classifications SET rationale = 'If your doctor prescribes a biologic medication, your insurer can no longer force you through a trial of cheaper alternatives first when an interchangeable biosimilar is available — particularly important for seniors managing chronic conditions like rheumatoid arthritis or Crohn''s disease who need consistent medication access.'
WHERE session_number = 153 AND profile_key = 'senior' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 429');

-- SB 219 | Military Pension Tax Exemption
UPDATE classifications SET rationale = 'If you''re a military retiree living in Delaware, your state income tax exemption on military pension income rises from $12,500 to $25,000 over three years starting in 2027 — a direct reduction in your annual state tax bill regardless of your age.'
WHERE session_number = 153 AND profile_key = 'senior' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 219');

-- SB 22 | Mental Health Parity
UPDATE classifications SET rationale = 'Your health insurance must now cover mental health and substance use treatment on the same terms as physical illness — no higher copays, no tighter visit limits, and mandatory out-of-network coverage when in-network mental health providers aren''t available in your area.'
WHERE session_number = 153 AND profile_key = 'senior' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 22');

-- SB 271 | PBM Regulation
UPDATE classifications SET rationale = 'New rules on pharmacy benefit managers — the middlemen who manage your drug coverage — prohibit spread pricing and set stricter reimbursement standards for pharmacies, directly lowering what you pay at the counter for the prescription medications your plan covers.'
WHERE session_number = 153 AND profile_key = 'senior' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 271');

-- SB 301 | Hospital Discharge Plan for Labor
UPDATE classifications SET rationale = 'If a family member is sent home from a hospital while showing signs of active labor, the hospital must now provide a written discharge plan with aftercare instructions, transportation verification, and a backup delivery facility — a protection that also applies if you''re accompanying someone at risk of premature discharge.'
WHERE session_number = 153 AND profile_key = 'senior' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 301');

-- SB 307 | Lifeline Telecom Expansion
UPDATE classifications SET rationale = 'Delaware can now certify more carriers to offer Lifeline-discounted phone and internet service — if you''re on Medicare or a qualifying benefit, you''ll have more provider choices for the subsidized phone or internet access many seniors rely on to stay connected and reach emergency services.'
WHERE session_number = 153 AND profile_key = 'senior' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 307');

-- SB 340 | Long-Term Care Insurance Minimums
UPDATE classifications SET rationale = 'Nursing homes and long-term care facilities must now carry at least $1 million in liability insurance per claim — meaning if something goes wrong during your care or a family member''s stay, there''s a larger insurance pool available to cover damages and legal claims against the facility.'
WHERE session_number = 153 AND profile_key = 'senior' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 340');

-- SB 347 | Medical Debt Protection
UPDATE classifications SET rationale = 'Hospitals can no longer seize your personal property — your car, furniture, or belongings — to collect an unpaid medical bill, and any collector suing you over medical debt must now disclose if a hospital is behind the claim, giving you earlier warning to respond.'
WHERE session_number = 153 AND profile_key = 'senior' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 347');


-- ── WORK PRO 👔 ────────────────────────────────────────────────────────────

-- HB 338 | Preventive Care Continuity
UPDATE classifications SET rationale = 'Your employer-sponsored health plan must keep covering all preventive care and vaccines that were federally recommended as of January 1, 2025 — even if federal guidance is rolled back — so you won''t lose no-cost screenings or immunizations because of policy changes in Washington.'
WHERE session_number = 153 AND profile_key = 'workpro' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 338');

-- HB 380 | DPDPA Update
UPDATE classifications SET rationale = 'Delaware''s data privacy law gives you stronger rights over how employers and companies collect and share your personal data — including new due-diligence requirements before your information is sold or disclosed to a third party.'
WHERE session_number = 153 AND profile_key = 'workpro' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 380');

-- HB 406 | Auto Insurance Repair Choice
UPDATE classifications SET rationale = 'Your auto insurer can no longer require you to use a preferred repair shop as a condition of paying your claim — a meaningful protection if you depend on your vehicle for work and need a trusted mechanic, not one your insurer chose to cut costs.'
WHERE session_number = 153 AND profile_key = 'workpro' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 406');

-- HB 429 | Biosimilar Step Therapy
UPDATE classifications SET rationale = 'If your employer''s health plan covers a biologic your doctor prescribed, your insurer can no longer make you try a cheaper alternative first — getting you to the right treatment faster without the delays and extra out-of-pocket costs of insurer-mandated step therapy detours.'
WHERE session_number = 153 AND profile_key = 'workpro' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 429');

-- HB 438 | Service Letter for Child-Serving Entities
UPDATE classifications SET rationale = 'If you work in a school, youth camp, or other child-serving setting, prospective employers must verify your employment history through a formal service letter — giving you a documented record of your tenure and putting the burden of response on your former employer, not you.'
WHERE session_number = 153 AND profile_key = 'workpro' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 438');

-- SB 22 | Mental Health Parity
UPDATE classifications SET rationale = 'Your employer''s health plan must now cover mental health and substance use treatment on the same terms as physical health — including out-of-network coverage when in-network providers aren''t available near you — so you pay no more for behavioral health than you would for a physical illness.'
WHERE session_number = 153 AND profile_key = 'workpro' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 22');

-- SB 263 | Minor League Baseball Exemption
UPDATE classifications SET rationale = 'Minor league baseball players'' wages are now set by their MLB union contract rather than state minimum wage — a model that gives organized workers above-minimum negotiated pay, and a reminder that collective bargaining can replace state wage floors with terms that may be significantly better.'
WHERE session_number = 153 AND profile_key = 'workpro' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 263');

-- SB 271 | PBM Regulation
UPDATE classifications SET rationale = 'If your employer''s health plan uses a pharmacy benefit manager, new audit and reimbursement rules reduce the PBM''s ability to pocket the difference between what your plan pays and what the pharmacy receives — keeping more of that value at the counter for you.'
WHERE session_number = 153 AND profile_key = 'workpro' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 271');

-- SB 297 | Consumer Fraud Post-Transaction
UPDATE classifications SET rationale = 'Delaware''s consumer fraud law now covers deceptive business behavior after a purchase — like a company refusing to honor a repair promise or sending threatening collection notices — giving you legal protection through the full lifecycle of a transaction, not just at the point of sale.'
WHERE session_number = 153 AND profile_key = 'workpro' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 297');

-- SB 301 | Hospital Discharge Plan for Labor
UPDATE classifications SET rationale = 'If you or your partner is sent home from a hospital while showing signs of active labor, the facility must now give you a written discharge plan covering aftercare, transportation verification, and a backup delivery location — reducing the risk of a dangerous situation that leads to unexpected emergency bills.'
WHERE session_number = 153 AND profile_key = 'workpro' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 301');

-- SB 347 | Medical Debt Protection
UPDATE classifications SET rationale = 'If you carry unpaid medical debt, large hospitals can no longer seize your personal property to collect it — and any lawsuit over your medical debt must now disclose if a hospital is behind the claim, giving you a clearer picture of who you''re actually dealing with.'
WHERE session_number = 153 AND profile_key = 'workpro' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 347');

-- SB 63 | Worker Misclassification (Veto Override)
UPDATE classifications SET rationale = 'If you''ve been misclassified as an independent contractor when you''re really an employee, the general contractor on your project is now jointly responsible for the subcontractor''s wage violations — giving you a better-funded target to recover the overtime, benefits, and workers'' comp you were owed.'
WHERE session_number = 153 AND profile_key = 'workpro' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 63');


-- ── PUBLIC SECTOR 🏛️ ────────────────────────────────────────────────────────

-- HB 423 | State 457(b) Auto-Enrollment
UPDATE classifications SET rationale = 'As a new state employee, you''ll be automatically enrolled in the 457(b) deferred compensation retirement plan within 90 days of hire — pre-tax contributions start from your paycheck, but you can opt out and get a full refund within 120 days if you''d rather manage retirement savings differently.'
WHERE session_number = 153 AND profile_key = 'pubsec' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 423');

-- SB 219 | Military Pension Tax Exemption
UPDATE classifications SET rationale = 'If you''re a public employee who also draws military retirement pay, your state income tax exemption on that pension income rises to $25,000 by 2029 — directly reducing your combined annual state tax burden if you''re pulling from both a government pension and military retirement.'
WHERE session_number = 153 AND profile_key = 'pubsec' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 219');

-- SB 231 | School Social Worker Salary Supplement
UPDATE classifications SET rationale = 'If you''re a school social worker who holds a Licensed Clinical Social Worker credential, you now receive a salary supplement on top of your base district pay — a direct increase to your take-home income that applies statewide regardless of which school district employs you.'
WHERE session_number = 153 AND profile_key = 'pubsec' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 231');

-- SB 237 | NCC Attorney Tenure
UPDATE classifications SET rationale = 'If you''re an Assistant County Attorney or legal professional for New Castle County, the County can now grant you formal tenure protections — giving your position greater job security and making it harder to eliminate your role for political reasons between administrations.'
WHERE session_number = 153 AND profile_key = 'pubsec' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 237');

-- SB 279 | School OT Salary Schedule
UPDATE classifications SET rationale = 'If you''re a school-based occupational therapist, your degree and credits are now evaluated on the same salary lane schedule used for audiologists and speech-language pathologists — giving you a standardized, fairer starting pay and a clearer path for salary advancement.'
WHERE session_number = 153 AND profile_key = 'pubsec' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 279');

-- SB 335 | FY2027 Appropriations
UPDATE classifications SET rationale = 'Delaware''s FY2027 operating budget is signed and funded — your agency''s operations, your salary, pension contributions, and health benefits as a state employee are all covered for the fiscal year under this spending plan.'
WHERE session_number = 153 AND profile_key = 'pubsec' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 335');

-- SB 336 | FY2027 One-Time Supplemental
UPDATE classifications SET rationale = 'A $146 million one-time supplemental appropriation for FY2027 may fund deferred pay adjustments, facility upgrades at your workplace, or other one-time agency needs — watch for agency-specific allocations that could affect your working conditions or compensation this fiscal year.'
WHERE session_number = 153 AND profile_key = 'pubsec' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 336');


-- ── SMALL BUSINESS 💼 ───────────────────────────────────────────────────────

-- HB 310 | Job Creation Tax Credit
UPDATE classifications SET rationale = 'Large energy-hungry facilities like data centers are now excluded from the job-creation tax credits your qualifying small business can still claim — keeping those credits meaningful and available for operations like yours that actually create local employment.'
WHERE session_number = 153 AND profile_key = 'smallbiz' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 310');

-- HB 364 | Film Tax Credit
UPDATE classifications SET rationale = 'If your small business spends money on qualifying film or media production in Delaware, you can now apply the new film tax credit against your state corporate income tax bill — carrying it forward up to five years or transferring it if you can''t use it all immediately.'
WHERE session_number = 153 AND profile_key = 'smallbiz' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 364');

-- HB 373 | THC Beverage Regulation
UPDATE classifications SET rationale = 'If you manufacture, distribute, or sell THC-infused beverages, a new regulatory framework requires licensing, third-party lab testing, packaging standards, and a $0.50 per-container tax collected at the distributor level — adding real compliance cost and margin pressure to your operations.'
WHERE session_number = 153 AND profile_key = 'smallbiz' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 373');

-- HB 381 | Data Breach Notification
UPDATE classifications SET rationale = 'If your business suffers a data breach, Delaware now has clearer and tighter rules on exactly when you must report it to the Attorney General — reducing ambiguity but also narrowing your window to self-remediate before mandatory public disclosure kicks in.'
WHERE session_number = 153 AND profile_key = 'smallbiz' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 381');

-- HB 438 | Service Letter for Child-Serving Entities
UPDATE classifications SET rationale = 'If you operate a school, youth camp, or other child-serving facility, you must now respond to service letter requests from prospective employers for former employees — adding an administrative obligation and potential legal exposure if you fail to respond in a timely way.'
WHERE session_number = 153 AND profile_key = 'smallbiz' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 438');

-- HB 445 | Renewable Energy for Large Facilities
UPDATE classifications SET rationale = 'If your business qualifies as a large energy user, you''ll face a 10-year requirement to generate your own renewable power in-state — a significant capital obligation that will reshape your operating cost structure and long-term facility planning.'
WHERE session_number = 153 AND profile_key = 'smallbiz' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 445');

-- HB 89 | Home Improvement Dispute Resolution
UPDATE classifications SET rationale = 'If you''re a home improvement contractor, customers now have a state-backed dispute process they can use against you — and failing to participate in good faith is a Consumer Fraud Act violation that can trigger license suspension, revocation, and triple-damages lawsuits.'
WHERE session_number = 153 AND profile_key = 'smallbiz' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 89');

-- SB 141 | Auction House Spirits
UPDATE classifications SET rationale = 'Licensed auction houses can now sell spirits at auction — creating a new competitive channel in the high-end liquor market and adding a licensing pathway to navigate if your business is in hospitality, liquor retail, or spirits distribution.'
WHERE session_number = 153 AND profile_key = 'smallbiz' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 141');

-- SB 18 | Money Transmission Act
UPDATE classifications SET rationale = 'If your business transmits money or handles cryptocurrency in Delaware, the new framework requires updated net worth thresholds, higher surety bonds, and tighter consumer disclosure rules — with up to one year to comply, but real upfront cost for any fintech or payment processor in the state.'
WHERE session_number = 153 AND profile_key = 'smallbiz' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 18');

-- SB 235 | Manufactured Home Rent Cap Permanent
UPDATE classifications SET rationale = 'If you own manufactured home community lots, the formula capping annual lot rent increases is now permanent law — replacing expiring pilot rules that gave you more flexibility, directly constraining rental income growth on any manufactured home lots in your portfolio.'
WHERE session_number = 153 AND profile_key = 'smallbiz' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 235');

-- SB 26 | Unemployment During Labor Disputes
UPDATE classifications SET rationale = 'If your employees go on strike, they can now collect unemployment benefits after two weeks — removing the financial pressure to settle quickly. This increases your risk exposure during a prolonged labor dispute and raises the strategic cost of holding firm in wage negotiations.'
WHERE session_number = 153 AND profile_key = 'smallbiz' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 26');

-- SB 263 | Minor League Baseball Exemption
UPDATE classifications SET rationale = 'If you''re a small business affiliated with minor league baseball — concessions, merchandise, stadium services — the wage exemption applies only to players under their MLB union contract, not to your employees, so you still need separate wage compliance tracking for your own staff.'
WHERE session_number = 153 AND profile_key = 'smallbiz' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 263');

-- SB 293 | Youth Camp Licensing
UPDATE classifications SET rationale = 'If your youth camp holds ACA accreditation, Delaware now automatically treats you as meeting state licensing requirements — cutting red tape. But it also means more ACA-accredited competitors can qualify for Purchase of Care child care subsidies, changing your enrollment competitive landscape.'
WHERE session_number = 153 AND profile_key = 'smallbiz' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 293');

-- SB 297 | Consumer Fraud Post-Transaction
UPDATE classifications SET rationale = 'Delaware''s consumer fraud law now explicitly covers post-sale conduct — including collection letters, broken repair promises, and disputes after a transaction closes. If your business maintains any ongoing customer relationships, your compliance exposure window has significantly widened.'
WHERE session_number = 153 AND profile_key = 'smallbiz' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 297');

-- SB 315 | SBIR/STTR Matching Grants
UPDATE classifications SET rationale = 'If your small business wins a federal SBIR or STTR research grant and is headquartered in Delaware, the state can now layer on matching or supplemental funds — giving you more capital to develop and commercialize your product without taking on debt or diluting equity.'
WHERE session_number = 153 AND profile_key = 'smallbiz' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 315');

-- SB 325 | Fire Commission Background Checks
UPDATE classifications SET rationale = 'The Fire Prevention Commission''s expanded member screening authority doesn''t change your inspection fees directly, but stronger volunteer fire company integrity can affect your commercial fire protection rating — which insurers use when setting business property and liability premiums.'
WHERE session_number = 153 AND profile_key = 'smallbiz' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 325');

-- SB 63 | Worker Misclassification (Veto Override)
UPDATE classifications SET rationale = 'As a general contractor, you''re now jointly liable for any worker misclassification violations your subcontractors commit — meaning you need to vet your subs'' labor practices before signing them on, or risk absorbing their penalties and legal costs on top of your own.'
WHERE session_number = 153 AND profile_key = 'smallbiz' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 63');

-- SB 75 | Marijuana Zoning (Veto Override)
UPDATE classifications SET rationale = 'If you run a licensed cannabis business, counties can no longer block your operation through local ordinances if you meet state zoning requirements — removing a key barrier to opening or expanding. If you''re a neighboring non-cannabis business, a dispensary may now open nearby with fewer local obstacles than before.'
WHERE session_number = 153 AND profile_key = 'smallbiz' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 75');


-- ── LOW WAGE ⏱️ ─────────────────────────────────────────────────────────────

-- HB 133 | Court Fine Waiver
UPDATE classifications SET rationale = 'If you''re on SNAP, Medicaid, or another public benefit and face a court fine you can''t afford, judges can now waive it entirely — so a traffic ticket or minor offense can''t spiral into compounding debt that threatens your housing, your license, or your job.'
WHERE session_number = 153 AND profile_key = 'lowwage' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 133');

-- HB 380 | DPDPA Update
UPDATE classifications SET rationale = 'Companies that collect your personal data — including employers, retailers, and platforms — now face stricter requirements before selling or sharing it with third parties, giving you more control over your information and reducing your risk of financial harm from data misuse.'
WHERE session_number = 153 AND profile_key = 'lowwage' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 380');

-- HB 419 | Foster Care Child Care
UPDATE classifications SET rationale = 'If you''re a working foster parent, children placed in your care are now automatically eligible for the state''s Purchase of Care child care subsidy — no separate application needed, so you can access coverage immediately without a paperwork gap that forces you to choose between going to work and finding care.'
WHERE session_number = 153 AND profile_key = 'lowwage' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 419');

-- SB 26 | Unemployment During Labor Disputes
UPDATE classifications SET rationale = 'If you''re off work because of a strike or labor dispute, you can now collect unemployment benefits after a two-week wait — and that wait is waived entirely if your employer broke a contract or hired a permanent replacement for your job.'
WHERE session_number = 153 AND profile_key = 'lowwage' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 26');

-- SB 263 | Minor League Baseball Exemption
UPDATE classifications SET rationale = 'Minor league baseball players are now exempt from state minimum wage because their pay is set by an MLB union contract — a structure that generally gives them above-minimum pay. Stadium and support staff who aren''t covered by that contract still fall under Delaware''s standard minimum wage rules.'
WHERE session_number = 153 AND profile_key = 'lowwage' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 263');

-- SB 297 | Consumer Fraud Post-Transaction
UPDATE classifications SET rationale = 'If a business sends threatening letters after a purchase, refuses to honor a warranty, or harasses you over a disputed bill, Delaware''s consumer fraud law now covers that — giving the Attorney General the power to pursue companies for post-sale misconduct that previously fell in a legal gray zone.'
WHERE session_number = 153 AND profile_key = 'lowwage' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 297');

-- SB 307 | Lifeline Telecom Expansion
UPDATE classifications SET rationale = 'Delaware can now approve more carriers to offer the federal Lifeline phone and internet discount — if you''re on SNAP, Medicaid, or another qualifying benefit, you''ll have more provider options for the subsidized connection that keeps you reachable for work, healthcare, and emergencies.'
WHERE session_number = 153 AND profile_key = 'lowwage' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 307');

-- SB 309 | Inmate Pay Protection
UPDATE classifications SET rationale = 'If you or a family member earns wages through a prison work program, the state can no longer deduct a share to cover housing costs — meaning those earnings stay in the account for reentry expenses, family support, or debt repayment rather than being clawed back by the facility.'
WHERE session_number = 153 AND profile_key = 'lowwage' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 309');

-- SB 347 | Medical Debt Protection
UPDATE classifications SET rationale = 'If a hospital sends your medical bill to collections, the collector can no longer seize your car, furniture, or other personal property to satisfy the debt — and any court filing must disclose if a large hospital is behind the claim, so you know exactly who you''re up against before you respond.'
WHERE session_number = 153 AND profile_key = 'lowwage' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 347');

-- SB 63 | Worker Misclassification (Veto Override)
UPDATE classifications SET rationale = 'If a subcontractor misclassifies you as an independent contractor to skip overtime, benefits, or minimum wage, the general contractor overseeing the project is now equally on the hook — giving you a better-funded target to recover what you were owed.'
WHERE session_number = 153 AND profile_key = 'lowwage' AND rationale IS NULL
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 63');


-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFY: Check that rationale is now populated across all profiles
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  b.bill_number,
  c.profile_key,
  c.direction,
  CASE WHEN c.rationale IS NULL THEN '❌ MISSING' ELSE '✅ ' || LEFT(c.rationale, 50) END AS rationale_status
FROM classifications c
JOIN bills b ON b.id = c.bill_id
WHERE c.session_number = 153
ORDER BY b.bill_number, c.profile_key;
