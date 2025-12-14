# Architettura AWS e Stima Costi

## Architettura Proposta

### Opzione 1: Stesso Progetto, Routing Subdomain (RACCOMANDATO) ✅

**Vantaggi:**
- ✅ Un solo deploy
- ✅ Condivide database e autenticazione
- ✅ Meno complessità
- ✅ Costi inferiori
- ✅ Facile da gestire

**Configurazione:**
- `www.zelante.it` → Sito vetrina (stateless, può essere CDN)
- `app.zelante.it` → Applicazione (scalabile)

**Laravel gestisce routing subdomain:**
```php
// routes/web.php
Route::domain('www.zelante.it')->group(function () {
    Route::get('/', [HomeController::class, 'index']);
    Route::get('/pricing', [PricingController::class, 'index']);
    // ... route vetrina
});

Route::domain('app.zelante.it')->middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
    // ... route applicazione
});
```

### Opzione 2: Progetti Separati (Più Flessibile ma Più Costoso)

**Vantaggi:**
- ✅ Massima flessibilità
- ✅ Deploy indipendenti
- ✅ Stack tecnologico diverso se serve

**Svantaggi:**
- ❌ Costi doppi
- ❌ Gestione separata
- ❌ Autenticazione condivisa più complessa

---

## Architettura AWS Proposta

### Setup Base (Costo-Efficiente)

```
┌─────────────────────────────────────────┐
│         Route 53 (DNS)                  │
│    www.zelante.it → CloudFront          │
│    app.zelante.it → ALB                 │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌─────────▼────────┐
│  CloudFront    │    │  Application     │
│  (S3 + CDN)    │    │  Load Balancer   │
│  Sito Vetrina  │    │  (app.zelante.it)│
└────────────────┘    └─────────┬────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
            ┌───────▼────────┐    ┌─────────▼────────┐
            │  ECS Fargate   │    │   RDS MySQL      │
            │  (Container)   │    │   (db.t3.small)  │
            │  o EC2 t3.small│    │                  │
            └───────┬────────┘    └──────────────────┘
                    │
            ┌───────▼────────┐
            │  ElastiCache   │
            │  (Redis)       │
            └────────────────┘
```

### Componenti AWS

1. **Route 53** - DNS management
2. **CloudFront** - CDN per sito vetrina (S3)
3. **S3** - Storage sito vetrina statico (opzionale)
4. **Application Load Balancer (ALB)** - Load balancer per app
5. **ECS Fargate** - Container per applicazione (o EC2)
6. **RDS MySQL** - Database
7. **ElastiCache Redis** - Cache e queue
8. **SES** - Email (o Mailpit in dev)

---

## Stima Costi AWS (Mensile)

### Scenario 1: Startup/Sviluppo (Basso Traffico)

**Componenti:**
- **Route 53**: $0.50/mese (hosted zone) + $0.40/milione query
- **CloudFront**: $0.085/GB trasferito (primi 10TB)
- **S3**: $0.023/GB storage (primi 50GB)
- **ALB**: $16.20/mese + $0.008/GB trasferito
- **ECS Fargate**: 
  - 0.5 vCPU, 1GB RAM: ~$15/mese (se sempre attivo)
  - Con auto-scaling: $0-50/mese (in base a traffico)
- **RDS MySQL (db.t3.micro)**: $15/mese
- **ElastiCache Redis (cache.t3.micro)**: $12/mese
- **SES**: $0.10/1000 email (primi 62.000/mese gratis)

**Totale Stimato: ~$60-80/mese** (con traffico basso)

### Scenario 2: Produzione Media (Traffico Moderato)

**Componenti:**
- **Route 53**: $0.50/mese
- **CloudFront**: $5-10/mese (10-50GB/mese)
- **S3**: $1-2/mese
- **ALB**: $20/mese
- **ECS Fargate**: 
  - 1 vCPU, 2GB RAM: ~$30-50/mese
  - Auto-scaling 1-3 istanze: $50-150/mese
- **RDS MySQL (db.t3.small)**: $30/mese
- **ElastiCache Redis (cache.t3.small)**: $25/mese
- **SES**: $5-10/mese

**Totale Stimato: ~$150-250/mese**

### Scenario 3: Produzione Alta (Alto Traffico)

**Componenti:**
- **Route 53**: $0.50/mese
- **CloudFront**: $20-50/mese
- **S3**: $5-10/mese
- **ALB**: $30/mese
- **ECS Fargate**: 
  - 2-4 istanze (2 vCPU, 4GB): $200-400/mese
- **RDS MySQL (db.t3.medium)**: $80/mese
- **ElastiCache Redis (cache.t3.medium)**: $60/mese
- **SES**: $20-50/mese

**Totale Stimato: ~$400-600/mese**

---

## Opzioni Costo-Efficienti

### Opzione A: EC2 invece di ECS Fargate (Più Economico)

