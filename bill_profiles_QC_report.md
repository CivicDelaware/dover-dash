# Bill-Profile Taxonomy: Six Sigma Quality Check
**Framework:** Moody's 5-Test Wall Test  
**Date:** July 18, 2026  
**Bills reviewed:** 53 | **Issues found:** 25 | **Pass rate:** 52.8% (28/53)

## The 5 Tests

Each bill-profile mapping must pass all of:
1. **Two-hop rule** — Bill → mechanism → wallet (max 2 steps, no speculation chains)
2. **Named mechanism** — One of: tax, fee, cost mandate, subsidy, labor cost, rate, grant
3. **Profile specificity** — Impact falls disproportionately on *this* profile, not everyone
4. **Materiality** — Meaningful dollar impact (not trivial or purely theoretical)
5. **One-sentence test** — The wallet_rationale explains the money flow in a clean sentence

---

## ✅ PASS — 28 Bills

| Bill | Profile(s) | Mechanism |
|------|-----------|-----------|
| HB 133 w/ HA 4 | lowwage | Court fee waiver |
| HB 338 | workpro, senior | Insurance coverage mandate → lower OOP |
| HB 364 w/ HA 2 | smallbiz *(film only)* | Tax credit |
| HB 373 w/ HA 1 + SA 3 | smallbiz *(cannabis bev only)* | Compliance cost |
| HB 381 | smallbiz | Breach notification compliance cost |
| HB 423 | pubsec | 457(b) auto-enrollment → retirement savings |
| HB 429 | workpro, senior | Step therapy exception → drug cost savings |
| HB 461 | homeowner | School tax rate reset → property tax |
| HB 462 | homeowner | School tax assessment → property tax |
| HB 89 w/ HA 1 | homeowner, smallbiz | Dispute resolution → money recovery / compliance cost |
| SB 18 w/ SA 1 + HA 2 | smallbiz | Money transmission licensing cost |
| SB 219 w/ SA 1 | senior, pubsec | Military pension income tax exemption |
| SB 22 w/ HA 1 | workpro, senior | Mental health insurance coverage mandate |
| SB 231 | pubsec | Salary supplement for school social workers |
| SB 235 | renter, smallbiz | Manufactured home rent cap / landlord income constraint |
| SB 237 | pubsec | County attorney compensation authorization |
| SB 26 | lowwage, smallbiz | Lockout UI eligibility → wage replacement / UI cost |
| SB 271 w/ SA 1 | senior, workpro | PBM audit protections → Rx cost reduction |
| SB 279 | pubsec | OT pay schedule clarification → salary |
| SB 307 | lowwage, senior | Lifeline carrier designation → subsidy access |
| SB 309 w/ SA 1 | lowwage | Removes DOC wage deductions from inmates |
| SB 315 w/ SA 1 + HA 1 | smallbiz | SBIR/STTR matching grants |
| SB 321 w/ SA 1 | homeowner, renter | Community solar net crediting → electricity credits |
| SB 322 | homeowner | Post-reassessment school tax cap |
| SB 335 | pubsec | FY2027 appropriations → salary funding |
| SB 336 | pubsec | Supplemental appropriation |
| SB 347 | senior, workpro, lowwage | Medical debt collection lien prohibition |
| SB 63 w/ SA 1 | workpro, lowwage, smallbiz | Contractor misclassification → employee protections |

---

## 🔴 CRITICAL — Direction Errors (8 bills)

The Helps You / Watch Out label is backward relative to what the bill actually does.

---

### HB 283 — homeowner: Watch Out → **should be Helps You**
**Why:** The bill *clarifies* that spouse-to-spouse property transfers are *exempt* from Delaware's Realty Transfer Tax. An exemption = fewer taxes paid = Helps You for homeowners transferring property to a spouse.  
**Fix:** Change direction to `Helps You`. Update rationale: *"Clarifies the RTT spousal exemption under Title 30, confirming no transfer tax is owed on property conveyed between spouses — directly eliminating a potential $thousands tax liability on interspousal home transfers."*

---

### HB 458 w/ HA 1 — homeowner: Watch Out → **should be Helps You**
**Why:** The bill *prohibits* counties/municipalities from requiring backflow preventers in low-risk residential structures. Removing a mandate saves homeowners the cost of installation, annual testing, and certification.  
**Fix:** Change direction to `Helps You`. Update rationale: *"Bars local governments from requiring backflow preventers in low-risk residential plumbing, eliminating a mandate that cost homeowners hundreds of dollars in installation and annual inspection fees."*

