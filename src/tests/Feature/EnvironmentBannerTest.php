<?php

it('renders environment banner with current app environment label', function () {
    $response = $this->get('/');

    $response->assertSuccessful()
        ->assertSee('data-environment-banner', false)
        ->assertSee(strtoupper(config('app.env')), false);
});

it('shows develop styling when app env is develop', function () {
    config(['app.env' => 'develop']);

    $response = $this->get('/');

    $response->assertSuccessful()
        ->assertSee(__('ui.environment_banner', ['env' => 'DEVELOP']), false);
});
