# ILDP User Guide — How It Works

## What is ILDP?

The **Inclusive Leadership Digital Platform (ILDP)** helps agricultural associations measure and improve how well they include **women and youth** in leadership positions.

It replaces paper-based assessments with a digital system that:
- Scores your organization across 10 leadership domains
- Identifies strengths and gaps
- Generates action plans automatically
- Tracks progress over time

---

## The 10 ILM Domains

Every assessment evaluates your association across these areas:

1. **Leadership Structure & Power Distribution** — Who holds leadership positions?
2. **Representation & Participation** — Are women and youth actively involved?
3. **Access to Opportunities and Resources** — Can everyone access training, finance, land?
4. **Meeting Dynamics & Timing** — Are meetings accessible to all members?
5. **Leadership Culture & Behavioral Norms** — Does your culture support inclusion?
6. **Accountability & Monitoring** — Do you track and enforce inclusion goals?
7. **Partnerships & External Environment** — Do partners support your inclusion efforts?
8. **Value Propositions** — What benefits do women and youth get from participating?
9. **Sustainability & Learning** — Are you building long-term capacity?
10. **Overall Outcomes** — What measurable results have you achieved?

---

## User Roles

### 1. **Super Admin**
- Full system access
- Creates users and manages settings
- Views all data across all associations

### 2. **Program Manager**
- Oversees multiple associations
- Creates assessment rounds
- Reviews dashboards and reports
- Monitors progress

### 3. **Facilitator / Enumerator**
- Helps associations complete assessments
- Uploads evidence (documents, photos)
- Submits assessments for review

### 4. **Association Leader**
- Completes self-assessments for their own organization
- Reviews scorecards
- Updates action plans

### 5. **Reviewer / Validator**
- Checks submitted assessments
- Verifies evidence
- Approves or requests corrections

---

## How to Use the Platform (Step-by-Step)

### Step 1: Login
1. Go to http://localhost:5173
2. Login with your email and password
3. Default admin: `admin@ildp.org` / `Admin@1234`

### Step 2: Create an Association
1. Click **Associations** in the sidebar
2. Click **New Association**
3. Fill in:
   - Association name
   - Location (State, LGA, Community)
   - Value chain (e.g., Rice, Cassava)
   - Membership numbers (total, women, youth, PWD)
4. Click **Save**

### Step 3: Create an Assessment Round
1. Click **Assessment Rounds** in the sidebar
2. Click **New Round**
3. Enter:
   - Title (e.g., "Q1 2025 Assessment")
   - Start and end dates
4. Click **Create Round**

### Step 4: Start an Assessment
1. Go to **Assessments**
2. Click **New Assessment**
3. Select:
   - Which association
   - Which assessment round
   - Assessment type (self-assessment, facilitator-led, or validated)
4. Click **Create**
5. Click **Fill Form** to start answering questions

### Step 5: Complete the Assessment Form
The form is organized by domain. For each domain:

1. **Answer questions** — Questions can be:
   - Yes/No/Partly
   - Multiple choice
   - Rating scale (0-4)
   - Text input
   - Number input

2. **Upload evidence** (optional but recommended):
   - Meeting minutes
   - Policies
   - Photos
   - Membership records

3. **Navigate** — Use "Next" to move between domains
4. **Auto-save** — Your responses save automatically
5. **Submit** — When done, click "Submit Assessment"

### Step 6: Review & Approval
**For Reviewers:**
1. Go to **Assessments**
2. Find assessments with status "Submitted"
3. Click **Review**
4. Check all responses and evidence
5. Choose:
   - **Approve** — Assessment is complete
   - **Request Correction** — Send back with comments
   - **Mark Under Review** — Keep reviewing

### Step 7: View the Scorecard
Once approved, the system automatically:
- Calculates scores for each domain (0-4 scale)
- Calculates overall score
- Assigns a rating band:
  - **Weak** (0.0–1.4) — Red
  - **Emerging** (1.5–2.4) — Orange
  - **Functional** (2.5–3.4) — Yellow
  - **Strong** (3.5–4.0) — Green