---

### SB 75 — smallbiz: Watch Out → **should be Helps You**
**Why:** The bill *limits county restrictions* on marijuana establishments — overriding local zoning and permit denials. Removing barriers = Helps cannabis business operators.  
**Fix:** Change direction to `Helps You`. Update rationale: *"Strips county authority to block licensed marijuana retailers through local zoning or permit denials, directly eliminating one of the most expensive compliance obstacles facing cannabis small businesses in Delaware."*

---

### SB 141 w/ SA 1 — smallbiz: Watch Out → **should be Helps You**
**Why:** The bill *expands* what auction houses can do — allowing them to auction alcoholic beverages under their existing ABC license. This is a revenue opportunity, not a burden.  
**Fix:** Change direction to `Helps You`. Update rationale: *"Allows licensed Delaware auction houses to sell alcoholic beverages as part of estate and collection auctions without a separate license, adding a new revenue stream for auction business operators."*

---

### SB 263 — workpro: Helps You, lowwage: Helps You → **should be Watch Out for both (or REMOVE)**
**Why:** This bill *adds minor league baseball players to the existing exemptions from minimum wage and recordkeeping requirements*. That means these workers lose minimum wage protection — the bill explicitly expands who is carved out. The direction is exactly backwards.  
**Fix:** Change both to `Watch Out`, or remove entirely — neither profile benefits from a minimum wage exemption. If kept: *"Exempts minor league baseball players from Delaware's minimum wage and recordkeeping laws, removing wage floor protections from this class of low-paid athletes."* If removed, reconsider whether any profile actually benefits (team operators ≈ not typical smallbiz).

---

### SB 293 w/ SA 1 + HA 1 — smallbiz: Watch Out → **should be Helps You**
**Why:** The bill *simplifies* licensing for ACA-accredited youth camps — reducing what they must do to comply. Fewer requirements = lower operating costs.  
**Fix:** Change direction to `Helps You`. Update rationale: *"Streamlines licensing for ACA-accredited youth camps by accepting the ACA's own accreditation as satisfying state inspection requirements, directly reducing the regulatory compliance burden and associated costs for camp operators."*

---

### SB 316 — homeowner: Watch Out → **should be Helps You**
**Why:** The bill enables a licensed attorney to record a satisfaction of mortgage when the lender fails to do so within 45 days of payoff. This *helps* homeowners — it unblocks a stuck lien clearance and avoids costly legal action to force lender compliance.  
**Fix:** Change direction to `Helps You`. Update rationale: *"Authorizes attorneys to record mortgage satisfaction when lenders fail to discharge within 45 days of payoff, protecting homeowners from being stuck with unreleased liens that cloud title and can block future sales or refinancing."*

---

### SB 326 w/ SA 1 — homeowner: Watch Out, renter: Watch Out → **should be Helps You for both**
**Why:** The bill requires utilities to: (1) increase billing transparency, (2) list DPB contact info, (3) offer budget billing, and (4) require customer consent for budget billing enrollment. These are all consumer-protective additions. Nothing in the bill raises rates or costs for homeowners/renters.  
**Fix:** Change both directions to `Helps You`. Update rationale: *"Requires electric utilities to increase bill transparency, provide regulator contact info, and offer budget billing with customer consent — directly giving residential customers better tools to manage and dispute their electricity costs."*

---

## 🟠 HIGH — Rationale Describes a Different Bill (5 bills)

The rationale is boilerplate or describes entirely different legislation. The wallet link to the stated profile may still exist, but needs to be grounded in what the bill actually does.

---

### HB 217 w/ HA 1 — renter: Helps You
**Problem:** Rationale says "allow tenants to keep pets in rental housing, removing lease restrictions...and reducing arbitrary pet deposit demands." The actual bill is about *key surrender procedures at lease end* — requiring leases to specify what happens with keys when a tenant moves out.  
**Wallet link for actual bill:** Key surrender clarity → prevents landlords from claiming tenant failed to return keys → protects security deposit.  
**Fix rationale:** *"Requires leases to set clear procedures for key surrender at move-out, removing landlord discretion to claim key-return failures that would otherwise provide grounds for security deposit deductions."*

