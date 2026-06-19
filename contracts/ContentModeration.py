# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import typing
import json

# Community Guidelines - immutable standards for content evaluation
COMMUNITY_GUIDELINES = """{
  "hate_speech": "Content promoting violence or discrimination against individuals/groups based on protected characteristics (race, religion, gender, sexual orientation, disability, etc.)",
  "misinformation": "False or misleading information presented as fact, especially harmful health/safety/civic information, election fraud claims, etc.",
  "explicit_content": "Sexually explicit material, nudity, graphic violence, or disturbing imagery",
  "harassment": "Targeted abuse, threats, stalking, bullying, or personal attacks against individuals",
  "spam": "Unsolicited promotional content, scams, phishing, repeated identical submissions, or artificial engagement",
  "scoring_weights": {
    "hate_speech": 30,
    "misinformation": 25,
    "explicit_content": 20,
    "harassment": 15,
    "spam": 10
  },
  "thresholds": {
    "approved_min_score": 80,
    "rejected_max_score": 50,
    "high_risk_category": 40
  }
}"""


class ContentModeration(gl.Contract):
    """
    AI-powered Content Moderation System
    Evaluates user submissions (text or image URLs) against community guidelines
    Uses multi-validator consensus to ensure fair, unbiased decisions
    """

    # Storage declarations - ONLY allowed types
    submission_count: u256
    content_guidelines_version: u256

    # Submission data
    submission_types: TreeMap[u256, str]
    submission_contents: TreeMap[u256, str]
    submission_submitter: TreeMap[u256, str]
    submission_timestamp: TreeMap[u256, u256]

    # AI Evaluation results
    submission_statuses: TreeMap[u256, str]
    submission_scores: TreeMap[u256, u256]
    submission_category_scores: TreeMap[u256, str]  # JSON string of category scores
    submission_reasons: TreeMap[u256, str]
    submission_evaluated_at: TreeMap[u256, u256]

    # Appeal tracking
    submission_appeal_count: TreeMap[u256, u256]
    submission_appeal_reasons: TreeMap[u256, str]

    # Audit log
    moderation_log: DynArray[str]

    def __init__(self):
        self.submission_count = u256(0)
        self.content_guidelines_version = u256(1)
        # TreeMap and DynArray initialized on first write

    @gl.public.view
    def get_guidelines(self) -> str:
        """Return current community guidelines"""
        return COMMUNITY_GUIDELINES

    @gl.public.view
    def get_submission(self, submission_id: u256) -> typing.Any:
        """Get full submission details"""
        if submission_id >= self.submission_count:
            return {"error": "SUBMISSION_NOT_FOUND"}

        return {
            "id": submission_id,
            "type": self.submission_types[submission_id],
            "content": self.submission_contents[submission_id],
            "submitter": self.submission_submitter[submission_id],
            "timestamp": self.submission_timestamp[submission_id],
            "status": self.submission_statuses[submission_id],
            "score": self.submission_scores[submission_id],
            "category_scores": self.submission_category_scores[submission_id],
            "reason": self.submission_reasons[submission_id],
            "evaluated_at": self.submission_evaluated_at[submission_id],
            "appeal_count": self.submission_appeal_count[submission_id]
        }

    @gl.public.view
    def get_submissions_by_status(self, status: str) -> typing.Any:
        """Get all submissions with given status"""
        result = DynArray[u256]()
        i = u256(0)
        while i < self.submission_count:
            if self.submission_statuses[i] == status:
                result.append(i)
            i = i + u256(1)
        return result

    @gl.public.write
    def submit(self, content: str, content_type: str, submitter: str) -> u256:
        """
        Submit content for moderation
        content_type: "text" or "image_url"
        Returns submission_id
        """
        # Validation
        if len(content) == 0:
            return u256(0)  # Error code 0 means empty content

        if content_type != "text" and content_type != "image_url":
            return u256(1)  # Error code 1 means invalid type

        if len(submitter) == 0:
            return u256(2)  # Error code 2 means no submitter

        # Create submission
        submission_id = self.submission_count

        self.submission_types[submission_id] = content_type
        self.submission_contents[submission_id] = content
        self.submission_submitter[submission_id] = submitter
        self.submission_timestamp[submission_id] = gl.get_block_timestamp()
        self.submission_statuses[submission_id] = "PENDING"
        self.submission_scores[submission_id] = u256(0)
        self.submission_category_scores[submission_id] = "{}"
        self.submission_reasons[submission_id] = ""
        self.submission_evaluated_at[submission_id] = u256(0)
        self.submission_appeal_count[submission_id] = u256(0)

        self.submission_count = submission_id + u256(1)

        # Log
        log_entry = json.dumps({
            "action": "SUBMIT",
            "submission_id": int(submission_id),
            "submitter": submitter,
            "type": content_type
        }, sort_keys=True, separators=(",", ":"))
        self.moderation_log.append(log_entry)

        return submission_id

    @gl.public.write
    def evaluate(self, submission_id: u256) -> typing.Any:
        """
        AI evaluation of content against community guidelines.
        Uses multi-validator consensus to ensure deterministic output.
        """
        # Validation
        if submission_id >= self.submission_count:
            return {"error": "INVALID_SUBMISSION_ID"}

        current_status = self.submission_statuses[submission_id]
        if current_status != "PENDING":
            return {"error": "ALREADY_EVALUATED", "current_status": current_status}

        content = self.submission_contents[submission_id]
        content_type = self.submission_types[submission_id]
        guidelines = COMMUNITY_GUIDELINES

        # Nondeterministic evaluation wrapped in semantic consensus.
        # Validators compare the meaning of the verdict, not byte-identical JSON.
        def run_evaluation() -> str:
            """
            This function runs on independent validator LLM nodes.
            URL submissions fetch live web evidence on-chain before moderation.
            """
            # Build prompt based on content type
            if content_type == "text":
                content_section = f"Text Content:\n{content[:4000]}"
            else:
                try:
                    rendered_page = gl.nondet.web.render(content)
                    content_section = f"""Source URL:
{content}

Rendered web evidence:
{str(rendered_page)[:6000]}"""
                except Exception:
                    content_section = f"""Source URL:
{content}

Rendered web evidence:
WEB_RENDER_FAILED"""

            prompt = f"""You are a Community Content Moderator AI. Evaluate the following content against community guidelines.

{content_section}

Community Guidelines:
{guidelines}

Scoring Criteria (0-100 total):
- Hate Speech: 0-30 points (weight: 30%)
- Misinformation: 0-25 points (weight: 25%)
- Explicit Content: 0-20 points (weight: 20%)
- Harassment: 0-15 points (weight: 15%)
- Spam: 0-10 points (weight: 10%)

For each category:
- 0-10: No violation
- 11-25: Minor violation
- 26-40: Moderate violation
- 41-50: Severe violation
- 51+: Critical violation

Decision Thresholds:
- APPROVED: Total score < 50 AND no category > 40
- REJECTED: Total score >= 60 OR any category >= 50
- NEEDS_REVIEW: Total score 50-59 AND all categories < 40

IMPORTANT: Respond with ONLY a valid JSON object, no other text:
{{
  "verdict": "APPROVED|REJECTED|NEEDS_REVIEW",
  "total_score": <0-100>,
  "category_scores": {{
    "hate_speech": <0-30>,
    "misinformation": <0-25>,
    "explicit_content": <0-20>,
    "harassment": <0-15>,
    "spam": <0-10>
  }},
  "reason": "Brief explanation of the decision, citing specific guideline violations if any"
}}"""

            result = gl.nondet.exec_prompt(prompt)
            return result

        moderation_principle = """Two moderation results are equivalent when they have the same substantive verdict
(APPROVED, REJECTED, or NEEDS_REVIEW), materially similar category risk assessment, and a reason that cites the same
core evidence or guideline concern. Ignore harmless differences in JSON key order, wording, capitalization, or exact
sentence structure. Reject equivalence if one result approves content that the other rejects, if a high-risk category
is materially different, or if one result relies on evidence the other does not mention."""

        consensus_result = gl.eq_principle.prompt_comparative(run_evaluation, moderation_principle)

        # Parse the deterministic JSON result
        try:
            result_data = json.loads(consensus_result)
            verdict = result_data.get("verdict", "NEEDS_REVIEW")
            total_score = int(result_data.get("total_score", 0))
            category_scores = result_data.get("category_scores", {})
            reason = result_data.get("reason", "No reason provided")

            # Update storage
            self.submission_statuses[submission_id] = verdict
            self.submission_scores[submission_id] = u256(total_score)
            self.submission_category_scores[submission_id] = json.dumps(
                category_scores, sort_keys=True, separators=(",", ":")
            )
            self.submission_reasons[submission_id] = reason
            self.submission_evaluated_at[submission_id] = gl.get_block_timestamp()

            # Log
            log_entry = json.dumps({
                "action": "EVALUATE",
                "submission_id": int(submission_id),
                "verdict": verdict,
                "score": total_score
            }, sort_keys=True, separators=(",", ":"))
            self.moderation_log.append(log_entry)

            return {"verdict": verdict, "score": total_score, "reason": reason}

        except json.JSONDecodeError as e:
            # Handle malformed JSON from LLM
            error_verdict = "NEEDS_REVIEW"
            self.submission_statuses[submission_id] = error_verdict
            self.submission_reasons[submission_id] = f"Evaluation error: AI returned invalid JSON"
            self.submission_evaluated_at[submission_id] = gl.get_block_timestamp()

            return {"error": "INVALID_AI_RESPONSE", "verdict": error_verdict}

    @gl.public.write
    def appeal(self, submission_id: u256, appeal_reason: str) -> str:
        """
        Appeal a moderation decision.
        Increases appeal count and re-evaluates with stricter criteria.
        """
        # Validation
        if submission_id >= self.submission_count:
            return "INVALID_SUBMISSION_ID"

        current_status = self.submission_statuses[submission_id]
        if current_status == "PENDING":
            return "NOT_YET_EVALUATED"

        # Check appeal limit (max 2 appeals per submission)
        appeal_count = self.submission_appeal_count[submission_id]
        if appeal_count >= u256(2):
            return "APPEAL_LIMIT_REACHED"

        # Record appeal
        self.submission_appeal_count[submission_id] = appeal_count + u256(1)
        current_appeal_reasons = self.submission_appeal_reasons[submission_id]
        if len(current_appeal_reasons) > 0:
            self.submission_appeal_reasons[submission_id] = current_appeal_reasons + " | " + appeal_reason
        else:
            self.submission_appeal_reasons[submission_id] = appeal_reason

        # Re-evaluate with stricter prompt and fresh web evidence when needed.
        content = self.submission_contents[submission_id]
        content_type = self.submission_types[submission_id]
        guidelines = COMMUNITY_GUIDELINES

        def run_appeal_evaluation() -> str:
            """
            Appeal evaluation with human oversight flag.
            Second evaluation must justify deviation from first.
            """
            if content_type == "text":
                content_section = f"Text Content:\n{content[:4000]}"
            else:
                try:
                    rendered_page = gl.nondet.web.render(content)
                    content_section = f"""Source URL:
{content}

Rendered web evidence:
{str(rendered_page)[:6000]}"""
                except Exception:
                    content_section = f"""Source URL:
{content}

Rendered web evidence:
WEB_RENDER_FAILED"""

            prompt = f"""You are a Senior Content Moderator reviewing an appeal.
This content was previously evaluated with verdict: {current_status}
Appeal reason from submitter: {appeal_reason}

{content_section}

Community Guidelines:
{guidelines}

APPEAL REVIEW PROTOCOL:
1. Re-evaluate all categories thoroughly
2. Consider context that may have been missed
3. Pay special attention to the appeal reason
4. Only overturn original decision if there is clear evidence of error

Scoring same as original evaluation.

Respond with ONLY JSON:
{{
  "verdict": "APPROVED|REJECTED|NEEDS_REVIEW",
  "total_score": <0-100>,
  "category_scores": {{
    "hate_speech": <0-30>,
    "misinformation": <0-25>,
    "explicit_content": <0-20>,
    "harassment": <0-15>,
    "spam": <0-10>
  }},
  "reason": "Detailed justification for decision on appeal",
  "overturned": true/false
}}"""

            return gl.nondet.exec_prompt(prompt)

        appeal_principle = """Two appeal results are equivalent when they reach the same appeal outcome and same
substantive moderation verdict, with materially similar reasoning about whether the appeal evidence changes the prior
decision. Ignore JSON formatting and phrasing differences. Reject equivalence if one result overturns the prior decision
and the other does not, or if they disagree on the safety verdict."""

        consensus_result = gl.eq_principle.prompt_comparative(run_appeal_evaluation, appeal_principle)

        try:
            result_data = json.loads(consensus_result)
            new_verdict = result_data.get("verdict", "NEEDS_REVIEW")
            total_score = int(result_data.get("total_score", 0))

            # Update submission with appeal result
            self.submission_statuses[submission_id] = new_verdict
            self.submission_scores[submission_id] = u256(total_score)
            self.submission_category_scores[submission_id] = json.dumps(
                result_data.get("category_scores", {}),
                sort_keys=True, separators=(",", ":")
            )
            self.submission_reasons[submission_id] = f"[APPEAL #{int(appeal_count)+1}] " + result_data.get("reason", "")
            self.submission_evaluated_at[submission_id] = gl.get_block_timestamp()

            log_entry = json.dumps({
                "action": "APPEAL",
                "submission_id": int(submission_id),
                "new_verdict": new_verdict,
                "appeal_number": int(appeal_count) + 1
            }, sort_keys=True, separators=(",", ":"))
            self.moderation_log.append(log_entry)

            return new_verdict

        except json.JSONDecodeError:
            return "APPEAL_EVALUATION_ERROR"

    @gl.public.view
    def get_stats(self) -> typing.Any:
        """Get moderation statistics"""
        total = int(self.submission_count)
        approved = 0
        rejected = 0
        needs_review = 0
        pending = 0
        appealed = 0

        i = u256(0)
        while i < self.submission_count:
            status = self.submission_statuses[i]
            if status == "APPROVED":
                approved += 1
            elif status == "REJECTED":
                rejected += 1
            elif status == "NEEDS_REVIEW":
                needs_review += 1
            else:
                pending += 1

            if self.submission_appeal_count[i] > u256(0):
                appealed += 1

            i = i + u256(1)

        return {
            "total_submissions": total,
            "approved": approved,
            "rejected": rejected,
            "needs_review": needs_review,
            "pending": pending,
            "appealed": appealed,
            "approval_rate": round(approved / total * 100, 2) if total > 0 else 0
        }

    @gl.public.view
    def get_logs(self, start_index: u256, count: u256) -> DynArray[str]:
        """Get moderation log entries"""
        logs = DynArray[str]()
        i = start_index
        end = min(start_index + count, u256(len(self.moderation_log)))

        while i < end:
            logs.append(self.moderation_log[i])
            i = i + u256(1)

        return logs
