<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Throwable $e, \Illuminate\Http\Request $request) {
            if ($request->expectsJson()) {
                $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;
                $message = match ($status) {
                    404 => 'Resource not found',
                    403 => 'Forbidden',
                    422 => 'Validation failed',
                    default => 'Server error',
                };
                $payload = ['message' => $message, 'status' => $status];
                if (method_exists($e, 'errors')) {
                    $payload['errors'] = $e->errors();
                }
                return response()->json($payload, $status);
            }
        });
    })->create();
