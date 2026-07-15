# Task Analysis Assessment Engine (TypeScript)

Özel eğitim alanında beceri/basamak (task analysis) değerlendirmesi için deterministik, kural-tabanlı, açıklanabilir bir değerlendirme motoru — evrensel TypeScript modülü.

Herhangi bir yapay zekâ modeli kullanmaz. Her beceri (örn. "El Yıkama") onlarca basamaktan oluşur; her basamak ayrı ayrı değerlendirilir (Bağımsız / Sözel İpucu / İşaret İpucu / Model Olma / Fiziksel Yardım / Tam Fiziksel Yardım / Yapamadı / Gözlenmedi / Muaf). Sistem başarı yüzdesinin ötesinde; bağımsızlık düzeyi, ipucu bağımlılığı, hata örüntüleri, ilerleme hızı ve grafik-hazır veri üretir — hepsi gerekçeli.

Aynı algoritmanın [Swift karşılığı](https://github.com/rootayb/task-analysis-assessment-engine) da mevcuttur — iki paket birebir aynı mimariyi ve formülleri paylaşır. Bu motor, [Goal Recommendation Engine](https://github.com/rootayb/goal-recommendation-engine-ts)'in veri kaynağıdır.

Tam mimari tasarım için: [ARCHITECTURE.md](ARCHITECTURE.md)

## Neden evrensel?

- **Sıfır çalışma zamanı bağımlılığı**, **ESM + CJS ikili derleme**.
- **Platform bağımsız çekirdek** — `node:fs` yalnızca isteğe bağlı `task-analysis-assessment-engine/node` alt yolunda; ana modül tarayıcıda, Node'da, Deno'da ve edge runtime'larda doğrudan çalışır.
- **Framework bağımsız** — React/Next.js, düz Node.js API'si, CLI aracı — hepsine aynı şekilde entegre edilir.

## Kurulum

```bash
npm install task-analysis-assessment-engine
```

## Hızlı kullanım

```ts
import {
  AssessmentEngine,
  ConfigurationManager,
  createSkill,
  createStep,
  skillId,
  studentId
} from "task-analysis-assessment-engine";

const skill = createSkill({
  id: skillId("hand-washing"),
  name: "El Yıkama",
  domain: "Özbakım",
  steps: [
    createStep({ id: stepId("hw-1"), skillId: skillId("hand-washing"), order: 1, name: "Musluğu aç", description: "" })
    // ...diğer basamaklar
  ]
});

const config = ConfigurationManager.default(); // veya ConfigurationManager.fromJSON(yourJson)
const engine = new AssessmentEngine(config);

const report = engine.generateReport(skill, studentId("student-1"), pastSessions);
// report.latestResult.successRate, .overallSuccessLevel
// report.explanation.reasons, .mostErrorProneSteps, .recommendedStepsToRetry
// report.chartData.progressLine / .errorBar / .promptPie
```

Kritik bir basamak (Ocak Açma, Bıçak Kullanma, Elektrik Prizi...) başarısızsa, ham başarı yüzdesi yüksek olsa bile `overallSuccessLevel` "tam başarılı" olamaz — ham veri hiçbir zaman bozulmaz, yalnızca yorumlanan seviye sınırlanır.

## Next.js entegrasyon örneği

[`examples/nextjs-demo`](examples/nextjs-demo) — App Router Server Component içinde paketi çalıştıran, gerçek `next build`/`next dev` ile doğrulanmış minimal bir demo.

```bash
npm install && npm run build   # kök dizinde — dist/ üretir
cd examples/nextjs-demo
npm install
npm run dev
```

## Mimari

| Modül | Sorumluluk |
|---|---|
| `src/domain` | Framework-bağımsız domain tipleri (`Skill`, `Step`, `StepObservation`, `AssessmentSession`, `AssessmentResult`, `Explanation`, `ChartDataPoint`) |
| `src/config` | `ConfigurationManager` — puanlar, eşikler, kritik kurallar, ipucu ağırlıkları, doğrulama |
| `src/core/engines` | `ValidationEngine`, `ScoringEngine`, `CriticalStepEvaluator`, `PromptAnalysisEngine`, `ErrorAnalysisEngine`, `ProgressEngine`, `StatisticsEngine`, `ChartDataEngine`, `ExplanationEngine`, `ReportingEngine` |
| `src/core/AssessmentEngine.ts` | Tüm motorları orkestre eden ana giriş noktası |
| `src/persistence` | Bellek içi (ortam bağımsız) repository implementasyonları |
| `src/node.ts` | Yalnızca Node.js — `node:fs` tabanlı JSON dosya repository'si |

## Geliştirme

```bash
npm install
npm run build       # tsup ile ESM+CJS+d.ts derleme
npm test            # vitest
npm run typecheck   # tsc --noEmit
```

## Lisans

MIT — bkz. [LICENSE](LICENSE)
