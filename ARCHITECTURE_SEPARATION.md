# Architettura Separazione Progetti

## Struttura Finale

### Progetto 1: `zelante-app` (Questo progetto)
**Dominio:** `app.zelante.it`
**Scopo:** Applicazione principale (gestione customers, sub-members, ecc.)

### Progetto 2: `zelante-www` (Nuovo progetto separato)
**Dominio:** `www.zelante.it`
**Scopo:** Sito vetrina + gestione licenze + registrazione OAuth2

**Connessione:**
- ✅ Database condiviso (stessa tabella `users`, `members`, `customers`, `license_plans`)
- ✅ Autenticazione condivisa (vedi sotto)

---

## Condivisione Database

### Approccio: Database Condiviso

**Entrambi i progetti puntano allo stesso database MySQL:**

**Progetto App (`zelante-app/.env`):**
```env
DB_CONNECTION=mysql
DB_HOST=mysql_host  # Stesso host
DB_PORT=3306
DB_DATABASE=zelante  # Stesso database
DB_USERNAME=zelante
DB_PASSWORD=zelante
```

**Progetto WWW (`zelante-www/.env`):**
```env
DB_CONNECTION=mysql
DB_HOST=mysql_host  # Stesso host
DB_PORT=3306
DB_DATABASE=zelante  # Stesso database
DB_USERNAME=zelante
DB_PASSWORD=zelante
```

**Tabelle Condivise:**
- `users` - Autenticazione
- `members` - Dati membri
- `customers` - Dati customers
- `license_plans` - Piani licenza
- `permissions`, `roles`, `model_has_roles` - Spatie Permission
- `activity_log` - Log attività

**Tabelle Separate:**
- App: tabelle dominio-specifiche (es: `cargo_providers`)
- WWW: tabelle sito-specifiche (se necessario)

---

## Autenticazione Condivisa

### Opzione 1: Shared Session (Semplice) ✅ RACCOMANDATO

**Usare Redis o Database per sessioni condivise:**

**Entrambi i progetti configurati così:**
```env
SESSION_DRIVER=redis  # o database
SESSION_DOMAIN=.zelante.it  # Punto iniziale per condividere tra subdomain
```

**Cookie configurato per essere condiviso:**
```php
// config/session.php (entrambi i progetti)
'domain' => env('SESSION_DOMAIN', '.zelante.it'),
'secure' => true,  // HTTPS only
'same_site' => 'lax',
```

**Vantaggi:**
- ✅ Login su www → automaticamente loggato su app (e viceversa)
- ✅ Logout su www → automaticamente logout su app
- ✅ Semplice da implementare

### Opzione 2: JWT Token (Più Complesso)

**Usare Laravel Passport o Sanctum con token:**
- Login su www genera token
- Token usato per autenticarsi su app
- Più complesso ma più flessibile

**Non raccomandato per questo caso** (troppa complessità non necessaria).

---

## Progetto WWW - Requisiti

### Funzionalità Richieste:

1. **Homepage Vetrina**
   - Hero section
   - Features highlights
   - Testimonials
   - CTA per registrazione

2. **Pricing Page**
   - Piano Free
   - 3 Piani a pagamento (con trial)
   - Confronto funzionalità

3. **Features Page**
   - Dettaglio funzionalità
   - Screenshots/demo

4. **Registrazione OAuth2**
   - Google OAuth2
   - GitHub OAuth2 (opzionale)
   - Email/Password (fallback)
   - Scelta piano durante registrazione
   - Creazione User + Member nel DB condiviso

5. **Login OAuth2**
   - Google OAuth2
   - GitHub OAuth2
   - Email/Password
   - Redirect a `app.zelante.it` dopo login

6. **Area Membri (Dashboard Licenze)**
   - Visualizza piano corrente
   - Upgrade/Downgrade piano
   - Gestione trial
   - Storico pagamenti
   - Gestione Sub-Members
   - Gestione Customers
   - Redirect a `app.zelante.it` per gestione operativa

