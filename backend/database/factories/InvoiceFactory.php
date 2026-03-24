<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Contract;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvoiceFactory extends Factory
{
    private static int $counter = 1;

    public function definition(): array
    {
        $status = $this->faker->randomElement(['draft', 'submitted', 'under_review', 'approved', 'paid', 'rejected']);
        $submittedAt = in_array($status, ['submitted', 'under_review', 'approved', 'paid', 'rejected'])
            ? $this->faker->dateTimeBetween('-3 months', 'now')
            : null;
        $approvedAt = in_array($status, ['approved', 'paid'])
            ? $this->faker->dateTimeBetween($submittedAt ?? '-2 months', 'now')
            : null;
        $paidAt = $status === 'paid'
            ? $this->faker->dateTimeBetween($approvedAt ?? '-1 month', 'now')
            : null;

        $year = date('Y');
        $number = 'INV-' . $year . '-' . str_pad(self::$counter++, 4, '0', STR_PAD_LEFT);

        return [
            'contract_id' => Contract::factory(),
            'company_id' => Company::factory()->subcontractor(),
            'project_id' => Project::factory(),
            'invoice_number' => $number,
            'amount' => $this->faker->numberBetween(10000, 500000),
            'description' => $this->faker->sentence(),
            'status' => $status,
            'due_date' => $this->faker->dateTimeBetween('now', '+30 days')->format('Y-m-d'),
            'submitted_at' => $submittedAt,
            'approved_at' => $approvedAt,
            'paid_at' => $paidAt,
            'notes' => $this->faker->optional()->sentence(),
        ];
    }
}
