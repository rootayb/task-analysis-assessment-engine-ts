import { buildDemoReport } from "../lib/demoData";

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
      <div style={{ width: 140, fontSize: "0.85rem" }}>{label}</div>
      <div style={{ flex: 1, background: "#eee", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, background: "#4f46e5", height: 14 }} />
      </div>
      <div style={{ width: 32, fontSize: "0.8rem", textAlign: "right" }}>{value}</div>
    </div>
  );
}

export default function Page() {
  const { report, skill } = buildDemoReport();
  const maxErrorCount = Math.max(1, ...report.chartData.errorBar.map((p) => p.value));
  const maxPromptCount = Math.max(1, ...report.chartData.promptPie.map((p) => p.value));

  return (
    <main>
      <h1>Task Analysis Assessment Engine — Next.js Demo</h1>
      <p style={{ color: "#666" }}>
        Bu sayfa, aynı deterministik <code>task-analysis-assessment-engine</code> paketini bir Next.js Server
        Component içinde (SSR/edge uyumlu) çalıştırıyor. Beceri: <strong>{skill.name}</strong> — Config sürümü:{" "}
        <code>{report.configVersion}</code>
      </p>

      <section style={{ marginTop: "1.5rem" }}>
        <h2>
          Başarı: %{report.latestResult.successRate.toFixed(0)} — {report.latestResult.overallSuccessLevel}
        </h2>
        <ul style={{ paddingLeft: "1.2rem" }}>
          {report.explanation.reasons.map((reason, i) => (
            <li key={i} style={{ color: reason.isPositive ? "#0a7d32" : "#b3261e", fontSize: "0.9rem" }}>
              {reason.isPositive ? "✓" : "✗"} {reason.message}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <h2>İlerleme (Çizgi Grafik Verisi)</h2>
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", height: 120 }}>
          {report.chartData.progressLine.map((point, i) => (
            <div key={i} style={{ textAlign: "center", flex: 1 }}>
              <div style={{ background: "#4f46e5", height: `${point.value}px`, borderRadius: 4 }} />
              <div style={{ fontSize: "0.75rem", marginTop: 4 }}>{point.label}</div>
              <div style={{ fontSize: "0.75rem", color: "#666" }}>%{point.value.toFixed(0)}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: "0.85rem", color: "#666" }}>
          İlerleme durumu: <strong>{report.progress.status}</strong>
          {report.progress.averageGrowth !== undefined && <> — Ortalama artış: {report.progress.averageGrowth.toFixed(2)} puan/gün</>}
        </p>
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <h2>En Çok Hata Yapılan Basamaklar (Bar Grafik Verisi)</h2>
        {report.chartData.errorBar.map((point, i) => (
          <Bar key={i} label={point.label} value={point.value} max={maxErrorCount} />
        ))}
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <h2>İpucu Dağılımı (Pasta Grafik Verisi)</h2>
        {report.chartData.promptPie.map((point, i) => (
          <Bar key={i} label={point.label} value={point.value} max={maxPromptCount} />
        ))}
      </section>
    </main>
  );
}