---

### HB 363 w/ HA 1 — homeowner: Helps You, renter: Helps You
**Problem:** Rationale says "limiting predatory towing in residential zones; reduces unexpected vehicle removal fees." The actual bill changes the *residential speed limit to 20 mph* with a 5-year implementation window.  
**Wallet link for speed limits:** Speed limit changes → reduced speeding fines for residents? Safer streets → lower auto insurance? Both are 3+ hops and speculative.  
**Recommendation:** **REMOVE both profiles.** A speed limit change does not have a direct or defensible wallet impact on homeowners or renters as a class. This is a public safety bill, not a wallet bill.

---

### HB 393 w/ HA 1 — homeowner: Helps You, renter: Helps You
**Problem:** Rationale says "explicit consumer protections for public utility customers...new rights against rate discrimination, service disconnections, and unfair billing." The actual bill says an *individual electric supplier agent* cannot be *fined or imprisoned* for violations. This limits penalties on sales agents, not consumers.  
**Wallet link for actual bill:** Decriminalizing agent violations doesn't reduce rates or fees for consumers. If anything, removing deterrence could harm ratepayers (agents face less accountability).  
**Recommendation:** **REMOVE both profiles.** No defensible wallet link to homeowners or renters.

---

### SB 192 — homeowner: Helps You, renter: Helps You
**Problem:** Rationale says "limiting utilities' ability to impose unreasonable charges." The actual bill requires utilities to *notify the PSC and provide a transition plan if they relocate a call center outside the service area*. This is a service quality/jobs transparency measure, not a billing protection.  
**Wallet link for actual bill:** Call center location has no direct connection to utility rates or residential bills.  
**Recommendation:** **REMOVE both profiles.** Fails two-hop rule and named mechanism test — no transmission mechanism from call center location to ratepayer wallet.

---

### HB 310 w/ SA 1 — smallbiz: Helps You
**Problem:** Rationale says "Amends Title 30 business tax credits and deductions, directly reducing state tax liability." The actual bill *excludes large energy use facilities from the definition of 'qualified facility'* for electricity rate calculations — this is an energy regulatory bill, not a tax credit bill.  
**Wallet link for actual bill:** Large facilities excluded from qualified facility definition → affects how electricity rates are structured (possibly protecting smaller businesses from cross-subsidizing large industrial users). But this chain requires PUC rate proceedings to intervene — 3+ hops.  
**Recommendation:** **REMOVE smallbiz profile.** The rationale describes a different bill. The actual bill's wallet link to small businesses requires too many hops through utility rate proceedings.

---

## 🟡 MEDIUM — Wrong or Weak Profile Mapping (12 bills)

The direction may be correct, but the profile doesn't fit or the wallet link is too attenuated.

---

### HB 380 w/ HA 2 — workpro: Helps You, lowwage: Helps You
**Problem:** Privacy rights → "reducing exposure to financial harm from data misuse" requires: data protection law → employer/corp can't misuse data → (somehow) prevented financial loss. This chain is speculative — financial harm from data misuse is not guaranteed and usually requires fraud/identity theft to materialize, which are subsequent acts beyond the bill's scope.  
**Tests failed:** Two-hop rule (3+ hops), Named mechanism (no direct financial mechanism), Profile specificity (applies to all consumers, not specifically workers).  
**Recommendation:** **REMOVE both profiles.** Data privacy is not a direct wallet protection.

---

### HB 406 — homeowner: Helps You
**Problem:** The bill prohibits insurers from steering auto repair to specific shops. This benefit applies to anyone with auto insurance — it is not specific to homeowners. Renters drive cars too.  
**Tests failed:** Profile specificity — auto insurance anti-steering isn't homeowner-specific.  
**Recommendation:** **REMOVE homeowner.** Keep workpro if desired (workers who depend on their vehicles). Note: even workpro is a stretch since all drivers benefit equally.

---

### HB 419 w/ HA 1 — lowwage: Helps You
**Problem:** The bill provides automatic Purchase of Care eligibility when a child is placed in foster care. This benefits foster families — who may be middle-income — and the children in foster care. It's not a general childcare subsidy expansion for low-wage workers.  
**Tests failed:** Profile specificity — the population is foster families, not low-wage workers generally.  
**Recommendation:** Keep assignment but narrow the rationale to reflect the actual beneficiaries: *"Automatically enrolls children placed in foster care in Delaware's subsidized Purchase of Care program, eliminating application delays and covering childcare costs for foster families who take in children — a direct dollar benefit for caregivers who might otherwise pay out-of-pocket while paperwork catches up."*