**To view:**
1. Go to **Assessments**
2. Click **Scorecard** on an approved assessment
3. See:
   - Overall score and band
   - Radar chart showing all 10 domains
   - Strengths (domains scoring 3.0+)
   - Priority gaps (domains scoring below 2.0)

### Step 8: Action Plans
The system automatically creates action plans for low-scoring domains.

**To manage action plans:**
1. Go to **Action Plans**
2. Filter by status (not started, in progress, completed, overdue)
3. Click on a plan to:
   - Add progress updates
   - Mark as "In Progress" or "Completed"
   - Assign to a team member
   - Set due dates

### Step 9: Track Progress Over Time
1. Create a new assessment round (e.g., 6 months later)
2. Repeat the assessment for the same association
3. Compare scores across rounds to see improvement

### Step 10: Generate Reports
1. Go to **Reports**
2. Click **Generate Report**
3. Choose report type:
   - **Association Scorecard** — Full report for one organization
   - **Round Summary** — All assessments in a round
   - **State Comparison** — Compare associations by location
   - **Action Plan Progress** — Track action completion
4. Click **Generate**
5. Download when ready

---

## How Scoring Works

### Question-Level Scoring
Each question has a score mapping. Example:

**Question:** "Are women represented in executive positions?"
- **Yes** = 4 points
- **Partly** = 2 points
- **No** = 0 points

### Indicator-Level Scoring
Each domain has multiple indicators. The indicator score is the **average** of its questions.

Example:
- Question 1: 4 points
- Question 2: 2 points
- Question 3: 4 points
- **Indicator Score = (4 + 2 + 4) / 3 = 3.33**

### Domain-Level Scoring
Each domain score is the **weighted average** of its indicators.

Example for "Representation & Participation":
- Indicator 1 (weight 1.5): 3.33
- Indicator 2 (weight 1.5): 2.00
- Indicator 3 (weight 1.0): 4.00
- **Domain Score = (3.33×1.5 + 2.00×1.5 + 4.00×1.0) / (1.5+1.5+1.0) = 2.92**

### Overall Score
The overall score is the **average** of all 10 domain scores.

Example:
- D01: 2.5
- D02: 2.9
- D03: 3.2
- ... (all 10 domains)
- **Overall Score = sum of all domains / 10**

### Rating Bands
| Score Range | Band | Color | Meaning |
|---|---|---|---|
| 0.0 – 1.4 | Weak | Red | Significant gaps, immediate action needed |
| 1.5 – 2.4 | Emerging | Orange | Some practices exist but inconsistent |
| 2.5 – 3.4 | Functional | Yellow | Practices are in place and mostly working |
| 3.5 – 4.0 | Strong | Green | Strong inclusive leadership demonstrated |

---

## Dashboard Overview

The **Dashboard** shows:

### Summary Cards
- Total associations
- Active assessment rounds
- Assessments pending review
- Completed assessments
- Overdue action items

### Charts
- **Radar Chart** — Visual comparison of all 10 domains
- **Bar Chart** — Average scores by domain across all associations

### Recent Activity
- Latest assessments submitted
- Quick links to scorecards

---

## Common Workflows

### Workflow A: First-Time Assessment
1. Admin creates association profile
2. Program manager creates assessment round
3. Facilitator helps association complete assessment
4. Reviewer validates and approves
5. System generates scorecard and action plans
6. Association leader tracks action items

### Workflow B: Follow-Up Assessment
1. Program manager creates new round (6-12 months later)
2. Association completes assessment again
3. Compare new scorecard with previous round
4. Measure improvement in scores
5. Update action plans based on new gaps

### Workflow C: Multi-Association Program
1. Program manager creates 20 association profiles
2. Creates one assessment round for all
3. Assigns facilitators to each association
4. Reviews dashboards to compare performance
5. Generates state comparison report
6. Identifies best practices from high-scoring associations

---

## Tips for Best Results

