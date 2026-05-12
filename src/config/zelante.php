<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Modulo Prodotti — cache catalogo (Redis)
    |--------------------------------------------------------------------------
    |
    | PRODUCTS_CACHE_STORE: nome store in config/cache.php (es. products, redis).
    | In test si usa tipicamente "array" (vedi phpunit.xml).
    |
    */
    'products' => [
        'cache_store' => env('PRODUCTS_CACHE_STORE', 'products'),
        'list_ttl_seconds' => (int) env('PRODUCTS_LIST_CACHE_TTL', 3600),
        'show_ttl_seconds' => (int) env('PRODUCTS_SHOW_CACHE_TTL', 600),
    ],

    /*
    |--------------------------------------------------------------------------
    | Destinatario email per alert cancellazione (soft delete)
    |--------------------------------------------------------------------------
    |
    | Se valorizzato, l'email di conferma cancellazione viene inviata a questo
    | indirizzo (es. mailbox di gruppo). In alternativa viene usata l'email
    | dell'utente autenticato che ha eseguito l'operazione.
    |
    */
    'deletion_alert_mail_to' => env('MAIL_DELETION_ALERT_TO'),

];
