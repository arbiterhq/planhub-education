<?php

namespace App\Http\Controllers;

use App\Http\Resources\InvoiceResource;
use App\Models\Contract;
use App\Models\Invoice;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function summary(Request $request)
    {
        $companyId = $request->user()->company_id;

        $totalOutstanding = Invoice::whereHas('project', fn($q) => $q->where('company_id', $companyId))
            ->whereIn('status', ['submitted', 'under_review', 'approved'])
            ->sum('amount');

        $pendingReview = Invoice::whereHas('project', fn($q) => $q->where('company_id', $companyId))
            ->whereIn('status', ['submitted', 'under_review'])
            ->count();

        $approvedUnpaid = Invoice::whereHas('project', fn($q) => $q->where('company_id', $companyId))
            ->where('status', 'approved')
            ->count();

        $paidThisMonth = Invoice::whereHas('project', fn($q) => $q->where('company_id', $companyId))
            ->where('status', 'paid')
            ->whereMonth('paid_at', now()->month)
            ->whereYear('paid_at', now()->year)
            ->sum('amount');

        $paidAllTime = Invoice::whereHas('project', fn($q) => $q->where('company_id', $companyId))
            ->where('status', 'paid')
            ->sum('amount');

        $totalInvoiced = Invoice::whereHas('project', fn($q) => $q->where('company_id', $companyId))
            ->whereNotIn('status', ['rejected'])
            ->sum('amount');

        $byStatus = Invoice::whereHas('project', fn($q) => $q->where('company_id', $companyId))
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $statuses = ['draft', 'submitted', 'under_review', 'approved', 'paid', 'rejected'];
        $byStatusFormatted = [];
        foreach ($statuses as $status) {
            $byStatusFormatted[$status] = (int) ($byStatus[$status] ?? 0);
        }

        return response()->json([
            'total_outstanding' => (float) $totalOutstanding,
            'pending_review' => $pendingReview,
            'approved_unpaid' => $approvedUnpaid,
            'paid_this_month' => (float) $paidThisMonth,
            'paid_all_time' => (float) $paidAllTime,
            'total_invoiced' => (float) $totalInvoiced,
            'by_status' => $byStatusFormatted,
        ]);
    }

    public function index(Request $request)
    {
        $companyId = $request->user()->company_id;

        $query = Invoice::whereHas('project', fn($q) => $q->where('company_id', $companyId))
            ->with(['company', 'project', 'contract.trade']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        if ($request->filled('company_id')) {
            $query->where('company_id', $request->company_id);
        }

        if ($request->filled('date_from')) {
            $query->where('submitted_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('submitted_at', '<=', $request->date_to);
        }

        $sortField = $request->input('sort', 'created_at');
        $direction = $request->input('direction', 'desc');
        $query->orderBy($sortField, $direction);

        $invoices = $query->paginate(15);

        return InvoiceResource::collection($invoices);
    }

    public function show(Request $request, Invoice $invoice)
    {
        $companyId = $request->user()->company_id;

        abort_unless($invoice->project->company_id === $companyId, 403);

        $invoice->load(['company', 'project', 'contract.trade', 'contract.bid']);

        $totalInvoiced = Invoice::where('contract_id', $invoice->contract_id)
            ->whereNotIn('status', ['rejected'])
            ->sum('amount');

        return response()->json([
            'data' => new InvoiceResource($invoice),
            'total_invoiced_for_contract' => (float) $totalInvoiced,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'contract_id' => 'required|exists:contracts,id',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'required|string',
            'due_date' => 'required|date|after:today',
        ]);

        $contract = Contract::with(['project', 'company'])->findOrFail($validated['contract_id']);

        $companyId = $request->user()->company_id;

        abort_unless($contract->project->company_id === $companyId, 403);

        $alreadyInvoiced = Invoice::where('contract_id', $contract->id)
            ->whereNotIn('status', ['rejected'])
            ->sum('amount');

        abort_if(
            ($alreadyInvoiced + $validated['amount']) > $contract->amount,
            422,
            'Invoice amount exceeds the remaining contract balance.'
        );

        $year = now()->year;
        $maxInvoice = Invoice::whereYear('created_at', $year)->orderByDesc('id')->first();

        if ($maxInvoice && preg_match('/INV-\d{4}-(\d+)/', $maxInvoice->invoice_number, $m)) {
            $seq = (int) $m[1] + 1;
        } else {
            $seq = 1;
        }

        $invoiceNumber = 'INV-' . $year . '-' . str_pad($seq, 4, '0', STR_PAD_LEFT);

        $invoice = Invoice::create([
            'contract_id' => $contract->id,
            'company_id' => $contract->company_id,
            'project_id' => $contract->project_id,
            'invoice_number' => $invoiceNumber,
            'amount' => $validated['amount'],
            'description' => $validated['description'],
            'due_date' => $validated['due_date'],
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $invoice->load(['company', 'project', 'contract.trade']);

        return (new InvoiceResource($invoice))->response()->setStatusCode(201);
    }

    public function review(Request $request, Invoice $invoice)
    {
        $companyId = $request->user()->company_id;

        abort_unless($invoice->project->company_id === $companyId, 403);

        abort_unless(
            in_array($invoice->status, ['submitted', 'under_review']),
            422,
            'Invoice is not in a reviewable status.'
        );

        $validated = $request->validate([
            'action' => 'required|in:approve,reject',
            'notes' => 'nullable|string',
        ]);

        if ($validated['action'] === 'approve') {
            $invoice->update([
                'status' => 'approved',
                'approved_at' => now(),
                'notes' => $validated['notes'] ?? $invoice->notes,
            ]);
        } else {
            $invoice->update([
                'status' => 'rejected',
                'notes' => $validated['notes'] ?? $invoice->notes,
            ]);
        }

        $invoice->load(['company', 'project', 'contract.trade']);

        return new InvoiceResource($invoice);
    }

    public function pay(Request $request, Invoice $invoice)
    {
        $companyId = $request->user()->company_id;

        abort_unless($invoice->project->company_id === $companyId, 403);

        abort_unless(
            $invoice->status === 'approved',
            422,
            'Invoice must be approved before it can be paid.'
        );

        $invoice->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        $invoice->load(['company', 'project', 'contract.trade']);

        return new InvoiceResource($invoice);
    }
}