### For Associations
- **Be honest** — Accurate responses lead to better action plans
- **Upload evidence** — Documents strengthen your assessment
- **Involve leadership** — Get input from executive committee
- **Track actions** — Update progress regularly

### For Facilitators
- **Prepare** — Review questions before meeting with association
- **Explain clearly** — Help members understand each question
- **Collect evidence** — Bring documents to upload during session
- **Save drafts** — Don't rush, you can complete over multiple sessions

### For Reviewers
- **Check evidence** — Verify claims with uploaded documents
- **Be constructive** — Provide helpful feedback when requesting corrections
- **Be consistent** — Apply the same standards across all assessments

### For Program Managers
- **Set clear timelines** — Give associations enough time to complete
- **Monitor progress** — Check completion rates regularly
- **Share results** — Use dashboards to identify trends
- **Celebrate success** — Recognize associations that improve

---

## Frequently Asked Questions

### Can I save a draft and come back later?
**Yes.** The form auto-saves as you answer questions. You can close the browser and return anytime.

### What if I don't have evidence for a question?
Evidence is optional for most questions, but recommended. If you don't have it, you can still submit the assessment.

### Can I edit an assessment after submitting?
**No.** Once submitted, only a reviewer can send it back for corrections. This ensures data integrity.

### How often should we do assessments?
**Every 6-12 months** is recommended to track meaningful progress.

### Can I compare my association with others?
**Yes.** Program managers can generate comparison reports by state, value chain, or assessment round.

### What happens to low-scoring domains?
The system automatically creates **action plans** with recommended steps to improve. You can assign these to team members and track progress.

### Can I export data?
**Yes.** You can generate PDF and Excel reports from the Reports page.

---

## Technical Notes

### Browser Requirements
- Chrome, Firefox, Safari, or Edge (latest versions)
- JavaScript must be enabled
- Minimum screen width: 1024px recommended

### File Upload Limits
- Maximum file size: 10MB per file
- Supported formats: PDF, Word, Excel, JPG, PNG

### Data Security
- All data is stored in a secure PostgreSQL database
- Passwords are encrypted
- Role-based access control ensures users only see their data

---

## Need Help?

### For Technical Issues
- Check that both backend and frontend are running
- Clear browser cache and reload
- Check browser console for errors

### For Assessment Questions
- Refer to the ILM Canvas documentation
- Contact your program manager
- Review the help text under each question

---

## Quick Reference: Navigation

| Page | What You Can Do |
|---|---|
| **Dashboard** | View summary stats, charts, recent activity |
| **Associations** | Create/edit association profiles |
| **Assessment Rounds** | Create time-bound assessment cycles |
| **Assessments** | Start, complete, review, and submit assessments |
| **Action Plans** | Track improvement actions, update progress |
| **Reports** | Generate and download PDF/Excel reports |
| **Users** | Invite and manage platform users (admin only) |
| **Notifications** | View system alerts and reminders |

---

## Example: Complete Assessment Journey

**Scenario:** Rice Farmers Cooperative in Kaduna State

1. **Profile Created**
   - Name: Kaduna Rice Farmers Cooperative
   - Members: 150 (60 women, 40 youth)
   - Value chain: Rice

2. **First Assessment (January 2025)**
   - Completed all 10 domains
   - Overall score: **2.1 (Emerging)**
   - Weak areas: Representation (1.8), Accountability (1.5)
   - Strong areas: Value Propositions (3.2)

3. **Action Plans Generated**
   - Introduce 30% quota for women in executive
   - Create grievance mechanism
   - Schedule mentorship program

4. **Progress Tracked**
   - March: Elected 3 women to executive (quota met)
   - May: Grievance box installed
   - June: 10 youth trained in leadership

5. **Second Assessment (July 2025)**
   - Overall score: **2.8 (Functional)** ✅ Improved!
   - Representation: 2.9 (was 1.8)
   - Accountability: 2.5 (was 1.5)

6. **Result**
   - Clear evidence of improvement
   - Association recognized as model for others
   - Continued focus on remaining gaps

---

This is how ILDP transforms inclusion from an abstract goal into measurable, trackable progress.
