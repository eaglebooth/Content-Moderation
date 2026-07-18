# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import typing
import json


@gl.evm.contract_interface
class _Recipient:
    class View:
        pass

    class Write:
        pass


GUIDELINES = "Hate speech, targeted harassment, explicit violence, dangerous misinformation, scams, phishing, and manipulative spam are prohibited. Context, quotation, journalism, education, and satire must be considered before restricting content."


class ContentModeration(gl.Contract):
    config: TreeMap[u256, str]
    submission_count: u256
    settlement_count: u256
    total_bonded: u256
    total_refunded: u256
    total_slashed: u256

    submission_types: TreeMap[u256, str]
    submission_contents: TreeMap[u256, str]
    submission_submitters: TreeMap[u256, str]
    submission_timestamps: TreeMap[u256, u256]
    submission_statuses: TreeMap[u256, str]
    submission_bond_statuses: TreeMap[u256, str]
    submission_bonds: TreeMap[u256, u256]
    submission_scores: TreeMap[u256, u256]
    submission_category_scores: TreeMap[u256, str]
    submission_reasons: TreeMap[u256, str]
    submission_evaluated_at: TreeMap[u256, u256]
    submission_appeal_deadlines: TreeMap[u256, u256]
    submission_appeal_reasons: TreeMap[u256, str]
    submission_appeal_evidence: TreeMap[u256, str]
    submission_appealed: TreeMap[u256, u256]

    settlement_submission_ids: TreeMap[u256, u256]
    settlement_kinds: TreeMap[u256, str]
    settlement_recipients: TreeMap[u256, str]
    settlement_amounts: TreeMap[u256, u256]

    def __init__(self):
        self.config[u256(0)] = gl.message.sender_address.as_hex
        self.submission_count = u256(0)
        self.settlement_count = u256(0)
        self.total_bonded = u256(0)
        self.total_refunded = u256(0)
        self.total_slashed = u256(0)

    def _valid_url(self, value: str) -> bool:
        return value.startswith("https://") and len(value) <= 500

    def _transaction_timestamp(self) -> u256:
        # GenVM pins this ISO datetime to the transaction, so every validator
        # derives the same Unix timestamp without relying on block metadata.
        raw = str(gl.message_raw["datetime"])
        year = int(raw[0:4])
        month = int(raw[5:7])
        day = int(raw[8:10])
        hour = int(raw[11:13])
        minute = int(raw[14:16])
        second = int(raw[17:19])

        adjusted_year = year - (1 if month <= 2 else 0)
        era = adjusted_year // 400
        year_of_era = adjusted_year - era * 400
        shifted_month = month - 3 if month > 2 else month + 9
        day_of_year = (153 * shifted_month + 2) // 5 + day - 1
        day_of_era = year_of_era * 365 + year_of_era // 4 - year_of_era // 100 + day_of_year
        days_since_epoch = era * 146097 + day_of_era - 719468
        seconds = days_since_epoch * 86400 + hour * 3600 + minute * 60 + second
        return u256(seconds)

    def _parse_review(self, raw: str) -> typing.Any:
        try:
            data = json.loads(raw)
            verdict = str(data.get("verdict", "NEEDS_REVIEW")).upper()
            score = int(data.get("risk_score", 50))
            category_scores = json.dumps(data.get("category_scores", {}), sort_keys=True, separators=(",", ":"))[:700]
            reason = str(data.get("reason", "The jury returned no usable reason."))[:900]
        except Exception:
            return None
        if verdict not in ("APPROVED", "REJECTED", "NEEDS_REVIEW"):
            verdict = "NEEDS_REVIEW"
        if score < 0:
            score = 0
        if score > 100:
            score = 100
        return (verdict, score, category_scores, reason)

    def _record_settlement(self, submission_id: u256, kind: str, recipient: str, amount: u256) -> u256:
        settlement_id = self.settlement_count
        self.settlement_submission_ids[settlement_id] = submission_id
        self.settlement_kinds[settlement_id] = kind
        self.settlement_recipients[settlement_id] = recipient
        self.settlement_amounts[settlement_id] = amount
        self.settlement_count = settlement_id + u256(1)
        return settlement_id

    @gl.public.write.payable
    def submit(self, content: str, content_type: str) -> typing.Any:
        normalized_type = content_type.upper()
        if normalized_type != "TEXT" and normalized_type != "URL":
            return "INVALID_CONTENT_TYPE"
        if len(content) == 0 or len(content) > 4000:
            return "INVALID_CONTENT"
        if normalized_type == "URL" and not self._valid_url(content):
            return "INVALID_CONTENT_URL"
        bond = gl.message.value
        if bond == u256(0):
            return "MODERATION_BOND_REQUIRED"

        submission_id = self.submission_count
        self.submission_types[submission_id] = normalized_type
        self.submission_contents[submission_id] = content
        self.submission_submitters[submission_id] = gl.message.sender_address.as_hex
        self.submission_timestamps[submission_id] = self._transaction_timestamp()
        self.submission_statuses[submission_id] = "PENDING"
        self.submission_bond_statuses[submission_id] = "LOCKED"
        self.submission_bonds[submission_id] = bond
        self.submission_scores[submission_id] = u256(0)
        self.submission_category_scores[submission_id] = "{}"
        self.submission_reasons[submission_id] = "Waiting for GenLayer moderation."
        self.submission_evaluated_at[submission_id] = u256(0)
        self.submission_appeal_deadlines[submission_id] = u256(0)
        self.submission_appeal_reasons[submission_id] = ""
        self.submission_appeal_evidence[submission_id] = ""
        self.submission_appealed[submission_id] = u256(0)
        self.submission_count = submission_id + u256(1)
        self.total_bonded = self.total_bonded + bond
        return str(submission_id)

    @gl.public.write
    def evaluate(self, submission_id: u256) -> typing.Any:
        if submission_id >= self.submission_count:
            return "SUBMISSION_NOT_FOUND"
        if self.submission_statuses[submission_id] != "PENDING":
            return "SUBMISSION_NOT_PENDING"

        content = self.submission_contents[submission_id]
        content_type = self.submission_types[submission_id]

        def run_review() -> str:
            if content_type == "URL":
                try:
                    evidence = gl.nondet.web.render(content, mode="html")[:4200]
                except Exception:
                    return json.dumps({"verdict":"NEEDS_REVIEW","risk_score":50,"category_scores":{},"reason":"The public URL could not be rendered, so no final restriction is justified."}, sort_keys=True, separators=(",", ":"))
            else:
                evidence = content[:4000]
            prompt = f"""You are an impartial GenLayer content moderation jury. A real GEN bond depends on this ruling.
COMMUNITY POLICY: {GUIDELINES}
CONTENT TYPE: {content_type}
PUBLIC OR INLINE EVIDENCE: {evidence}
Assess context and evidence, not isolated keywords. APPROVED means risk 0-35 with no material policy violation. REJECTED means risk 60-100 with a clear material violation. NEEDS_REVIEW means ambiguous context, unreadable evidence, or risk 36-59. Respond ONLY with JSON containing verdict APPROVED|REJECTED|NEEDS_REVIEW, risk_score 0-100, category_scores as an object with hate_speech, misinformation, explicit_content, harassment, and spam values 0-100, and one concise evidence-based reason."""
            return gl.nondet.exec_prompt(prompt)

        principle = "Validators must agree on the fund-controlling moderation outcome and a compatible risk band. Wording and exact category values may differ, but APPROVED, REJECTED, and NEEDS_REVIEW are not equivalent. The reason must rely on compatible evidence and policy concerns."
        parsed = self._parse_review(gl.eq_principle.prompt_comparative(run_review, principle))
        if parsed is None:
            return "INVALID_AI_RESPONSE"
        verdict, score_value, category_scores, reason = parsed
        score = u256(score_value)
        if verdict == "APPROVED" and score <= u256(35):
            status = "APPROVED"
        elif verdict == "REJECTED" and score >= u256(60):
            status = "REJECTED_APPEALABLE"
        else:
            status = "NEEDS_REVIEW"

        self.submission_statuses[submission_id] = status
        self.submission_scores[submission_id] = score
        self.submission_category_scores[submission_id] = category_scores
        self.submission_reasons[submission_id] = reason
        now = self._transaction_timestamp()
        self.submission_evaluated_at[submission_id] = now
        if status == "REJECTED_APPEALABLE":
            self.submission_appeal_deadlines[submission_id] = now + u256(86400)
        return self.get_submission(submission_id)

    @gl.public.write
    def open_appeal(self, submission_id: u256, reason: str, evidence_url: str) -> typing.Any:
        if submission_id >= self.submission_count:
            return "SUBMISSION_NOT_FOUND"
        if self.submission_submitters[submission_id] != gl.message.sender_address.as_hex:
            return "NOT_SUBMITTER"
        status = self.submission_statuses[submission_id]
        if status != "REJECTED_APPEALABLE" and status != "NEEDS_REVIEW":
            return "SUBMISSION_NOT_APPEALABLE"
        if self.submission_appealed[submission_id] != u256(0):
            return "APPEAL_ALREADY_USED"
        if len(reason) < 20 or len(reason) > 900:
            return "INVALID_APPEAL_REASON"
        if not self._valid_url(evidence_url):
            return "INVALID_APPEAL_EVIDENCE"
        if status == "REJECTED_APPEALABLE" and self._transaction_timestamp() > self.submission_appeal_deadlines[submission_id]:
            return "APPEAL_WINDOW_CLOSED"

        self.submission_appeal_reasons[submission_id] = reason
        self.submission_appeal_evidence[submission_id] = evidence_url
        self.submission_appealed[submission_id] = u256(1)
        self.submission_statuses[submission_id] = "APPEAL_PENDING"
        return "APPEAL_OPENED"

    @gl.public.write
    def resolve_appeal(self, submission_id: u256) -> typing.Any:
        if submission_id >= self.submission_count:
            return "SUBMISSION_NOT_FOUND"
        if self.submission_statuses[submission_id] != "APPEAL_PENDING":
            return "APPEAL_NOT_PENDING"

        content = self.submission_contents[submission_id]
        content_type = self.submission_types[submission_id]
        prior_reason = self.submission_reasons[submission_id]
        appeal_reason = self.submission_appeal_reasons[submission_id]
        appeal_url = self.submission_appeal_evidence[submission_id]

        def run_appeal() -> str:
            try:
                appeal_evidence = gl.nondet.web.render(appeal_url, mode="html")[:3200]
                if content_type == "URL":
                    original_evidence = gl.nondet.web.render(content, mode="html")[:2800]
                else:
                    original_evidence = content[:2800]
            except Exception:
                return json.dumps({"verdict":"NEEDS_REVIEW","risk_score":50,"category_scores":{},"reason":"The complete appeal record could not be rendered, so the bond should not be slashed."}, sort_keys=True, separators=(",", ":"))
            prompt = f"""You are the senior GenLayer appeal jury. A real GEN bond depends on this final review.
POLICY: {GUIDELINES}
ORIGINAL EVIDENCE: {original_evidence}
PRIOR JURY REASON: {prior_reason}
SUBMITTER APPEAL: {appeal_reason}
NEW PUBLIC EVIDENCE: {appeal_evidence}
Reconsider the complete record. APPROVED requires risk 0-35, REJECTED requires risk 60-100 and a clear material violation, and NEEDS_REVIEW covers unresolved ambiguity. Respond ONLY with JSON containing verdict, risk_score, category_scores, and one concise reason."""
            return gl.nondet.exec_prompt(prompt)

        principle = "Appeal validators must agree on the same final bond outcome and compatible risk band after considering both original and new public evidence. Different wording is acceptable; disagreement between approval, rejection, and unresolved review is not."
        parsed = self._parse_review(gl.eq_principle.prompt_comparative(run_appeal, principle))
        if parsed is None:
            return "INVALID_AI_RESPONSE"
        verdict, score_value, category_scores, reason = parsed
        score = u256(score_value)
        if verdict == "APPROVED" and score <= u256(35):
            status = "FINAL_APPROVED"
        elif verdict == "REJECTED" and score >= u256(60):
            status = "FINAL_REJECTED"
        else:
            status = "MANUAL_REVIEW"
        self.submission_statuses[submission_id] = status
        self.submission_scores[submission_id] = score
        self.submission_category_scores[submission_id] = category_scores
        self.submission_reasons[submission_id] = reason
        self.submission_evaluated_at[submission_id] = self._transaction_timestamp()
        return self.get_submission(submission_id)

    @gl.public.write
    def accept_rejection(self, submission_id: u256) -> typing.Any:
        if submission_id >= self.submission_count:
            return "SUBMISSION_NOT_FOUND"
        if self.submission_submitters[submission_id] != gl.message.sender_address.as_hex:
            return "NOT_SUBMITTER"
        if self.submission_statuses[submission_id] != "REJECTED_APPEALABLE":
            return "REJECTION_NOT_OPEN"
        self.submission_statuses[submission_id] = "FINAL_REJECTED"
        return "REJECTION_ACCEPTED"

    @gl.public.write
    def claim_bond(self, submission_id: u256) -> typing.Any:
        if submission_id >= self.submission_count:
            return "SUBMISSION_NOT_FOUND"
        submitter = self.submission_submitters[submission_id]
        if submitter != gl.message.sender_address.as_hex:
            return "NOT_SUBMITTER"
        status = self.submission_statuses[submission_id]
        if status != "APPROVED" and status != "FINAL_APPROVED" and status != "MANUAL_REVIEW":
            return "BOND_NOT_REFUNDABLE"
        if self.submission_bond_statuses[submission_id] != "LOCKED":
            return "BOND_ALREADY_SETTLED"
        amount = self.submission_bonds[submission_id]
        if amount == u256(0) or amount > self.total_bonded:
            return "INVALID_BOND_BALANCE"
        self.submission_bond_statuses[submission_id] = "REFUNDED"
        self.total_bonded = self.total_bonded - amount
        self.total_refunded = self.total_refunded + amount
        settlement_id = self._record_settlement(submission_id, "BOND_REFUND", submitter, amount)
        _Recipient(Address(submitter)).emit_transfer(value=amount)
        return str(settlement_id)

    @gl.public.write
    def slash_bond(self, submission_id: u256) -> typing.Any:
        if submission_id >= self.submission_count:
            return "SUBMISSION_NOT_FOUND"
        status = self.submission_statuses[submission_id]
        if status == "REJECTED_APPEALABLE":
            if self._transaction_timestamp() <= self.submission_appeal_deadlines[submission_id]:
                return "APPEAL_WINDOW_OPEN"
            self.submission_statuses[submission_id] = "FINAL_REJECTED"
        elif status != "FINAL_REJECTED":
            return "BOND_NOT_SLASHABLE"
        if self.submission_bond_statuses[submission_id] != "LOCKED":
            return "BOND_ALREADY_SETTLED"
        amount = self.submission_bonds[submission_id]
        if amount == u256(0) or amount > self.total_bonded:
            return "INVALID_BOND_BALANCE"
        treasury = self.config[u256(0)]
        self.submission_bond_statuses[submission_id] = "SLASHED"
        self.total_bonded = self.total_bonded - amount
        self.total_slashed = self.total_slashed + amount
        settlement_id = self._record_settlement(submission_id, "BOND_SLASH", treasury, amount)
        _Recipient(Address(treasury)).emit_transfer(value=amount)
        return str(settlement_id)

    @gl.public.view
    def get_guidelines(self) -> str:
        return json.dumps({"appeal_window_seconds":"86400","policy":GUIDELINES,"risk_approved_max":"35","risk_rejected_min":"60"}, sort_keys=True, separators=(",", ":"))

    @gl.public.view
    def get_system_state(self) -> str:
        return json.dumps({"settlement_count":str(self.settlement_count),"submission_count":str(self.submission_count),"total_bonded":str(self.total_bonded),"total_refunded":str(self.total_refunded),"total_slashed":str(self.total_slashed),"treasury":self.config[u256(0)]}, sort_keys=True, separators=(",", ":"))

    @gl.public.view
    def get_submission(self, submission_id: u256) -> str:
        if submission_id >= self.submission_count:
            return json.dumps({"error":"SUBMISSION_NOT_FOUND"}, sort_keys=True, separators=(",", ":"))
        return json.dumps({"appeal_deadline":str(self.submission_appeal_deadlines[submission_id]),"appeal_evidence":self.submission_appeal_evidence[submission_id],"appeal_reason":self.submission_appeal_reasons[submission_id],"appealed":str(self.submission_appealed[submission_id]),"bond":str(self.submission_bonds[submission_id]),"bond_status":self.submission_bond_statuses[submission_id],"category_scores":self.submission_category_scores[submission_id],"content":self.submission_contents[submission_id],"evaluated_at":str(self.submission_evaluated_at[submission_id]),"reason":self.submission_reasons[submission_id],"score":str(self.submission_scores[submission_id]),"status":self.submission_statuses[submission_id],"submission_id":str(submission_id),"submitter":self.submission_submitters[submission_id],"timestamp":str(self.submission_timestamps[submission_id]),"type":self.submission_types[submission_id]}, sort_keys=True, separators=(",", ":"))

    @gl.public.view
    def get_settlement(self, settlement_id: u256) -> str:
        if settlement_id >= self.settlement_count:
            return json.dumps({"error":"SETTLEMENT_NOT_FOUND"}, sort_keys=True, separators=(",", ":"))
        return json.dumps({"amount":str(self.settlement_amounts[settlement_id]),"kind":self.settlement_kinds[settlement_id],"recipient":self.settlement_recipients[settlement_id],"settlement_id":str(settlement_id),"submission_id":str(self.settlement_submission_ids[settlement_id])}, sort_keys=True, separators=(",", ":"))