---

### HB 438 — smallbiz: Watch Out
**Problem:** "Child-serving entities" include hospitals, school districts, and large nonprofits — predominantly large institutions, not small businesses. The service letter compliance burden falls mostly on large employers.  
**Tests failed:** Profile specificity — child-serving entities are mostly large organizations.  
**Recommendation:** **REMOVE smallbiz.** The compliance obligation is real but falls primarily on large institutional employers, not small businesses.

---

### HB 445 w/ HA 1 + SA 3 — homeowner: Helps You, renter: Helps You, smallbiz: Watch Out
**Three separate problems:**
- **homeowner/renter:** Bill requires *large energy facilities* to generate their own renewable power. The rationale says this prevents grid overload → prevents rate increases. But: large facility compliance → PUC rate proceedings → grid cost allocation → residential bills is 4+ hops and speculative. Rate outcomes depend on many additional factors.
- **smallbiz Watch Out:** The bill targets "large energy use facilities" — by definition, *not* small businesses. Delaware's large energy users (data centers, manufacturers) are corporations, not small businesses.  
**Tests failed:** homeowner/renter fail two-hop rule; smallbiz fails profile specificity.  
**Recommendation:** **REMOVE all three profiles.** No profile in the Dover Dash taxonomy cleanly captures large industrial energy users. If the indirect rate benefit is later verified through actual rate proceedings, add back homeowner/renter with a stronger mechanism statement.

---

### SB 275 w/ SA 1 + HA 1 — homeowner: Watch Out
**Problem:** The utility underground damage prevention update "may be passed through to ratepayers." The word "may" signals a speculative mechanism — it's not confirmed that cost increases will be passed through to homeowners rather than absorbed by utilities.  
**Tests failed:** Named mechanism ("may be passed through" ≠ confirmed cost channel).  
**Recommendation:** **REMOVE homeowner.** Restore only if rate proceedings confirm cost pass-through.

---

### SB 292 — renter: Helps You
**Problem:** The bill requires notice procedures only when rent is paid by a *state reentry services fund* — a very narrow set of tenants (recently released from incarceration). The rationale uses boilerplate language about "notice periods, deposit limits, habitability standards" — none of which this bill addresses.  
**Tests failed:** Profile specificity (affects a narrow population, not renters broadly), One-sentence test (rationale describes a different bill).  
**Recommendation:** Keep with dramatically narrowed rationale: *"Requires landlords to give a tenant notice when their rent is funded by a state reentry services grant, protecting recently incarcerated individuals — who are among the most financially vulnerable renters — from surprise lease terminations tied to reentry fund payment procedures."*

---

### SB 297 — workpro: Helps You, lowwage: Helps You
**Problem:** The bill adds one clarifying interpretive paragraph to the Consumer Fraud Act. Consumer fraud law applies to all consumers — workers and low-wage workers aren't a disproportionately affected class. And a "clarifying paragraph" has minimal practical financial impact.  
**Tests failed:** Profile specificity (all consumers benefit equally), Materiality (one clarifying paragraph has low direct dollar impact).  
**Recommendation:** **REMOVE workpro and lowwage.** Keep smallbiz Watch Out (businesses face clearer enforcement exposure). The consumer benefit is real but insufficiently specific to these profiles.

---

### SB 301 — senior: Helps You
**Problem:** The bill requires discharge plans for *pregnant patients* experiencing preterm labor symptoms. Seniors cannot be pregnant. This is biologically impossible as a class.  
**Tests failed:** Profile specificity — seniors are not pregnant patients.  
**Recommendation:** **REMOVE senior.** Keep workpro (working-age pregnant women benefit).

---