7. **Gestione Licenze**
   - Cambio piano
   - Attivazione pagamento
   - Gestione trial
   - Cancellazione subscription

---

## Stack Tecnologico WWW

### Opzione 1: Laravel (Raccomandato per Inizio)

**Vantaggi:**
- ✅ Condivide stesso stack tecnologico
- ✅ Accesso diretto al database condiviso
- ✅ OAuth2 già integrato (Laravel Socialite)
- ✅ Facile migrazione a WordPress in futuro (esportare dati)

**Stack:**
- Laravel
- Laravel Socialite (OAuth2)
- Blade o Inertia (più semplice Blade per vetrina)
- Stesso database MySQL

### Opzione 2: WordPress (Futuro)

**Quando passare a WordPress:**
- Usare WordPress REST API per accedere a dati
- O creare plugin WordPress che accede direttamente al DB
- O usare WordPress come frontend, Laravel come backend API

**Per ora: Laravel è più semplice.**

---

## Struttura Progetti

### Progetto App (Questo)

```
zelante-app/
  src/
    app/
      Http/Controllers/
        App/           # Solo route applicazione
      Models/
        User.php       # Condiviso con WWW
        Member.php     # Condiviso con WWW
        Customer.php   # Condiviso con WWW
        LicensePlan.php # Condiviso con WWW
        CargoProvider.php  # Solo app
    routes/
      web.php          # Solo route app.zelante.it
```

### Progetto WWW (Nuovo)

```
zelante-www/
  app/
    Http/Controllers/
      Web/            # Controllers vetrina
        HomeController.php
        PricingController.php
        FeaturesController.php
      Auth/
        OAuthController.php  # OAuth2 login
        RegisterController.php
      Members/
        LicenseController.php  # Gestione licenze
    Models/
      User.php        # Stesso modello, stesso DB
      Member.php      # Stesso modello, stesso DB
      LicensePlan.php # Stesso modello, stesso DB
  routes/
    web.php           # Solo route www.zelante.it
```

---

## OAuth2 con Laravel Socialite

### Configurazione

**Installazione:**
```bash
composer require laravel/socialite
```

**Config (`config/services.php`):**
```php
'google' => [
    'client_id' => env('GOOGLE_CLIENT_ID'),
    'client_secret' => env('GOOGLE_CLIENT_SECRET'),
    'redirect' => env('GOOGLE_REDIRECT_URI', 'https://www.zelante.it/auth/google/callback'),
],

'github' => [
    'client_id' => env('GITHUB_CLIENT_ID'),
    'client_secret' => env('GITHUB_CLIENT_SECRET'),
    'redirect' => env('GITHUB_REDIRECT_URI', 'https://www.zelante.it/auth/github/callback'),
],
```

**Controller:**
```php
// app/Http/Controllers/Auth/OAuthController.php
public function redirectToGoogle()
{
    return Socialite::driver('google')->redirect();
}

public function handleGoogleCallback()
{
    $googleUser = Socialite::driver('google')->user();
    
    // Cerca o crea user
    $user = User::firstOrCreate(
        ['email' => $googleUser->email],
        [
            'name' => $googleUser->name,
            'user_type' => 'member',
            'email_verified_at' => now(),
        ]
    );
    
    // Crea Member se non esiste
    if (!$user->member) {
        Member::create([
            'user_id' => $user->id,
            'license_plan_id' => $this->getDefaultPlanId(),
            'is_owner' => true,
            // ...
        ]);
    }
    
    Auth::login($user);
    
    return redirect()->route('members.dashboard');
}
```

---

## Flusso Registrazione con OAuth2

1. **Utente clicca "Registrati con Google"**
2. **Redirect a Google OAuth**
3. **Callback con dati Google**
4. **Crea User se non esiste** (email come identificatore unico)
5. **Chiede scelta piano** (se nuovo utente)
6. **Crea Member con piano scelto**
7. **Se piano a pagamento → attiva trial**
8. **Redirect a dashboard licenze** (www) o app (app)

