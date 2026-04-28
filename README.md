# No Regret Deals 🤝

> **Private Alignment: A Mechanism for Regret-Free Negotiations**

Negotiations are often performative dances of information asymmetry. Whether it’s a salary discussion, a freelance quote, or a startup valuation, both parties usually start by hiding their true "no regret" numbers. We fear that revealing our hand too early leads to anchoring, lowballing, or losing leverage.

The result? Inefficient markets, social friction, and the "Winner's Curse"—where even the party that "wins" the negotiation feels like they might have left money on the table or soured the relationship.

[No Regret Deals](https://noregretdeals.com) attempts to solve this using a mechanism called the **Private (Bounded) Alignment Protocol (PBAP)**.

## The Problem: The Haggling Trap

In a standard negotiation:
1.  **Anchoring:** Whoever speaks first sets a psychological anchor that biases the entire conversation.
2.  **Strategic Misrepresentation:** Parties often signal values far from their actual thresholds to create "bargaining room."
3.  **Negative Signaling:** If a candidate asks for $150k and the budget is $110k, the gap might be so wide that the company just walks away, even if both might have been flexible.

## The Mechanism: Private (Bounded) Alignment

PBAP is a multi-stage protocol designed to identify value alignment without premature disclosure. Here is how it works:

### 1. The Commitment Phase
The Initiator (Party A) defines a **Target Value** and a **Flexibility Spread (σ)** (e.g., 20%). 
The system generates a "No Regret" range: `[Target - σ, Target + σ]`. 

### 2. The Fair Response
The Responder (Party B) provides their own Target Value. Crucially, the system uses the **same flexibility σ** to generate Party B's range. This "Anti-Fishing" constraint ensures that Party B cannot use a disproportionately large range to "trap" Party A's target.

### 3. The Overlap Check (Round 1)
The server privately compares the two ranges.
*   **If they overlap:** A deal is struck instantly.
*   **The Price:** The final value is the **midpoint of the overlapping section**.

### 4. Bounded Feasibility (Round 2)
If there is no overlap, the protocol checks if a deal is *feasible*—meaning, would they overlap if both parties used their maximum allowed flexibility?
*   **If Feasible:** The system reveals a **Directional Hint** (e.g., "Party B is higher than your range"). Parties can then choose to adjust their positions for a second round.
*   **If Not Feasible:** The protocol enters **DEADLOCK**. The negotiation ends, and *no directional data or ranges are ever revealed*.

## Why this is Rational

### Equitable Surplus Extraction
By using the midpoint of the overlap, the protocol extracts the shared surplus equally. Neither party "wins" by being more aggressive. If I’m willing to pay $100-$120 and you’re willing to accept $110-$130, the overlap is $110-$120. The deal happens at $115. We both got a price better than our "walk-away" threshold.

### Incentive Compatibility
In PBAP, there is a strong incentive to be honest about your range. If you "pad" your numbers to try and get a better deal, you increase the risk of a **DEADLOCK**, where you get no deal and no information. The protocol rewards honesty with instant, fair alignment.

### Privacy and Social Cohesion
By automating the "no" in cases of extreme mismatch (Deadlock), we remove the social awkwardness of rejecting someone's "insulting" offer. If it doesn't work, it just doesn't work—the protocol handles the rejection silently.

## Use Cases

We've been looking at a few high-friction areas:
*   **Recruitment:** "What's your salary expectation?" vs "What's your budget?"
*   **Freelancing:** Quoting for a project without knowing the client's internal cap.
*   **Art/Commissions:** Artists setting a floor without scaring away fans.
*   **Investment:** Founders and VCs aligning on valuation ranges.

---

For technical details, local development setup, and deployment instructions, please see [DEVELOPMENT.md](./DEVELOPMENT.md).

## License

MIT
