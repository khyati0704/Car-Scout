import { scoreColor } from "../utils/helpers";

const severityColor = { minor: "#fbbf24", moderate: "#f97316", major: "#ef4444" };

export default function InspectionReport({ inspection, isSeller = false, onGenerate, generating = false }) {
  const reportReady =
    inspection?.status === "completed" &&
    typeof inspection.aiSummary === "string" &&
    inspection.aiSummary.trim().length > 0 &&
    Number.isFinite(Number(inspection.conditionScore));

  if (!reportReady) {
    const statusLabel =
      inspection?.status === "processing"
        ? "Inspection is being generated"
        : inspection?.status === "failed"
          ? "Inspection generation failed"
          : "Inspection report not available yet";
    const statusText =
      inspection?.status === "processing"
        ? "The AI summary is still being prepared. Please check back in a moment."
        : inspection?.status === "failed"
          ? "The last inspection run failed. You can try generating it again."
          : "The listing is live, but the AI condition summary has not been generated or attached yet.";

    return (
      <div style={styles.emptyWrap}>
        <h3 style={styles.emptyTitle}>{statusLabel}</h3>
        <p style={styles.emptyText}>{statusText}</p>
        {isSeller && onGenerate && (
          <button onClick={onGenerate} disabled={generating} style={styles.emptyButton}>
            {generating ? "Generating..." : "Generate AI inspection"}
          </button>
        )}
      </div>
    );
  }

  const { conditionScore, aiSummary, issues, strengths, estimatedValue, recommendation } = inspection;
  const recommendationColor = { buy: "#4ade80", consider: "#fbbf24", avoid: "#ef4444" };
  const recommendationLabel = { buy: "Recommended buy", consider: "Compare carefully", avoid: "High-risk purchase" };

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div>
          <div style={styles.label}>AI condition score</div>
          <div style={{ ...styles.score, color: scoreColor(conditionScore) }}>
            {conditionScore}<span style={styles.scoreMax}>/10</span>
          </div>
        </div>

        {recommendation && (
          <div style={{ ...styles.recommendation, color: recommendationColor[recommendation], borderColor: `${recommendationColor[recommendation]}55`, background: `${recommendationColor[recommendation]}14` }}>
            {recommendationLabel[recommendation]}
          </div>
        )}

        {estimatedValue && (
          <div style={styles.valueBox}>
            <div style={styles.label}>Estimated fair value</div>
            <div style={styles.value}>₹{(estimatedValue / 100000).toFixed(2)} L</div>
          </div>
        )}
      </div>

      {aiSummary && (
        <section style={styles.section}>
          <div style={styles.sectionTitle}>AI summary</div>
          <p style={styles.text}>{aiSummary}</p>
        </section>
      )}

      {strengths?.length > 0 && (
        <section style={styles.section}>
          <div style={styles.sectionTitle}>Strengths</div>
          <div style={styles.list}>
            {strengths.map((strength, index) => (
              <div key={`${strength}-${index}`} style={styles.goodItem}>{strength}</div>
            ))}
          </div>
        </section>
      )}

      {issues?.length > 0 && (
        <section style={styles.section}>
          <div style={styles.sectionTitle}>Issues found</div>
          <div style={styles.issueList}>
            {issues.map((issue, index) => (
              <div key={`${issue.category}-${index}`} style={styles.issueCard}>
                <div style={styles.issueTop}>
                  <span style={styles.issueCategory}>{issue.category}</span>
                  <span style={{ ...styles.issueSeverity, color: severityColor[issue.severity], background: `${severityColor[issue.severity]}14` }}>
                    {issue.severity}
                  </span>
                </div>
                <p style={styles.issueText}>{issue.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div style={styles.footer}>
        <div style={styles.footerItem}>{inspection.accidentHistory ? "Accident history present" : "No accident history reported"}</div>
        <div style={styles.footerItem}>{inspection.serviceHistory ? "Service records available" : "Service records not attached"}</div>
        <div style={styles.footerItem}>{inspection.numberOfOwners} previous owner{inspection.numberOfOwners === 1 ? "" : "s"}</div>
      </div>
    </div>
  );
}

const styles = {
  wrap: { background: "rgba(2,6,23,0.42)", border: "1px solid rgba(148,163,184,0.14)", borderRadius: 18, padding: 20 },
  emptyWrap: { background: "rgba(2,6,23,0.42)", border: "1px solid rgba(148,163,184,0.14)", borderRadius: 18, padding: 20 },
  emptyTitle: { margin: 0, color: "#f8fafc", fontFamily: "'Syne', sans-serif", fontSize: 22 },
  emptyText: { margin: "10px 0 0", color: "#94a3b8", lineHeight: 1.7 },
  emptyButton: { marginTop: 14, background: "#22c55e", color: "#052e16", border: "none", borderRadius: 14, padding: "12px 16px", fontWeight: 800, cursor: "pointer" },
  header: { display: "flex", gap: 18, alignItems: "start", justifyContent: "space-between", flexWrap: "wrap", paddingBottom: 18, borderBottom: "1px solid rgba(148,163,184,0.12)" },
  label: { color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 6 },
  score: { fontFamily: "'Syne', sans-serif", fontSize: 40, lineHeight: 1 },
  scoreMax: { color: "#94a3b8", fontSize: 18 },
  recommendation: { border: "1px solid transparent", borderRadius: 999, padding: "8px 12px", fontWeight: 800, fontSize: 12 },
  valueBox: { minWidth: 170 },
  value: { color: "#f8fafc", fontFamily: "'Syne', sans-serif", fontSize: 24 },
  section: { marginTop: 18 },
  sectionTitle: { color: "#e2e8f0", fontWeight: 700, marginBottom: 10 },
  text: { margin: 0, color: "#cbd5e1", lineHeight: 1.7 },
  list: { display: "grid", gap: 8 },
  goodItem: { background: "rgba(34,197,94,0.12)", color: "#bbf7d0", borderRadius: 12, padding: "10px 12px" },
  issueList: { display: "grid", gap: 10 },
  issueCard: { background: "rgba(15,23,42,0.74)", border: "1px solid rgba(148,163,184,0.12)", borderRadius: 14, padding: 14 },
  issueTop: { display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8, flexWrap: "wrap" },
  issueCategory: { color: "#e2e8f0", textTransform: "capitalize", fontWeight: 700 },
  issueSeverity: { borderRadius: 999, padding: "4px 8px", textTransform: "capitalize", fontSize: 12, fontWeight: 800 },
  issueText: { margin: 0, color: "#cbd5e1", lineHeight: 1.6 },
  footer: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18, paddingTop: 18, borderTop: "1px solid rgba(148,163,184,0.12)" },
  footerItem: { background: "rgba(15,23,42,0.7)", borderRadius: 999, padding: "8px 12px", color: "#cbd5e1", fontSize: 13 },
};