### SB 308 w/ SA 1 — homeowner: Watch Out, renter: Watch Out
**Problem:** The bill establishes load forecast accountability for electric utilities. The rationale says forecasting mandates "shape future rate proceedings, with resulting cost decisions flowing through to residential electric bills." Chain: Forecasting requirements → better regulatory data → PSC scrutiny in rate cases → (maybe) lower rates approved → residential bills. This is 4+ hops with a speculative outcome.  
**Tests failed:** Two-hop rule (chain is too long), Named mechanism (regulatory transparency ≠ rate mechanism).  
**Recommendation:** **REMOVE both profiles.** A forecasting transparency bill doesn't directly change what homeowners or renters pay. The indirect benefit requires too many contingent steps through rate proceedings.

---

### SB 325 w/ SA 1, SA 2 + HA 1 — homeowner: Watch Out
**Problem:** The State Fire Prevention Commission's inspection authority covers commercial and multi-family structures. Single-family homeowners are generally not subject to SFPC inspections — they face local fire code enforcement, not state commission-level inspections.  
**Tests failed:** Profile specificity — SFPC jurisdiction typically doesn't reach individual homeowners.  
**Recommendation:** **REMOVE homeowner.** Keep smallbiz Watch Out (commercial property owners clearly face inspection costs).

---

### SB 340 w/ SA 1 — senior: Watch Out
**Problem:** The bill requires long-term care *facilities* to carry $1M/$3M liability insurance. This protects *residents* (seniors) who suffer harm — ensuring facilities can pay claims. The rationale assumes cost pass-through to residents' fees, but the primary purpose and effect is to protect seniors, not charge them more.  
**Tests failed:** Direction — facility insurance requirements primarily protect residents (Helps You), not harm them. Cost pass-through is speculative.  
**Recommendation:** Change direction to `Helps You`. Update rationale: *"Requires long-term care facilities to carry minimum $1M/$3M liability insurance, ensuring seniors who suffer injuries from facility negligence can actually collect damages — directly protecting the financial recovery rights of nursing home and assisted living residents."*

---

## Summary of Recommended Changes

| Bill | Current | Change |
|------|---------|--------|
| HB 283 | homeowner Watch Out | → homeowner **Helps You** |
| HB 363 | homeowner/renter Helps You | → **REMOVE both profiles** |
| HB 380 | workpro/lowwage Helps You | → **REMOVE both profiles** |
| HB 393 | homeowner/renter Helps You | → **REMOVE both profiles** |
| HB 406 | homeowner Helps You (keep workpro) | → **REMOVE homeowner** |
| HB 438 | smallbiz Watch Out | → **REMOVE smallbiz** |
| HB 445 | homeowner/renter Helps You + smallbiz Watch Out | → **REMOVE all three profiles** |
| HB 458 | homeowner Watch Out | → homeowner **Helps You** |
| SB 141 | smallbiz Watch Out | → smallbiz **Helps You** |
| SB 192 | homeowner/renter Helps You | → **REMOVE both profiles** |
| SB 263 | workpro/lowwage Helps You | → **REMOVE both** (or flip to Watch Out) |
| SB 275 | homeowner Watch Out | → **REMOVE homeowner** |
| SB 292 | renter Helps You | → Keep, fix rationale to reflect reentry scope |
| SB 293 | smallbiz Watch Out | → smallbiz **Helps You** |
| SB 297 | workpro/lowwage Helps You (keep smallbiz) | → **REMOVE workpro, lowwage** |
| SB 301 | senior Helps You (keep workpro) | → **REMOVE senior** |
| SB 308 | homeowner/renter Watch Out | → **REMOVE both profiles** |
| SB 310 | smallbiz Helps You | → **REMOVE smallbiz** |
| SB 316 | homeowner Watch Out | → homeowner **Helps You** |
| SB 325 | homeowner/smallbiz Watch Out (keep smallbiz) | → **REMOVE homeowner** |
| SB 326 | homeowner/renter Watch Out | → **Helps You for both** |
| SB 340 | senior Watch Out | → senior **Helps You** |
| SB 75 | smallbiz Watch Out | → smallbiz **Helps You** |

**Also fix rationales (keep direction):**
| Bill | Issue |
|------|-------|
| HB 217 | Rationale describes pet policy; bill is about key surrender |
| HB 419 | Rationale describes general childcare; bill is about foster care |
| SB 63 | Rationale infers from veto-override status; should describe actual misclassification mechanism |
| SB 292 | Rationale is generic LT Code boilerplate |

---

*Report generated by six sigma taxonomy QC pass. Before applying any changes to bill_profiles.json or Supabase, confirm direction changes against the actual bill text where flagged.*
