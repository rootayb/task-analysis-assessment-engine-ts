# Task Analysis Assessment Engine — Mimari Tasarım Dokümanı

Özel eğitim alanında beceri/basamak (task analysis) değerlendirmesi için deterministik, kural-tabanlı, açıklanabilir motor.
Bu sistem [Goal Recommendation Engine](https://github.com/rootayb/goal-recommendation-engine)'in **veri kaynağıdır**: hedef öneri motorunun ihtiyaç duyduğu `percentage` değerleri, hata listeleri ve ilerleme geçmişi burada üretilir.

---

## 1. Genel Sistem Mimarisi

### 1.1 Konumlandırma

```
┌─────────────────────────────────────────────────────────────────┐
│                     Öğretmen / Değerlendirici                    │
└───────────────────────────────┬───────────────────────────────────┘
                                 │ basamak bazlı gözlem girişi
┌───────────────────────────────▼───────────────────────────────────┐
│              Task Analysis Assessment Engine (bu doküman)         │
│   Skill/Step tanımı → StepObservation → Scoring/Prompt/Error/     │
│   Progress/Statistics → RecommendationReadyData                  │
└───────────────────────────────┬───────────────────────────────────┘
                                 │ percentage, errorProfile, environmentScores
┌───────────────────────────────▼───────────────────────────────────┐
│              Goal Recommendation Engine (önceki proje)            │
│   Bu verileri StudentProfile.assessments olarak tüketir           │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Katman Diyagramı

```
┌──────────────────────────────────────────────────────────────┐
│                     Presentation Layer                        │
│         (SwiftUI Views / ViewModels — bu aşamada dışarıda)     │
└───────────────────────────┬────────────────────────────────────┘
                             │
┌───────────────────────────▼────────────────────────────────────┐
│                  Application / Orchestration                   │
│                      AssessmentEngine                          │
│   (bir değerlendirme oturumunu uçtan uca yönetir: gözlem       │
│    toplama → alt motorları çağırma → AssessmentResult üretme)  │
└───────────────────────────┬────────────────────────────────────┘
                             │
    ┌───────────┬───────────┼───────────┬───────────┬────────────┐
    ▼           ▼           ▼           ▼           ▼            ▼
 Validation  Scoring   PromptAnalysis  ErrorAnalysis Progress  Statistics
  Engine     Engine       Engine         (dahili)    Engine     Engine
    │           │           │               │           │          │
    └───────────┴───────────┴───────────────┴───────────┴──────────┘
                             │
                    ┌────────▼─────────┐
                    │   Domain Core      │
                    │  Skill / Step /    │
                    │  StepObservation / │
                    │  AssessmentSession │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
     ConfigurationManager  ChartDataEngine  ReportingEngine
                                             │
                                    ExplanationEngine
```

### 1.3 Modül Sorumlulukları

| Modül | Sorumluluk | Bağımlılık |
|---|---|---|
| `ConfigurationManager` | Puanlar, eşikler, kritik kurallar, ipucu tipleri, performans seviyeleri — hepsi burada | Yok (en alt katman) |
| `ValidationEngine` | Bir `StepObservation`'ın geçerliliğini kontrol eder (zorunlu basamak eksik mi, geçersiz durum mu) | ConfigurationManager |
| `ScoringEngine` | Basamak durumlarını puana çevirir, toplam/oranları hesaplar | ConfigurationManager |
| `CriticalStepEvaluator` | Kritik basamak kuralını uygular (kritik basarısızsa beceri "tam başarılı" sayılmaz) | ConfigurationManager |
| `PromptAnalysisEngine` | İpucu türü × kullanım sıklığı dağılımı | ConfigurationManager |
| `ErrorAnalysisEngine` | En çok hata yapılan basamakları sıralar | ConfigurationManager |
| `ProgressEngine` | Zaman içindeki değerlendirmelerden hız/trend/durgunluk/gerileme çıkarır | ConfigurationManager |
| `StatisticsEngine` | Basamak bazlı ve beceri bazlı özet istatistikler (ortalama, medyan, std sapma) | ScoringEngine çıktıları |
| `ChartDataEngine` | Line/Bar/Radar/Pie/TimeSeries için framework-bağımsız veri noktaları üretir | Statistics/Progress/Prompt/Error çıktıları |
| `ExplanationEngine` | Her sonucun gerekçesini (kanıt listesi) üretir | Tüm motorların ara çıktıları |
| `ReportingEngine` | Tüm çıktıları tek bir `AssessmentReport`'ta birleştirir | Yukarıdakilerin tümü |
| `AssessmentEngine` | Orkestrasyon — tek giriş noktası | Yukarıdakilerin tümü (DI ile) |

### 1.4 Tasarım İlkeleri

- **Deterministik**: Aynı `StepObservation` listesi her zaman aynı `AssessmentResult`'ı üretir.
- **Config-driven**: Puanlar (100/80/65/50/30/10/0), eşikler (%20/%40/%60/%80/%95), kritik kurallar, ipucu listesi — hiçbiri kodda sabit değil.
- **Veri kaynağı, karar verici değil**: Bu motor "beceri kazanıldı" demez; yalnızca ölçülebilir veriyi (`percentage`, `errorProfile`, `promptProfile`, `progressTrend`) üretir. Yorumlama Goal Recommendation Engine'in işi.
- **Genişletilebilir**: Yeni bir beceri/basamak eklemek veri katmanına kayıt eklemektir; yeni bir değerlendirme durumu (örn. "Elektronik İpucu") eklemek yalnızca config'e girer.

---

## 2. Veri Modeli

### 2.1 Skill (Beceri)

| Alan | Tip | Açıklama |
|---|---|---|
| `id` | `SkillID` | Benzersiz kimlik |
| `name` | `String` | "El Yıkama" |
| `domain` | `Domain` | Goal Recommendation Engine ile aynı alan enum'u (Özbakım, Bağımsız Yaşam, vb.) — entegrasyon için paylaşılan sözlük |
| `steps` | `[Step]` | Sıralı basamak listesi |

### 2.2 Step (Basamak)

| Alan | Tip | Açıklama |
|---|---|---|
| `id` | `StepID` | Benzersiz kimlik |
| `skillId` | `SkillID` | Ait olduğu beceri |
| `order` | `Int` | Sıra numarası (1, 2, 3...) |
| `name` | `String` | "Sabun al" |
| `description` | `String` | Açıklama |
| `isRequired` | `Bool` | Zorunlu mu |
| `isCritical` | `Bool` | Kritik mi (bkz. §5) |
| `maxScore` | `Double` | Bu basamak için maksimum puan (genelde 100, ama bazı basamaklar ağırlıklı olabilir) |
| `promptsAllowed` | `Bool` | İpucuna izin veriliyor mu (bazı basamaklar "ya bağımsız ya hiç" olabilir) |
| `repetitionCount` | `Int` | Bu basamağın oturum içinde kaç kez tekrar edildiği (örn. "ovala" 1 basamak ama 3 kez sayılabilir) |

### 2.3 AssessmentState (Değerlendirme Durumu)

Config'ten okunan, genişletilebilir bir sözlük (Bölüm 4). Varsayılan 9 durum:
`independent | verbalPrompt | gesturePrompt | modeling | physicalPrompt | fullPhysicalPrompt | failed | notObserved | exempt`

### 2.4 StepObservation (Tekil Basamak Gözlemi)

| Alan | Tip | Açıklama |
|---|---|---|
| `id` | `ObservationID` | Kimlik |
| `stepId` | `StepID` | Hangi basamak |
| `state` | `AssessmentStateID` | Hangi durumla işaretlendi |
| `notes` | `String?` | Öğretmen notu (bkz. §14 gelecek özellikler) |
| `promptCount` | `Int?` | Bu basamakta kaç kez ipucu verildiği (aynı basamak içinde birden fazla deneme) |

### 2.5 AssessmentSession (Değerlendirme Oturumu)

| Alan | Tip | Açıklama |
|---|---|---|
| `id` | `SessionID` | Kimlik |
| `skillId` | `SkillID` | Değerlendirilen beceri |
| `studentId` | `StudentID` | Öğrenci (Goal Recommendation Engine ile aynı `StudentID` tipi) |
| `environment` | `Environment` | Okul/Ev/Bahçe/Rehabilitasyon — Goal Recommendation Engine ile paylaşılan enum |
| `assessorId` | `String?` | Değerlendiriciyi yapan kişi (çoklu değerlendirici desteği için, bkz. §14) |
| `observations` | `[StepObservation]` | Bu oturumdaki tüm basamak gözlemleri |
| `observedAt` | `Date` | Oturum tarihi |

### 2.6 AssessmentResult (Çıktı)

`ScoringEngine` + `CriticalStepEvaluator` + `PromptAnalysisEngine` + `ErrorAnalysisEngine`'in birleşik çıktısı — bkz. §6-8.

---

## 3. Beceri ve Basamak Yapısı

### 3.1 Dinamik Tanım İlkesi

Hiçbir beceri/basamak kodda sabit değildir. `SkillDefinitionRepository` protokolü arkasında JSON/veritabanı/API'den yüklenir (Goal Recommendation Engine'deki `SkillGraphRepository` ile aynı desen).

```json
{
  "id": "hand-washing",
  "name": "El Yıkama",
  "domain": "Özbakım",
  "steps": [
    { "id": "hw-1", "order": 1, "name": "Musluğu aç", "isRequired": true, "isCritical": false, "maxScore": 100, "promptsAllowed": true, "repetitionCount": 1 },
    { "id": "hw-2", "order": 2, "name": "Ellerini ıslat", "isRequired": true, "isCritical": false, "maxScore": 100, "promptsAllowed": true, "repetitionCount": 1 },
    { "id": "hw-3", "order": 3, "name": "Sabun al", "isRequired": true, "isCritical": false, "maxScore": 100, "promptsAllowed": true, "repetitionCount": 1 },
    { "id": "hw-4", "order": 4, "name": "Sabunu sür", "isRequired": true, "isCritical": false, "maxScore": 100, "promptsAllowed": true, "repetitionCount": 1 },
    { "id": "hw-5", "order": 5, "name": "Ovala", "isRequired": true, "isCritical": false, "maxScore": 100, "promptsAllowed": true, "repetitionCount": 3 },
    { "id": "hw-6", "order": 6, "name": "Durula", "isRequired": true, "isCritical": false, "maxScore": 100, "promptsAllowed": true, "repetitionCount": 1 },
    { "id": "hw-7", "order": 7, "name": "Musluğu kapat", "isRequired": true, "isCritical": false, "maxScore": 100, "promptsAllowed": true, "repetitionCount": 1 },
    { "id": "hw-8", "order": 8, "name": "Kurula", "isRequired": true, "isCritical": false, "maxScore": 100, "promptsAllowed": true, "repetitionCount": 1 }
  ]
}
```

"Çay Hazırlama" gibi kritik basamak içeren bir beceri:

```json
{ "id": "tea-3", "order": 3, "name": "Ocağı Aç", "isRequired": true, "isCritical": true, "maxScore": 100, "promptsAllowed": true, "repetitionCount": 1 }
```

### 3.2 Sıralama ve Bütünlük Doğrulaması

`SkillDefinitionValidator` (ValidationEngine'in bir parçası):
- `order` değerleri 1'den başlayıp ardışık mı?
- Tekrarlanan `order` var mı?
- `steps` boş mu?
- Her `Step.skillId`, ait olduğu `Skill.id` ile eşleşiyor mu?

---

## 4. Puanlama Algoritması

### 4.1 Config'ten Puan Haritası

```
ScoreMap: [AssessmentStateID: Double?]
  independent          → 100
  verbalPrompt         → 80
  gesturePrompt        → 65
  modeling             → 50
  physicalPrompt       → 30
  fullPhysicalPrompt   → 10
  failed               → 0
  notObserved          → nil   (hesaba katılmaz)
  exempt               → nil   (hesaba katılmaz)
```

`nil` değeri "bu basamak ortalamaya dahil edilmez" anlamına gelir — sıfır değildir.

### 4.2 ScoringEngine Akışı

```
1. Her StepObservation için:
   a. ConfigurationManager.scoreMap[observation.state] → rawScore (Double? veya nil)
   b. rawScore != nil ise:
      effectiveScore = rawScore × (step.maxScore / 100)
      countsTowardAverage = true
   c. rawScore == nil ise:
      countsTowardAverage = false
2. Beceri bazlı ortalama:
   successRate = Σ(effectiveScore) / Σ(step.maxScore, sadece countsTowardAverage basamaklar için)
3. Sonuç: her basamak için StepScore { stepId, state, rawScore, effectiveScore, countsTowardAverage }
```

### 4.3 Neden `maxScore` Ağırlıklı?

Bazı basamaklar (örn. "Ocağı Aç") diğerlerinden daha fazla ağırlığa sahip olabilir (kurumsal tercih). `maxScore` her basamak için bağımsız ağırlıklandırma sağlar; varsayılan 100 ise tüm basamaklar eşit ağırlıklıdır.

---

## 5. Kritik Basamak Algoritması

### 5.1 Kural

```
CriticalStepEvaluator.evaluate(session, scores) -> CriticalEvaluationResult {
    hasCriticalFailure: Bool
    failedCriticalSteps: [StepID]
}

failedCriticalSteps = session.observations
    .filter { step(for: $0).isCritical }
    .filter { config.failureStates.contains($0.state) }   // varsayılan: [failed], config'ten genişletilebilir
    .map { $0.stepId }

hasCriticalFailure = !failedCriticalSteps.isEmpty
```

`config.failureStates` varsayılan olarak yalnızca `failed` içerir, ancak bir kurum "Tam Fiziksel Yardım gerektiren kritik basamak da başarısız sayılsın" diyebilir — bu liste config'te genişletilebilir.

### 5.2 Sonuca Etkisi

`hasCriticalFailure == true` ise:
- `AssessmentResult.overallSuccessLevel` **asla** "Bağımsız" veya "Çok İyi" olamaz — otomatik olarak en fazla `config.criticalFailureCapLevel` (varsayılan: "Gelişiyor") ile sınırlanır, `successRate` sayısal olarak yüksek çıksa bile.
- `ExplanationEngine`, bu durumu her zaman en üstte, olumsuz bir `Reason` olarak raporlar (örn. "✗ Kritik basamak başarısız: Ocağı Aç — beceri tam başarılı sayılamaz").
- `Goal Recommendation Engine`'e aktarılan `percentage` değeri **düşürülmez** (ham veri bozulmaz), ancak ayrıca bir `hasCriticalFailure: true` bayrağı iletilir — hedef öneri motoru bunu `masteredOverrides`'ı asla otomatik `true` yapmama kuralı olarak kullanabilir.

Bu ayrım önemlidir: sayısal başarı oranı dürüstçe raporlanır, ama *yorumlanan* seviye (overallSuccessLevel) kritik başarısızlığı asla gizlemez.

---

## 6. Başarı Hesaplama Formülleri

### 6.1 Sayaçlar

```
totalSteps            = skill.steps.count
evaluatedSteps         = observations.filter { state ∉ {notObserved} }.count
exemptSteps            = observations.filter { state == exempt }.count
notObservedSteps       = observations.filter { state == notObserved }.count
independentSteps       = observations.filter { state == independent }.count
promptedSteps          = observations.filter { state ∈ {verbalPrompt, gesturePrompt, modeling, physicalPrompt, fullPhysicalPrompt} }.count
failedSteps            = observations.filter { state == failed }.count
scorableSteps          = evaluatedSteps - exemptSteps   // puanlamaya dahil edilebilecek basamaklar
```

### 6.2 Oranlar

```
independenceRatio  = independentSteps / scorableSteps            (scorableSteps > 0 ise, aksi halde 0)
promptRatio        = promptedSteps / scorableSteps
successRate        = Σ(effectiveScore) / Σ(applicableMaxScore)     (bkz. §4.2 — asıl "başarı yüzdesi")
completionRatio    = evaluatedSteps / totalSteps                   (kaç basamağın hiç değerlendirildiği — veri kalitesi göstergesi)
```

`successRate`, Goal Recommendation Engine'e aktarılan `Assessment.percentage` değeridir.

### 6.3 overallSuccessLevel

`ConfigurationManager.performanceLevels` eşiklerine göre `successRate`'ten türetilir (§9 ile aynı seviyeler: Başlanmadı/Çok Düşük/Gelişiyor/İyi/Çok İyi/Bağımsız), ardından §5.2'deki kritik basamak tavanı uygulanır.

---

## 7. İpucu (Prompt) Analiz Algoritması

### 7.1 PromptProfile

```
PromptAnalysisEngine.analyze(session) -> PromptProfile {
    countsByType: [AssessmentStateID: Int]     // { verbalPrompt: 12, modeling: 5, physicalPrompt: 2 }
    totalPrompts: Int                           // countsByType değerlerinin toplamı (independent/failed/notObserved/exempt hariç)
    mostFrequentPromptType: AssessmentStateID?
    promptDependencyIndex: Double                // Σ(promptWeight[state] × count[state]) / totalPrompts
}
```

`promptWeight`, config'te ipucu "invaziflik" ağırlığı olarak tanımlanır (örn. sözel=1, işaret=2, model=3, fiziksel=4, tam fiziksel=5) — `promptDependencyIndex` yüksekse öğrenci daha invaziv ipuçlarına bağımlı demektir; bu, salt sayım listesinden daha zengin bir sinyal sunar.

### 7.2 Kullanım Amacı

`ChartDataEngine`, `countsByType`'ı doğrudan bar/pasta grafik veri noktalarına çevirir (bkz. §10). `promptDependencyIndex`'in zaman içindeki düşüşü, `ProgressEngine` için ek bir ilerleme sinyalidir (başarı yüzdesi sabit kalsa bile ipucu invazifliği azalıyorsa bu olumlu bir ilerlemedir).

---

## 8. Hata Analiz Algoritması

### 8.1 ErrorProfile

```
ErrorAnalysisEngine.analyze(sessions: [AssessmentSession]) -> ErrorProfile {
    errorCountsByStep: [StepID: Int]     // { "hw-3": 6, "hw-7": 5, "hw-8": 1 }
    mostErrorProneSteps: [StepErrorEntry]  // errorCountsByStep'ten azalan sırada, isim çözümlenmiş
    errorRate: [StepID: Double]           // errorCount / (o basamağın değerlendirildiği toplam oturum sayısı)
}
```

"Hata" tanımı config'ten gelir: varsayılan olarak `state ∈ {failed}`, ancak bir kurum `physicalPrompt` ve üstünü de "yardıma dayalı hata" sayabilir (`config.errorStates` genişletilebilir liste).

### 8.2 Çoklu Oturum Toplaması

Tek bir oturumdan ziyade, `ErrorAnalysisEngine` genellikle **birden fazla `AssessmentSession`** üzerinde çalışır (örn. son 5 değerlendirme) — bu, "Sabun Alma'da 6 hata" gibi bir örüntünün tek seferlik bir kötü günden mi yoksa kalıcı bir zorluktan mı kaynaklandığını ayırt etmeyi sağlar.

### 8.3 Goal Recommendation Engine'e Aktarım

`mostErrorProneSteps`, `RecommendationEngine`'in `ExplanationEngine`'ine "tekrar önerilen basamaklar" olarak beslenir — bu, hedef öneri motorunun `NeedsReview`/`CompletePrerequisitesFirst` gerekçelerini basamak düzeyinde zenginleştirir.

---

## 9. İlerleme Analiz Algoritması

### 9.1 Performans Seviyeleri (Config)

```
0–20    Başlanmadı
20–40   Çok Düşük
40–60   Gelişiyor
60–80   İyi
80–95   Çok İyi
95–100  Bağımsız
```

### 9.2 ProgressPoint Serisi

```
ProgressEngine girdisi: [ProgressPoint { date: Date, successRate: Double }]  (geçmiş AssessmentResult'lardan türetilir)
```

### 9.3 Hız (Velocity) Hesaplama

```
weeklyGrowth  = (successRate[t] - successRate[t-7gün]) / 7
monthlyGrowth = (successRate[t] - successRate[t-30gün]) / 30
averageGrowth = linear regression slope (en küçük kareler) — tüm ProgressPoint serisi üzerinden
```

Basit iki-nokta farkı yerine `averageGrowth` için lineer regresyon kullanılır çünkü gerçek değerlendirme aralıkları düzensizdir (haftalık değil); bu, gürültülü tekil ölçümlere karşı daha dayanıklıdır.

### 9.4 Durum Sınıflandırması

```
ProgressStatus = 
  .improving   if averageGrowth > config.progressThresholds.improvingSlope       (varsayılan > 0.5 puan/gün)
  .plateau     if |averageGrowth| <= config.progressThresholds.plateauSlope       (varsayılan <= 0.5 puan/gün)
  .regressing  if averageGrowth < -config.progressThresholds.plateauSlope
```

`plateau` (durgunluk) tespiti özellikle önemlidir: art arda `config.progressThresholds.plateauSessionCount` (varsayılan 3) değerlendirme boyunca `plateau` durumu sürerse, `ExplanationEngine` bunu ayrı bir uyarı olarak işaretler ("son 3 değerlendirmede ilerleme durdu — öğretim stratejisi gözden geçirilmeli").

---

## 10. Grafik Veri Modeli

Motor **hiçbir zaman** grafik çizmez; yalnızca Swift Charts / Chart.js / Recharts gibi kütüphanelerin doğrudan tüketebileceği, framework-bağımsız veri noktaları üretir.

### 10.1 Ortak ChartDataPoint

```
ChartDataPoint {
    label: String       // "1 Ocak" veya "Sabun Alma"
    value: Double
    category: String?    // gruplandırma için (örn. ipucu tipi)
}
```

### 10.2 Grafik Türlerine Göre Üretim

| Grafik | Kaynak | Örnek çıktı |
|---|---|---|
| **Çizgi (Line)** | `ProgressEngine` → zaman serisi | `[{label:"1 Oca", value:40}, {label:"8 Oca", value:55}, ...]` |
| **Bar** | `ErrorAnalysisEngine.mostErrorProneSteps` | `[{label:"Sabun Alma", value:6}, {label:"Musluğu Kapatma", value:5}, ...]` |
| **Radar** | Beceri alanları bazında `successRate` (Özbakım/Akademik/Sosyal/Motor...) | Her alan bir eksen, değer o alandaki ortalama başarı |
| **Pasta (Pie)** | `PromptAnalysisEngine.countsByType` | `[{label:"Sözel İpucu", value:12}, {label:"Model", value:5}, ...]` |
| **Zaman serisi (çoklu seri)** | Birden fazla beceri için `ProgressEngine` çıktısı üst üste | `{series: [{name:"El Yıkama", points:[...]}, {name:"Çay Hazırlama", points:[...]}]}` |

### 10.4 Swift Charts Uyumluluğu

`ChartDataPoint`, doğrudan `Identifiable + Codable` bir `struct` olduğundan SwiftUI'de:

```swift
Chart(dataPoints) {
    LineMark(x: .value("Tarih", $0.label), y: .value("Başarı", $0.value))
}
```
şeklinde ek dönüşüm gerektirmeden kullanılabilir. TypeScript tarafında aynı şekil (`{label, value, category}`) Recharts/Chart.js/D3'e doğrudan beslenir.

---

## 11. Açıklanabilir Sonuç Sistemi

### 11.1 İlke (Goal Recommendation Engine ile aynı)

Hiçbir `AssessmentResult`, gerekçesiz üretilmez. `ExplanationEngine`, tüm alt motorların ara çıktılarını `Reason` nesnelerine çevirir.

### 11.2 AssessmentExplanation

```
AssessmentExplanation {
    skillId: SkillID
    successRate: Double
    overallSuccessLevel: PerformanceLevel
    reasons: [Reason]                 // pozitif/negatif kanıtlar
    mostErrorProneSteps: [StepErrorEntry]
    promptProfile: PromptProfile
    recommendedStepsToRetry: [StepID]  // en çok hata yapılan + kritik başarısız basamaklar birleşimi
}
```

### 11.3 Örnek Çıktı

```
Başarı: %74
✓ Bağımsız yapılan basamak: 6
✗ En fazla hata: Sabun Alma (6 kez)
✗ Fiziksel yardım gerektiren basamak sayısı: 2
✗ Kritik basamak başarısız: yok
→ Genel seviye: İyi
→ Tekrar önerilen basamaklar: Sabun Alma, Kurulama, Musluğu Kapatma
```

Her satır, ilgili motorun (`ScoringEngine`, `ErrorAnalysisEngine`, `PromptAnalysisEngine`, `CriticalStepEvaluator`) somut bir çıktısına doğrudan bağlıdır — hiçbir metin serbestçe üretilmez, template + veri birleşimidir.

---

## 12. Config Sistemi

Tek bir `AssessmentConfig` kök yapısı:

```
AssessmentConfig {
    version: String
    states: [AssessmentStateDefinition]     // id, isim, sıra, ham puan (nil = hesaba katılmaz)
    failureStates: [AssessmentStateID]       // kritik basarısızlık sayılan durumlar
    errorStates: [AssessmentStateID]         // hata sayılan durumlar
    promptWeights: [AssessmentStateID: Double]  // invaziflik ağırlıkları
    performanceLevels: ThresholdList          // 6 seviyeli eşik listesi
    criticalFailureCapLevel: PerformanceLevel  // kritik başarısızlıkta tavan seviye
    progressThresholds: { improvingSlope, plateauSlope, plateauSessionCount }
    errorAnalysisSessionWindow: Int           // kaç son oturum üzerinden hata analizi yapılacak (varsayılan 5)
}
```

Hiçbir puan/eşik/kural kodda sabit değildir; tamamı bu yapıdan okunur ve `ConfigurationManager` init sırasında doğrulanır (örn. `states` listesinin boş olmaması, `performanceLevels` sıralı olması, `promptWeights`'in `states`'teki her ipucu durumunu kapsaması).

---

## 13. Mimari (Modülerlik, SOLID, DI, Test Edilebilirlik)

Goal Recommendation Engine'de kurulan desenin birebir aynısı:

- **Single Responsibility**: Her motor tek bir hesaplama sorumluluğuna sahip (Scoring ≠ Prompt ≠ Error ≠ Progress ≠ Statistics ≠ Chart ≠ Explanation ≠ Reporting ≠ Validation).
- **Open/Closed**: Yeni bir grafik türü veya yeni bir ilerleme metriği, mevcut motorlara dokunmadan yeni bir `ChartDataProvider`/`ProgressMetric` protokol implementasyonu ile eklenir.
- **Liskov Substitution**: Tüm motorlar protokol arkasında (`ScoreCalculating`, `PromptAnalyzing`, `ErrorAnalyzing`, `ProgressAnalyzing`...) tanımlanır; test double'ları sorunsuz yer değiştirir.
- **Interface Segregation**: `SkillDefinitionRepository` yalnızca beceri/basamak sorgusu, `AssessmentSessionRepository` yalnızca oturum CRUD'u sağlar.
- **Dependency Inversion**: `AssessmentEngine` somut sınıflara değil protokollere bağımlıdır; `ConfigurationManager`, repository'ler dışarıdan enjekte edilir.
- **Dependency Injection**: Constructor injection, tüm motorlarda tutarlı.
- **Test Edilebilirlik**: Magic number yok, her motor saf fonksiyon gibi davranır (yan etkisiz), `now: () -> Date` gibi zaman bağımlılıkları enjekte edilir (Goal Recommendation Engine'deki `ReviewEngine` deseniyle aynı).

---

## 14. SwiftUI Uyumluluğu ve Genişletilebilir Mimari Önerileri

### 14.1 SwiftUI Hazırlığı (Bölüm 13'ün devamı)

- **Value Types**: Tüm domain modelleri `struct`/`enum`, `class` yalnızca stateful motor/repository implementasyonlarında.
- **Codable**: Tüm modeller JSON'a serileştirilebilir (Goal Recommendation Engine ile aynı desen — branded ID'ler tek-değerli container ile).
- **Sendable**: Tüm domain tipleri ve motorlar `Sendable` — Swift Concurrency ile güvenli.
- **Protocol Oriented Programming**: Motorlar arayüz arkasında, `AssessmentEngineFactory` ile üretim ortamı/test ortamı farklı implementasyonlar enjekte edebilir (Factory Pattern).
- **Repository Pattern**: `SkillDefinitionRepository`, `AssessmentSessionRepository` — JSON/CoreData/CloudKit implementasyonları birbirinin yerine geçebilir.

### 14.2 Genişletilebilir Mimari Önerileri (İstenen Gelecek Özellikler)

| Özellik | Mimariye Etkisi |
|---|---|
| **Çoklu değerlendirici** | `AssessmentSession.assessorId` zaten mevcut; yeni bir `InterRaterAgreementEngine` (aynı beceri/tarih için birden fazla session'ı karşılaştırır — Goal Recommendation Engine'in gelecek özellik listesindeki aynı motorla ortak tasarım) |
| **Video destekli değerlendirme** | `StepObservation`'a opsiyonel `mediaReference: URL?` eklenir; puanlama mantığı değişmez, yalnızca kanıt eklenir |
| **Ortam bazlı değerlendirme** | `AssessmentSession.environment` zaten mevcut; `StatisticsEngine`'e ortamlar arası karşılaştırma view'ı eklenir (Goal Recommendation Engine'deki `GeneralizationEngine` ile aynı veriyi besler) |
| **Tarihsel karşılaştırmalar** | `ProgressEngine` zaten zaman serisi tutuyor; iki tarih aralığı arasında diff view'ı eklemek yeni bir `ComparisonEngine` gerektirir, mevcut motorlara dokunmaz |
| **Öğretmen notları** | `StepObservation.notes` zaten mevcut; `AssessmentSession` düzeyinde de `generalNotes: String?` eklenebilir |
| **Aile gözlem kayıtları** | `assessorId`/`environment` kombinasyonu zaten "Ev" ortamından "Veli" değerlendiricisini ayırt eder; ek şema değişikliği gerekmez |
| **Otomatik hedef öneri motoruna veri aktarımı** | `AssessmentResult → Assessment` dönüştürücü (`RecommendationDataAdapter`) — `successRate` → `percentage`, `environment` → `Environment`, `hasCriticalFailure` → `masteredOverrides` ipucu olarak kullanılabilir |
| **Adaptif oyun motoruna veri aktarımı** | `PromptProfile` + `ErrorProfile`, oyun zorluk ayarlaması için doğrudan girdi olabilir; `GameDataAdapter` adında ayrı bir dönüştürücü, çekirdek motorlara dokunmadan eklenir |
| **BEP hedeflerinin otomatik güncellenmesi** | `ProgressEngine.status == .improving` + `successRate >= masteryThreshold` kombinasyonu, harici bir "BEP Sync" servisine olay (event) olarak yayınlanabilir — `AssessmentEngine`'e opsiyonel bir `AssessmentEventPublisher` protokolü enjekte edilerek, çekirdek hesaplama mantığından tamamen ayrık tutulur |

### 14.3 Eksik Yönler ve Ele Alınan Riskler (Analiz Notları)

Tasarım sırasında belirlenen ve mimariye önceden yerleştirilen riskler:

1. **"Gözlenmedi" ile "Yapamadı" karıştırılması** → Ayrı durumlar, `notObserved` hesaba katılmaz, `failed` sıfır puan alır ve hata sayılır. Karıştırılırsa `successRate` yanlış yükselir/düşer; §4.1'de açıkça ayrıştırıldı.
2. **Tek oturumdan hata örüntüsü çıkarma yanılgısı** → §8.2'de çoklu oturum penceresi (`errorAnalysisSessionWindow`) zorunlu kılındı.
3. **Kritik basamağın sayısal ortalamayı gizlemesi riski** → §5.2'de sayısal `successRate` ile yorumlanan `overallSuccessLevel` bilinçli olarak ayrıştırıldı; ham veri hiçbir zaman bozulmaz.
4. **Düzensiz aralıklı değerlendirmelerde yanlış hız hesabı** → §9.3'te iki-nokta farkı yerine lineer regresyon tercih edildi.
5. **`maxScore` ağırlıklandırmasının yanlışlıkla `promptsAllowed=false` ile çelişmesi** → Bir basamak `promptsAllowed=false` ise ama gözlem `verbalPrompt` gibi bir ipucu durumuyla geldiyse, `ValidationEngine` bunu bir uyarı (hata değil, veri kalitesi bayrağı) olarak işaretler — sert reddetmek yerine gözlemi kabul edip raporlar (öğretmen girişini kaybetmemek için).
6. **Config'in kendi içinde tutarsız olması** (örn. `promptWeights`'te tanımlı olmayan bir state) → `ConfigurationManager` init sırasında tüm çapraz referansları doğrular, geçersiz config asla yaşayan bir örneğe dönüşemez (Goal Recommendation Engine'deki `ConfigManager.validate()` deseniyle birebir aynı).
