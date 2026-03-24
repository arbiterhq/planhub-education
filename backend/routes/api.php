<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BidController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InvitationToBidController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectScopeController;
use App\Http\Controllers\SubcontractorController;
use App\Http\Controllers\TradeController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::apiResource('projects', ProjectController::class);
    Route::apiResource('projects.scopes', ProjectScopeController::class)->only(['store', 'update', 'destroy']);
    Route::get('trades', [TradeController::class, 'index']);
    Route::apiResource('subcontractors', SubcontractorController::class)->except(['destroy']);

    // Invitations to Bid
    Route::get('invitations', [InvitationToBidController::class, 'index']);
    Route::post('invitations/bulk', [InvitationToBidController::class, 'storeBulk']);
    Route::post('invitations', [InvitationToBidController::class, 'store']);
    Route::put('invitations/{invitation}', [InvitationToBidController::class, 'update']);

    // Bids
    Route::get('bids', [BidController::class, 'index']);
    Route::get('bids/{bid}', [BidController::class, 'show']);
    Route::post('bids', [BidController::class, 'store']);
    Route::put('bids/{bid}/review', [BidController::class, 'review']);
});
