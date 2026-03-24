<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectScopeController;
use App\Http\Controllers\TradeController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::apiResource('projects', ProjectController::class);
    Route::apiResource('projects.scopes', ProjectScopeController::class)->only(['store', 'update', 'destroy']);
    Route::get('trades', [TradeController::class, 'index']);
});
