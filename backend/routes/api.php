<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BidController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InvitationToBidController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectScopeController;
use App\Http\Controllers\SubcontractorController;
use App\Http\Controllers\TradeController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('activities', [ActivityLogController::class, 'index']);

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

    // Contracts (list for invoice creation)
    Route::get('contracts', function (\Illuminate\Http\Request $request) {
        $companyId = $request->user()->company_id;
        $contracts = \App\Models\Contract::whereHas('project', fn($q) => $q->where('company_id', $companyId))
            ->with(['project', 'company', 'trade'])
            ->where('status', 'active')
            ->get();

        $contractIds = $contracts->pluck('id');
        $invoicedAmounts = \App\Models\Invoice::whereIn('contract_id', $contractIds)
            ->whereNotIn('status', ['rejected'])
            ->groupBy('contract_id')
            ->selectRaw('contract_id, SUM(amount) as total')
            ->pluck('total', 'contract_id');

        return response()->json([
            'data' => $contracts->map(fn($c) => [
                'id' => $c->id,
                'project' => $c->project ? ['id' => $c->project->id, 'name' => $c->project->name] : null,
                'company' => $c->company ? ['id' => $c->company->id, 'name' => $c->company->name] : null,
                'trade' => $c->trade ? ['id' => $c->trade->id, 'name' => $c->trade->name] : null,
                'amount' => (float) $c->amount,
                'already_invoiced' => (float) ($invoicedAmounts[$c->id] ?? 0),
                'status' => $c->status,
            ]),
        ]);
    });

    // Messages
    Route::get('messages/unread-count', [MessageController::class, 'unreadCount']);
    Route::get('messages/contacts', [MessageController::class, 'contacts']);
    Route::get('messages/users', [MessageController::class, 'searchUsers']);
    Route::get('messages/sent', [MessageController::class, 'sent']);
    Route::get('messages/thread/{user}', [MessageController::class, 'thread']);
    Route::get('messages', [MessageController::class, 'inbox']);
    Route::post('messages', [MessageController::class, 'store']);
    Route::put('messages/{message}/read', [MessageController::class, 'markRead']);

    // Invoices
    Route::get('invoices/summary', [InvoiceController::class, 'summary']);
    Route::get('invoices', [InvoiceController::class, 'index']);
    Route::get('invoices/{invoice}', [InvoiceController::class, 'show']);
    Route::post('invoices', [InvoiceController::class, 'store']);
    Route::put('invoices/{invoice}/review', [InvoiceController::class, 'review']);
    Route::put('invoices/{invoice}/pay', [InvoiceController::class, 'pay']);
});