**ECS Fargate vs EC2:**
- **ECS Fargate**: Più semplice, ma più costoso (~$30-50/mese per 1 vCPU, 2GB)
- **EC2 t3.small**: ~$15-20/mese (1 vCPU, 2GB) - più controllo, meno costoso

**Risparmio: ~$15-30/mese**

### Opzione B: RDS vs Self-Hosted MySQL

**RDS vs EC2 con MySQL:**
- **RDS db.t3.small**: ~$30/mese (gestito, backup automatici)
- **EC2 t3.micro + MySQL**: ~$8-10/mese (self-managed)

**Risparmio: ~$20/mese** (ma più lavoro di gestione)

### Opzione C: ElastiCache vs Redis su EC2

**ElastiCache vs Self-Hosted:**
- **ElastiCache cache.t3.small**: ~$25/mese
- **Redis su EC2 esistente**: $0 (usa stesso EC2)

**Risparmio: ~$25/mese**

---

## Setup Consigliato per Iniziare (Costo-Efficiente)

### Fase 1: Startup (Primi 6 mesi)

```
- Route 53: $0.50/mese
- CloudFront + S3: $5/mese
- ALB: $16/mese
- EC2 t3.small (app + Redis): $15/mese
- RDS db.t3.micro: $15/mese
- SES: $5/mese

TOTALE: ~$56/mese
```

### Fase 2: Crescita (6-12 mesi)

```
- Route 53: $0.50/mese
- CloudFront + S3: $10/mese
- ALB: $20/mese
- EC2 t3.medium (app + Redis): $30/mese
- RDS db.t3.small: $30/mese
- SES: $10/mese

TOTALE: ~$100/mese
```

### Fase 3: Produzione (12+ mesi)

```
- Route 53: $0.50/mese
- CloudFront + S3: $20/mese
- ALB: $30/mese
- ECS Fargate (2 istanze): $100/mese
- RDS db.t3.medium: $80/mese
- ElastiCache: $60/mese
- SES: $20/mese

TOTALE: ~$310/mese
```

---

## Alternative AWS più Economiche

### 1. Lightsail (Più Semplice e Economico)

**Lightsail Bundle:**
- $10/mese: 1 vCPU, 2GB RAM, 40GB SSD, 2TB transfer
- $20/mese: 2 vCPU, 4GB RAM, 60GB SSD, 3TB transfer
- Database MySQL: $15/mese (1GB RAM)

**Vantaggi:**
- ✅ Prezzo fisso (no sorprese)
- ✅ Più semplice da gestire
- ✅ Include backup automatici
- ✅ Buono per startup

**Svantaggi:**
- ❌ Meno scalabile
- ❌ Meno features avanzate

**Totale Lightsail: ~$25-35/mese** (per iniziare)

### 2. Elastic Beanstalk (Middle Ground)

**Vantaggi:**
- ✅ Gestione automatica
- ✅ Auto-scaling
- ✅ Prezzo simile a EC2

**Totale: ~$50-80/mese**

---

## Raccomandazione Finale

### Per Iniziare (Primi 6-12 mesi):

**Opzione 1: AWS Lightsail** (Più Economico)
- Lightsail $20/mese (app)
- Lightsail Database $15/mese
- Route 53 $0.50/mese
- CloudFront + S3 $5/mese

**TOTALE: ~$40/mese**

**Opzione 2: AWS EC2 Setup** (Più Flessibile)
- EC2 t3.small $15/mese
- RDS db.t3.micro $15/mese
- ALB $16/mese
- Route 53 $0.50/mese
- CloudFront + S3 $5/mese

**TOTALE: ~$51/mese**

### Per Scalare (12+ mesi):

Passare a ECS Fargate + RDS più grande quando necessario.

---

## Configurazione Subdomain

### Con Stesso Progetto Laravel

**Route 53:**
- `www.zelante.it` → CloudFront (S3 o ALB)
- `app.zelante.it` → ALB → ECS/EC2

**Laravel:**
```php
// routes/web.php
Route::domain('www.zelante.it')->group(function () {
    // Route vetrina
});

Route::domain('app.zelante.it')->middleware(['auth'])->group(function () {
    // Route applicazione
});
```

**Nginx/ALB:**
- Routing basato su Host header
- Stesso container, routing diverso

---

## Costi Aggiuntivi da Considerare

1. **Backup RDS**: ~$5-10/mese (snapshot automatici)
2. **Monitoring (CloudWatch)**: ~$5-10/mese
3. **SSL Certificate**: Gratis (AWS Certificate Manager)
4. **Data Transfer**: Primi 100GB/mese gratis, poi $0.09/GB
5. **Storage S3**: $0.023/GB/mese

---

## Conclusione

**Costo Iniziale Realistico: $40-60/mese** (Lightsail o EC2 base)

**Costo Produzione Media: $150-250/mese** (ECS Fargate + RDS)

**Costo Produzione Alta: $400-600/mese** (Multi-istanza + RDS grande)

**Raccomandazione**: Iniziare con Lightsail o EC2, scalare quando necessario.
