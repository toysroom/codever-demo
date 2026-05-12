<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Route groups (@routes('group'))
    |--------------------------------------------------------------------------
    */

    'groups' => [],

    /*
    |--------------------------------------------------------------------------
    | Route filtering
    |--------------------------------------------------------------------------
    |
    | Riduce il bundle JS e non espone in chiaro URI di tool interni.
    | Non sostituisce auth/autorizzazione sulle route Laravel.
    |
    */

    'except' => [
        'debugbar.*',
        'horizon.*',
    ],

];
