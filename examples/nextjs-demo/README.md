# Next.js Demo — Task Analysis Assessment Engine

`task-analysis-assessment-engine` paketini bir Next.js App Router Server Component içinde çalıştıran, `next build` ile doğrulanmış minimal bir örnek.

## Çalıştırma

```bash
# 1. Kök dizinde paketi derle (dist/ üretir)
cd ../..
npm install
npm run build

# 2. Bu örneği kur ve çalıştır
cd examples/nextjs-demo
npm install
npm run dev
```

`http://localhost:3000` adresinde, "El Yıkama" becerisinin 4 oturumluk geçmişi üzerinden üretilen tam rapor gösterilir: başarı yüzdesi/seviyesi, gerekçeler, ilerleme çizgisi, en çok hata yapılan basamaklar ve ipucu dağılımı.