---

## Gestione Licenze su WWW

### Dashboard Licenze

**Route:** `www.zelante.it/members/license`

**Funzionalità:**
- Visualizza piano corrente
- Data scadenza trial
- Bottoni Upgrade/Downgrade
- Storico pagamenti
- Gestione Sub-Members (lista, crea)
- Gestione Customers (lista, crea)
- Link a `app.zelante.it` per uso applicazione

**Controller:**
```php
// app/Http/Controllers/Members/LicenseController.php
class LicenseController extends Controller
{
    public function index()
    {
        $member = auth()->user()->member;
        $plans = LicensePlan::where('is_active', true)->orderBy('sort_order')->get();
        
        return view('members.license', compact('member', 'plans'));
    }
    
    public function upgrade(Request $request)
    {
        // Logica upgrade piano
        // Integrazione Stripe/PayPal
        // Aggiorna Member
    }
}
```

---

## Deploy Separati

### AWS Setup

**Progetto App:**
- `app.zelante.it` → ALB → ECS Fargate (questo progetto)

**Progetto WWW:**
- `www.zelante.it` → ALB → ECS Fargate (nuovo progetto) o Lightsail

**Database:**
- RDS MySQL condiviso
- Entrambi i progetti puntano allo stesso RDS

**Redis (Session):**
- ElastiCache Redis condiviso (per sessioni condivise)

---

## Docker Locale - Due Progetti

### Opzione 1: Docker Compose Separati

**Progetto App:**
```yaml
# zelante-app/docker-compose.yml
services:
  app:
    # ...
  mysql:
    # Usa network esterno condiviso
  redis:
    # Usa network esterno condiviso
```

**Progetto WWW:**
```yaml
# zelante-www/docker-compose.yml
services:
  www:
    # ...
  mysql:
    # Usa stesso MySQL del progetto app (network esterno)
  redis:
    # Usa stesso Redis del progetto app
```

**Network condiviso:**
```bash
docker network create zelante-shared
```

### Opzione 2: Docker Compose Unico (Sviluppo)

Un solo docker-compose.yml che gestisce entrambi i progetti:

```yaml
services:
  mysql:
    # Database condiviso
  
  redis:
    # Redis condiviso
  
  app:
    # Progetto app
    volumes:
      - ./zelante-app/src:/var/www/html/app
  
  www:
    # Progetto www
    volumes:
      - ./zelante-www:/var/www/html/www
```

---

## Checklist Implementazione WWW

### Setup Base
- [ ] Creare nuovo progetto Laravel (`zelante-www`)
- [ ] Configurare .env con stesso database
- [ ] Configurare session domain condiviso
- [ ] Installare Laravel Socialite

### Funzionalità Vetrina
- [ ] Homepage
- [ ] Pricing page
- [ ] Features page

### OAuth2
- [ ] Google OAuth2 setup
- [ ] GitHub OAuth2 setup (opzionale)
- [ ] Controller OAuth
- [ ] Flusso registrazione con scelta piano

### Gestione Licenze
- [ ] Dashboard licenze
- [ ] Visualizzazione piano corrente
- [ ] Upgrade/Downgrade
- [ ] Integrazione pagamenti (Stripe)
- [ ] Gestione trial
- [ ] Storico pagamenti

### Integrazione
- [ ] Redirect a app.zelante.it dopo login
- [ ] Link tra www e app
- [ ] Session sharing test

---

## Conclusione

**Due progetti separati:**
- ✅ `zelante-app` - Applicazione (questo progetto)
- ✅ `zelante-www` - Sito vetrina + licenze (nuovo progetto)

**Condivisione:**
- ✅ Database MySQL condiviso
- ✅ Session Redis condiviso (per autenticazione)
- ✅ Tabelle users, members, customers, license_plans condivise

**Progetto WWW Stack:**
- Laravel (per ora, WordPress in futuro)
- Laravel Socialite (OAuth2)
- Stesso database
