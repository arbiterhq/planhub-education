<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\Bid;
use App\Models\Company;
use App\Models\Contract;
use App\Models\InvitationToBid;
use App\Models\Invoice;
use App\Models\Message;
use App\Models\Project;
use App\Models\ProjectScope;
use App\Models\Trade;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ─── 1. TRADES ───────────────────────────────────────────────────────────
        $trades = [];
        $tradeData = [
            ['name' => 'Electrical',            'category' => 'MEP'],
            ['name' => 'Plumbing',              'category' => 'MEP'],
            ['name' => 'HVAC',                  'category' => 'MEP'],
            ['name' => 'Fire Protection',        'category' => 'MEP'],
            ['name' => 'Concrete & Masonry',    'category' => 'Structural'],
            ['name' => 'Structural Steel',      'category' => 'Structural'],
            ['name' => 'Framing & Carpentry',   'category' => 'Structural'],
            ['name' => 'Roofing',               'category' => 'Exterior'],
            ['name' => 'Glazing & Windows',     'category' => 'Exterior'],
            ['name' => 'Painting',              'category' => 'Finishing'],
            ['name' => 'Drywall & Insulation',  'category' => 'Finishing'],
            ['name' => 'Flooring',              'category' => 'Finishing'],
            ['name' => 'Landscaping',           'category' => 'Site Work'],
            ['name' => 'Demolition',            'category' => 'Site Work'],
            ['name' => 'Excavation & Grading',  'category' => 'Site Work'],
            ['name' => 'Elevator Installation', 'category' => 'Specialty'],
        ];

        foreach ($tradeData as $td) {
            $trades[$td['name']] = Trade::create($td);
        }

        // ─── 2. GC COMPANY ───────────────────────────────────────────────────────
        $apex = Company::create([
            'name'             => 'Apex Construction Group',
            'type'             => 'general_contractor',
            'description'      => 'Full-service general contractor specializing in commercial, institutional, and mixed-use projects across Central Texas. Over two decades of experience delivering projects from $1M to $50M.',
            'address'          => '4200 Congress Ave, Suite 300',
            'city'             => 'Austin',
            'state'            => 'TX',
            'zip'              => '78745',
            'phone'            => '(512) 555-0100',
            'email'            => 'info@apexconstruction.com',
            'website'          => 'https://www.apexconstruction.com',
            'license_number'   => 'TX-GC-2003-04821',
            'established_year' => 2003,
            'employee_count'   => 148,
        ]);

        // ─── 3. GC USERS ─────────────────────────────────────────────────────────
        $marcus = User::create([
            'name'       => 'Marcus Chen',
            'email'      => 'admin@apexconstruction.com',
            'password'   => Hash::make('password'),
            'company_id' => $apex->id,
            'role'       => 'gc_admin',
            'job_title'  => 'President & CEO',
            'phone'      => '(512) 555-0101',
        ]);

        $sarah = User::create([
            'name'       => 'Sarah Mitchell',
            'email'      => 'sarah.mitchell@apexconstruction.com',
            'password'   => Hash::make('password'),
            'company_id' => $apex->id,
            'role'       => 'gc_member',
            'job_title'  => 'Senior Project Manager',
            'phone'      => '(512) 555-0102',
        ]);

        $david = User::create([
            'name'       => 'David Okafor',
            'email'      => 'david.okafor@apexconstruction.com',
            'password'   => Hash::make('password'),
            'company_id' => $apex->id,
            'role'       => 'gc_member',
            'job_title'  => 'Project Manager',
            'phone'      => '(512) 555-0103',
        ]);

        // ─── 4. SUBCONTRACTOR COMPANIES & USERS ─────────────────────────────────
        $subData = [
            [
                'name' => 'Lone Star Electrical Services',
                'trades' => ['Electrical'],
                'city' => 'Austin', 'state' => 'TX', 'employees' => 65, 'est' => 1998,
                'slug' => 'lonestarelectrical',
                'phone' => '(512) 555-0201',
                'email' => 'info@lonestarelectrical.com',
                'license' => 'TX-EC-1998-11234',
                'description' => 'Full-service electrical contractor serving Central Texas commercial and industrial markets since 1998. Specializing in large-scale commercial wiring, data centers, and industrial power systems.',
            ],
            [
                'name' => 'Summit Plumbing Solutions',
                'trades' => ['Plumbing'],
                'city' => 'Round Rock', 'state' => 'TX', 'employees' => 42, 'est' => 2005,
                'slug' => 'summitplumbing',
                'phone' => '(512) 555-0202',
                'email' => 'info@summitplumbing.com',
                'license' => 'TX-PL-2005-22345',
                'description' => 'Commercial and institutional plumbing contractor based in Round Rock. Expert in healthcare facility plumbing, high-rise installations, and complex mechanical systems.',
            ],
            [
                'name' => 'BlueLine HVAC Systems',
                'trades' => ['HVAC'],
                'city' => 'Cedar Park', 'state' => 'TX', 'employees' => 55, 'est' => 2001,
                'slug' => 'bluelinehvac',
                'phone' => '(512) 555-0203',
                'email' => 'info@bluelinehvac.com',
                'license' => 'TX-AC-2001-33456',
                'description' => 'Mechanical contractor specializing in commercial HVAC design-build, energy-efficient systems, and building automation. Serving Austin metro since 2001.',
            ],
            [
                'name' => 'Guardian Fire Protection',
                'trades' => ['Fire Protection'],
                'city' => 'San Marcos', 'state' => 'TX', 'employees' => 30, 'est' => 2010,
                'slug' => 'guardianfire',
                'phone' => '(512) 555-0204',
                'email' => 'info@guardianfire.com',
                'license' => 'TX-FP-2010-44567',
                'description' => 'Licensed fire suppression and alarm contractor. Specialists in wet/dry pipe systems, clean agent suppression, and commercial fire alarm integration.',
            ],
            [
                'name' => 'Ironclad Concrete & Masonry',
                'trades' => ['Concrete & Masonry'],
                'city' => 'Georgetown', 'state' => 'TX', 'employees' => 78, 'est' => 1995,
                'slug' => 'ironcladconcrete',
                'phone' => '(512) 555-0205',
                'email' => 'info@ironcladconcrete.com',
                'license' => 'TX-GC-1995-55678',
                'description' => 'Foundation, flatwork, tilt-wall, and masonry specialist with over 25 years serving Central Texas. Known for precision work on large commercial pads and complex structural pours.',
            ],
            [
                'name' => 'Texas Steel Erectors',
                'trades' => ['Structural Steel'],
                'city' => 'Pflugerville', 'state' => 'TX', 'employees' => 45, 'est' => 2002,
                'slug' => 'texassteel',
                'phone' => '(512) 555-0206',
                'email' => 'info@texassteel.com',
                'license' => 'TX-SE-2002-66789',
                'description' => 'Structural steel fabrication and erection for commercial and industrial projects. AISC certified with in-house detailing and project management capabilities.',
            ],
            [
                'name' => 'Heritage Framing Co.',
                'trades' => ['Framing & Carpentry'],
                'city' => 'Buda', 'state' => 'TX', 'employees' => 60, 'est' => 1999,
                'slug' => 'heritageframing',
                'phone' => '(512) 555-0207',
                'email' => 'info@heritageframing.com',
                'license' => 'TX-GC-1999-77890',
                'description' => 'Rough carpentry and structural framing contractor for multi-family, hotel, and mixed-use construction. Experienced in wood and light gauge steel framing systems.',
            ],
            [
                'name' => 'Peak Roofing Systems',
                'trades' => ['Roofing'],
                'city' => 'Leander', 'state' => 'TX', 'employees' => 38, 'est' => 2008,
                'slug' => 'peakroofing',
                'phone' => '(512) 555-0208',
                'email' => 'info@peakroofing.com',
                'license' => 'TX-RC-2008-88901',
                'description' => 'Commercial roofing contractor specializing in TPO, EPDM, modified bitumen, and metal panel systems. Energy Star certified and trained in cool roof applications.',
            ],
            [
                'name' => 'ClearView Glass & Glazing',
                'trades' => ['Glazing & Windows'],
                'city' => 'Austin', 'state' => 'TX', 'employees' => 25, 'est' => 2012,
                'slug' => 'clearviewglass',
                'phone' => '(512) 555-0209',
                'email' => 'info@clearviewglass.com',
                'license' => 'TX-GZ-2012-99012',
                'description' => 'Architectural glazing and window wall contractor. Specialists in curtain wall systems, storefront glazing, and high-performance glass installations for commercial projects.',
            ],
            [
                'name' => 'ProFinish Painting',
                'trades' => ['Painting'],
                'city' => 'Kyle', 'state' => 'TX', 'employees' => 35, 'est' => 2006,
                'slug' => 'profinishpainting',
                'phone' => '(512) 555-0210',
                'email' => 'info@profinishpainting.com',
                'license' => 'TX-PC-2006-10123',
                'description' => 'Commercial painting and coatings contractor for interiors and exteriors. Proficient in epoxy floor coatings, industrial coatings, and specialty finishes for healthcare and education facilities.',
            ],
            [
                'name' => 'DryTech Interiors',
                'trades' => ['Drywall & Insulation'],
                'city' => 'Austin', 'state' => 'TX', 'employees' => 50, 'est' => 2003,
                'slug' => 'drytechinteriors',
                'phone' => '(512) 555-0211',
                'email' => 'info@drytechinteriors.com',
                'license' => 'TX-GC-2003-11234',
                'description' => 'Interior drywall, metal stud framing, and insulation subcontractor. Specializes in complex ceilings, acoustical systems, and spray foam applications for commercial projects.',
            ],
            [
                'name' => 'Premier Flooring Solutions',
                'trades' => ['Flooring'],
                'city' => 'Lakeway', 'state' => 'TX', 'employees' => 28, 'est' => 2011,
                'slug' => 'premierflooring',
                'phone' => '(512) 555-0212',
                'email' => 'info@premierflooring.com',
                'license' => 'TX-FC-2011-22345',
                'description' => 'Commercial flooring installation contractor. Full-service capabilities including polished concrete, luxury vinyl tile, carpet tile, hardwood, and epoxy terrazzo.',
            ],
            [
                'name' => 'GreenScape Landscaping',
                'trades' => ['Landscaping'],
                'city' => 'Dripping Springs', 'state' => 'TX', 'employees' => 40, 'est' => 2007,
                'slug' => 'greenscapelandscaping',
                'phone' => '(512) 555-0213',
                'email' => 'info@greenscapelandscaping.com',
                'license' => 'TX-LA-2007-33456',
                'description' => 'Commercial landscaping and irrigation contractor serving the Greater Austin area. Specializing in drought-resistant native plantings, hardscape design, and automated irrigation systems.',
            ],
            [
                'name' => 'Demo Force LLC',
                'trades' => ['Demolition'],
                'city' => 'Hutto', 'state' => 'TX', 'employees' => 22, 'est' => 2014,
                'slug' => 'demoforce',
                'phone' => '(512) 555-0214',
                'email' => 'info@demoforce.com',
                'license' => 'TX-DM-2014-44567',
                'description' => 'Selective and full-building demolition contractor. Certified in hazardous material abatement, concrete sawing and breaking, and interior gut-outs for renovation projects.',
            ],
            [
                'name' => 'SitePrep Excavation',
                'trades' => ['Excavation & Grading'],
                'city' => 'Manor', 'state' => 'TX', 'employees' => 35, 'est' => 2004,
                'slug' => 'siteprepexcavation',
                'phone' => '(512) 555-0215',
                'email' => 'info@siteprepexcavation.com',
                'license' => 'TX-EX-2004-55678',
                'description' => 'Site preparation, earthwork, and utilities contractor for commercial construction. Provides mass grading, utility trenching, storm drainage, and erosion control services.',
            ],
            [
                'name' => 'Apex Elevators Inc.',
                'trades' => ['Elevator Installation'],
                'city' => 'Austin', 'state' => 'TX', 'employees' => 18, 'est' => 2009,
                'slug' => 'apexelevators',
                'phone' => '(512) 555-0216',
                'email' => 'info@apexelevators.com',
                'license' => 'TX-EL-2009-66789',
                'description' => 'Certified elevator installation and maintenance contractor. Factory-trained technicians for hydraulic, traction, and machine-room-less elevator systems. NAESA International certified.',
            ],
            [
                'name' => 'Riverside Mechanical',
                'trades' => ['Plumbing', 'HVAC'],
                'city' => 'Austin', 'state' => 'TX', 'employees' => 72, 'est' => 1997,
                'slug' => 'riversidemechanical',
                'phone' => '(512) 555-0217',
                'email' => 'info@riversidemechanical.com',
                'license' => 'TX-MC-1997-77890',
                'description' => 'Full-service mechanical contractor providing plumbing and HVAC services for commercial and industrial projects. Integrated MEP coordination and BIM capabilities.',
            ],
            [
                'name' => 'AllTrade Builders',
                'trades' => ['Framing & Carpentry', 'Drywall & Insulation'],
                'city' => 'Round Rock', 'state' => 'TX', 'employees' => 85, 'est' => 2000,
                'slug' => 'alltradebuilders',
                'phone' => '(512) 555-0218',
                'email' => 'info@alltradebuilders.com',
                'license' => 'TX-GC-2000-88901',
                'description' => 'Multi-trade contractor specializing in structural framing and interior systems. Self-performing carpentry, metal stud framing, drywall, and insulation on large commercial projects.',
            ],
        ];

        $subs = [];
        $subUsers = [];
        foreach ($subData as $sd) {
            $company = Company::create([
                'name'             => $sd['name'],
                'type'             => 'subcontractor',
                'description'      => $sd['description'],
                'city'             => $sd['city'],
                'state'            => $sd['state'],
                'phone'            => $sd['phone'],
                'email'            => $sd['email'],
                'license_number'   => $sd['license'],
                'established_year' => $sd['est'],
                'employee_count'   => $sd['employees'],
            ]);

            foreach ($sd['trades'] as $tradeName) {
                $company->trades()->attach($trades[$tradeName]->id);
            }

            $firstName = explode(' ', $sd['name'])[0];
            $user = User::create([
                'name'       => 'Admin ' . $firstName,
                'email'      => 'admin@' . $sd['slug'] . '.com',
                'password'   => Hash::make('password'),
                'company_id' => $company->id,
                'role'       => 'sub_admin',
                'job_title'  => 'Operations Manager',
                'phone'      => $sd['phone'],
            ]);

            $subs[$sd['name']] = $company;
            $subUsers[$sd['name']] = $user;
        }

        // ─── 5. PROJECTS ─────────────────────────────────────────────────────────
        $projects = [];

        $projects['downtown'] = Project::create([
            'company_id'       => $apex->id,
            'name'             => 'Downtown Austin Office Tower',
            'description'      => "A landmark 22-story Class-A office tower located in the heart of downtown Austin's CBD. The project features 385,000 square feet of leasable office space across 20 floors, with two floors of ground-level retail and restaurant space. The building will incorporate a distinctive curtain wall facade with high-performance glazing, rooftop terrace amenities, and LEED Gold certification targets.\n\nApex Construction Group was selected following a competitive design-build procurement process. Construction will utilize a structural steel frame with composite concrete decks. The project includes a 4-level underground parking structure with 450 spaces and direct pedestrian connectivity to the 2nd Street District.",
            'status'           => 'bidding',
            'project_type'     => 'Commercial Office',
            'address'          => '301 Congress Ave',
            'city'             => 'Austin',
            'state'            => 'TX',
            'zip'              => '78701',
            'estimated_budget' => 12000000.00,
            'start_date'       => '2026-06-01',
            'end_date'         => '2028-03-31',
            'bid_due_date'     => '2026-04-15',
        ]);

        $projects['hospital'] = Project::create([
            'company_id'       => $apex->id,
            'name'             => "St. Mary's Hospital Wing Renovation",
            'description'      => "Major renovation of the East Wing at St. Mary's Medical Center, encompassing 48,000 square feet across three floors. The project involves complete gut-renovation of dated patient rooms, nurses' stations, surgical prep areas, and diagnostic imaging suites to bring the facility into compliance with current healthcare design standards.\n\nWork is being performed in phased sequences to maintain full hospital operations throughout construction. Stringent infection control protocols and interim life safety measures are in place. The renovation includes upgraded HVAC with negative pressure rooms, medical gas systems, new nurse call systems, and complete electrical and plumbing upgrades throughout the wing.",
            'status'           => 'in_progress',
            'project_type'     => 'Healthcare',
            'address'          => '900 E 30th St',
            'city'             => 'Austin',
            'state'            => 'TX',
            'zip'              => '78705',
            'estimated_budget' => 8500000.00,
            'start_date'       => '2025-09-15',
            'end_date'         => '2026-12-31',
            'bid_due_date'     => null,
        ]);

        $projects['meridian'] = Project::create([
            'company_id'       => $apex->id,
            'name'             => 'The Meridian Mixed-Use Development',
            'description'      => "A transformative 8.5-acre mixed-use development in East Austin featuring 312 luxury residential units, 42,000 square feet of ground-floor retail and restaurant space, and a 60,000-square-foot boutique office component. The Meridian is designed as a walkable urban village with internal courtyards, public plazas, and direct trail connectivity to Lady Bird Lake.\n\nThe development is structured as three mid-rise buildings ranging from 6 to 14 stories, connected by a shared podium parking structure with 580 spaces. Building exteriors feature a mix of brick, metal panel, and high-performance glass. The project is targeting LEED Silver certification and incorporates rooftop solar, rainwater harvesting, and EV charging infrastructure throughout.",
            'status'           => 'in_progress',
            'project_type'     => 'Mixed-Use Residential',
            'address'          => '1200 E 6th St',
            'city'             => 'Austin',
            'state'            => 'TX',
            'zip'              => '78702',
            'estimated_budget' => 22000000.00,
            'start_date'       => '2025-06-01',
            'end_date'         => '2027-08-31',
            'bid_due_date'     => null,
        ]);

        $projects['westlake'] = Project::create([
            'company_id'       => $apex->id,
            'name'             => 'Westlake Hills Elementary Expansion',
            'description'      => "Addition of a two-story, 28,000-square-foot academic wing to the existing Westlake Hills Elementary campus, adding 18 standard classrooms, 4 STEM labs, an expanded library/media center, and upgraded administration facilities. The project also includes a new 8,000-square-foot gymnasium with bleacher seating for 350.\n\nConstruction must be phased to avoid disruption to the active school campus, with all exterior work completed during summer and winter break windows. The design prioritizes natural daylighting, outdoor learning courtyards, and barrier-free accessibility improvements campus-wide. Site work includes new parent drop-off lanes, additional parking, and stormwater management improvements.",
            'status'           => 'bidding',
            'project_type'     => 'Education',
            'address'          => '4100 Westbank Dr',
            'city'             => 'Westlake Hills',
            'state'            => 'TX',
            'zip'              => '78746',
            'estimated_budget' => 4200000.00,
            'start_date'       => '2026-07-15',
            'end_date'         => '2027-06-30',
            'bid_due_date'     => '2026-04-30',
        ]);

        $projects['cedar'] = Project::create([
            'company_id'       => $apex->id,
            'name'             => 'Cedar Park Municipal Center',
            'description'      => "New construction of a 52,000-square-foot municipal government center to serve as the consolidated headquarters for Cedar Park's City Hall, Municipal Court, and Planning & Development Services departments. The facility is designed to accommodate the city's projected growth over a 30-year horizon.\n\nThe two-story building features a civic plaza and public entrance on its north facade, with dedicated after-hours access for court operations. The project includes 180 surface parking spaces, backup power generation, a council chambers with audio/visual and livestreaming capabilities, and a public records vault. Sustainable features include a reflective roof system, 40kW rooftop solar, and permeable paving in the parking areas.",
            'status'           => 'planning',
            'project_type'     => 'Government',
            'address'          => '600 N Bell Blvd',
            'city'             => 'Cedar Park',
            'state'            => 'TX',
            'zip'              => '78613',
            'estimated_budget' => 6800000.00,
            'start_date'       => '2026-09-01',
            'end_date'         => '2027-12-31',
            'bid_due_date'     => '2026-06-15',
        ]);

        $projects['lakeway'] = Project::create([
            'company_id'       => $apex->id,
            'name'             => 'Lakeway Luxury Condominiums',
            'description'      => "An upscale 88-unit luxury condominium development on a 6-acre lakefront site in Lakeway, featuring lake and Hill Country views from every unit. The project consists of two 8-story towers connected by a shared amenity podium with resort-style pool, fitness center, owners' lounge, and concierge lobby.\n\nUnit mix ranges from 1,200-square-foot one-bedroom residences to 3,800-square-foot penthouse suites. Interior finishes include imported stone countertops, wide-plank hardwood floors, floor-to-ceiling windows, and high-end appliance packages. Each unit includes at least one covered parking space in the climate-controlled underground garage. Exterior materials feature limestone veneer, architectural precast panels, and painted metal accents.",
            'status'           => 'in_progress',
            'project_type'     => 'Residential',
            'address'          => '112 Lakeway Blvd',
            'city'             => 'Lakeway',
            'state'            => 'TX',
            'zip'              => '78734',
            'estimated_budget' => 15000000.00,
            'start_date'       => '2025-11-01',
            'end_date'         => '2027-05-31',
            'bid_due_date'     => null,
        ]);

        $projects['warehouse'] = Project::create([
            'company_id'       => $apex->id,
            'name'             => 'Round Rock Distribution Warehouse',
            'description'      => "A 285,000-square-foot Class-A industrial/distribution facility for a regional logistics tenant in the Round Rock Industrial Park. The tilt-wall concrete building features 36-foot clear height, 56 dock-high doors, 4 grade-level drive-in doors, and a 185-foot truck court with 240 trailer parking stalls.\n\nThe project was designed for e-commerce fulfillment operations with heavy floor loading (8,000 psf), high-density racking infrastructure, a 12,000-square-foot office mezzanine, and extensive LED warehouse lighting with occupancy sensor controls. The site includes 180 automobile parking stalls, a truck entry/exit with guard booth, and a fully secured yard with perimeter fencing.",
            'status'           => 'completed',
            'project_type'     => 'Industrial',
            'address'          => '3800 E Palm Valley Blvd',
            'city'             => 'Round Rock',
            'state'            => 'TX',
            'zip'              => '78665',
            'estimated_budget' => 9300000.00,
            'start_date'       => '2024-08-01',
            'end_date'         => '2025-12-15',
            'bid_due_date'     => null,
        ]);

        $projects['barton'] = Project::create([
            'company_id'       => $apex->id,
            'name'             => 'Barton Creek Resort & Spa Renovation',
            'description'      => "Comprehensive renovation of a 300-key full-service resort and spa property in the Barton Creek watershed area of Austin. The project scope includes complete guest room renovation across all room types, lobby and arrival sequence redesign, a new 18,000-square-foot spa facility, restaurant and bar renovations, and conversion of outdated conference space into a modern event pavilion.\n\nThe renovation is on hold pending resolution of a permit challenge related to impervious cover calculations in the Barton Springs Edwards Aquifer recharge zone. Apex is working with the owner and local counsel to address the environmental review requirements before resuming preconstruction activities. A revised schedule anticipates construction restart in Q2 2026.",
            'status'           => 'on_hold',
            'project_type'     => 'Hospitality',
            'address'          => '8212 Barton Club Dr',
            'city'             => 'Austin',
            'state'            => 'TX',
            'zip'              => '78735',
            'estimated_budget' => 11000000.00,
            'start_date'       => '2026-03-01',
            'end_date'         => '2027-09-30',
            'bid_due_date'     => null,
        ]);

        // ─── 6. PROJECT SCOPES ───────────────────────────────────────────────────
        $scopes = [];

        // Downtown Austin Office Tower (bidding)
        $scopes['downtown_elec']  = ProjectScope::create(['project_id' => $projects['downtown']->id, 'trade_id' => $trades['Electrical']->id,            'description' => 'Complete electrical systems including service entrance, distribution, lighting, and emergency power for 22-story tower.',          'estimated_value' => 1800000.00, 'status' => 'bidding']);
        $scopes['downtown_hvac']  = ProjectScope::create(['project_id' => $projects['downtown']->id, 'trade_id' => $trades['HVAC']->id,                   'description' => 'VAV HVAC system design-build with energy recovery ventilation and building automation integration.',                         'estimated_value' => 1500000.00, 'status' => 'bidding']);
        $scopes['downtown_steel'] = ProjectScope::create(['project_id' => $projects['downtown']->id, 'trade_id' => $trades['Structural Steel']->id,       'description' => 'Structural steel frame fabrication and erection for 22-story tower, including composite metal deck.',                       'estimated_value' => 2200000.00, 'status' => 'bidding']);
        $scopes['downtown_conc']  = ProjectScope::create(['project_id' => $projects['downtown']->id, 'trade_id' => $trades['Concrete & Masonry']->id,     'description' => 'Foundation system, underground parking structure, slab-on-grade, and elevated concrete decks.',                          'estimated_value' => 1600000.00, 'status' => 'bidding']);
        $scopes['downtown_glaze'] = ProjectScope::create(['project_id' => $projects['downtown']->id, 'trade_id' => $trades['Glazing & Windows']->id,      'description' => 'High-performance curtain wall system and storefront glazing for tower exterior.',                                           'estimated_value' =>  950000.00, 'status' => 'bidding']);
        $scopes['downtown_elev']  = ProjectScope::create(['project_id' => $projects['downtown']->id, 'trade_id' => $trades['Elevator Installation']->id,  'description' => 'Installation of 6 passenger elevators, 2 service elevators, and 1 dedicated parking elevator.',                           'estimated_value' =>  800000.00, 'status' => 'bidding']);

        // St. Mary's Hospital Wing (in_progress)
        $scopes['hosp_elec']    = ProjectScope::create(['project_id' => $projects['hospital']->id, 'trade_id' => $trades['Electrical']->id,           'description' => 'Complete electrical renovation including medical-grade power, nurse call, and emergency systems.',   'estimated_value' => 1100000.00, 'status' => 'in_progress']);
        $scopes['hosp_plumb']   = ProjectScope::create(['project_id' => $projects['hospital']->id, 'trade_id' => $trades['Plumbing']->id,             'description' => 'Plumbing renovation including medical gas, patient room plumbing, and sanitary upgrade.',             'estimated_value' =>  850000.00, 'status' => 'in_progress']);
        $scopes['hosp_hvac']    = ProjectScope::create(['project_id' => $projects['hospital']->id, 'trade_id' => $trades['HVAC']->id,                  'description' => 'Healthcare HVAC with negative pressure isolation rooms, air filtration, and building automation.',     'estimated_value' => 1200000.00, 'status' => 'awarded']);
        $scopes['hosp_drywall'] = ProjectScope::create(['project_id' => $projects['hospital']->id, 'trade_id' => $trades['Drywall & Insulation']->id,  'description' => 'Interior drywall, metal stud partitions, and abuse-resistant wall finishes for clinical areas.',       'estimated_value' =>  600000.00, 'status' => 'in_progress']);
        $scopes['hosp_floor']   = ProjectScope::create(['project_id' => $projects['hospital']->id, 'trade_id' => $trades['Flooring']->id,             'description' => 'Healthcare-grade flooring including LVT, sheet vinyl, and epoxy in clinical and utility areas.',       'estimated_value' =>  350000.00, 'status' => 'awarded']);

        // The Meridian (in_progress)
        $scopes['mer_frame']   = ProjectScope::create(['project_id' => $projects['meridian']->id, 'trade_id' => $trades['Framing & Carpentry']->id,  'description' => 'Structural wood and light gauge steel framing for 3 mixed-use buildings.',                                'estimated_value' => 2800000.00, 'status' => 'in_progress']);
        $scopes['mer_elec']    = ProjectScope::create(['project_id' => $projects['meridian']->id, 'trade_id' => $trades['Electrical']->id,           'description' => 'Electrical systems for residential units, common areas, retail spaces, and parking structure.',           'estimated_value' => 2200000.00, 'status' => 'in_progress']);
        $scopes['mer_plumb']   = ProjectScope::create(['project_id' => $projects['meridian']->id, 'trade_id' => $trades['Plumbing']->id,             'description' => 'Plumbing for 312 residential units, commercial kitchen rough-ins, and site utilities.',                   'estimated_value' => 1800000.00, 'status' => 'in_progress']);
        $scopes['mer_conc']    = ProjectScope::create(['project_id' => $projects['meridian']->id, 'trade_id' => $trades['Concrete & Masonry']->id,   'description' => 'Podium parking structure, foundations, elevated slabs, and exterior masonry veneer.',                     'estimated_value' => 3200000.00, 'status' => 'in_progress']);
        $scopes['mer_drywall'] = ProjectScope::create(['project_id' => $projects['meridian']->id, 'trade_id' => $trades['Drywall & Insulation']->id, 'description' => 'Interior drywall, spray foam insulation, and fire-rated shaft assemblies for 3 buildings.',               'estimated_value' => 1400000.00, 'status' => 'awarded']);

        // Westlake Elementary (bidding)
        $scopes['wl_elec']  = ProjectScope::create(['project_id' => $projects['westlake']->id, 'trade_id' => $trades['Electrical']->id,           'description' => 'Electrical systems for new academic wing and gymnasium addition.',                                          'estimated_value' =>  480000.00, 'status' => 'bidding']);
        $scopes['wl_hvac']  = ProjectScope::create(['project_id' => $projects['westlake']->id, 'trade_id' => $trades['HVAC']->id,                  'description' => 'HVAC for new wing — energy recovery units, VAV distribution, and controls integration.',                  'estimated_value' =>  420000.00, 'status' => 'bidding']);
        $scopes['wl_frame'] = ProjectScope::create(['project_id' => $projects['westlake']->id, 'trade_id' => $trades['Framing & Carpentry']->id,  'description' => 'Structural framing for two-story academic wing and gymnasium.',                                              'estimated_value' =>  580000.00, 'status' => 'bidding']);
        $scopes['wl_roof']  = ProjectScope::create(['project_id' => $projects['westlake']->id, 'trade_id' => $trades['Roofing']->id,              'description' => 'TPO roofing system for new wing and gymnasium.',                                                             'estimated_value' =>  180000.00, 'status' => 'bidding']);

        // Cedar Park Municipal (planning)
        $scopes['cedar_elec'] = ProjectScope::create(['project_id' => $projects['cedar']->id, 'trade_id' => $trades['Electrical']->id,           'description' => 'Complete electrical systems including council chambers AV, backup generator, and site lighting.',          'estimated_value' =>  780000.00, 'status' => 'open']);
        $scopes['cedar_hvac'] = ProjectScope::create(['project_id' => $projects['cedar']->id, 'trade_id' => $trades['HVAC']->id,                  'description' => 'HVAC systems for government office building with 24/7 server room cooling.',                              'estimated_value' =>  650000.00, 'status' => 'open']);
        $scopes['cedar_site'] = ProjectScope::create(['project_id' => $projects['cedar']->id, 'trade_id' => $trades['Excavation & Grading']->id, 'description' => 'Site preparation, grading, utilities, parking lot, and permeable paving installation.',                    'estimated_value' =>  500000.00, 'status' => 'open']);

        // Lakeway Condos (in_progress)
        $scopes['lake_conc']  = ProjectScope::create(['project_id' => $projects['lakeway']->id, 'trade_id' => $trades['Concrete & Masonry']->id,   'description' => 'Underground parking garage, tower foundations, elevated slabs, and exterior limestone veneer.',           'estimated_value' => 2400000.00, 'status' => 'in_progress']);
        $scopes['lake_steel'] = ProjectScope::create(['project_id' => $projects['lakeway']->id, 'trade_id' => $trades['Structural Steel']->id,     'description' => 'Structural steel frame for two 8-story towers.',                                                          'estimated_value' => 1800000.00, 'status' => 'in_progress']);
        $scopes['lake_elec']  = ProjectScope::create(['project_id' => $projects['lakeway']->id, 'trade_id' => $trades['Electrical']->id,           'description' => 'Electrical for 88 luxury units, common areas, underground garage, and pool/amenity deck.',               'estimated_value' => 1200000.00, 'status' => 'awarded']);
        $scopes['lake_glaze'] = ProjectScope::create(['project_id' => $projects['lakeway']->id, 'trade_id' => $trades['Glazing & Windows']->id,    'description' => 'Floor-to-ceiling glazing system and balcony glass railings for both towers.',                             'estimated_value' =>  900000.00, 'status' => 'awarded']);
        $scopes['lake_floor'] = ProjectScope::create(['project_id' => $projects['lakeway']->id, 'trade_id' => $trades['Flooring']->id,             'description' => 'Premium hardwood and stone flooring for luxury unit interiors and common areas.',                        'estimated_value' =>  650000.00, 'status' => 'open']);

        // Round Rock Warehouse (completed)
        $scopes['wh_conc']  = ProjectScope::create(['project_id' => $projects['warehouse']->id, 'trade_id' => $trades['Concrete & Masonry']->id,   'description' => 'Tilt-wall panel construction, slab-on-grade, and dock pits for 285,000 SF distribution facility.',      'estimated_value' => 2800000.00, 'status' => 'completed']);
        $scopes['wh_elec']  = ProjectScope::create(['project_id' => $projects['warehouse']->id, 'trade_id' => $trades['Electrical']->id,           'description' => 'High-bay LED lighting, power distribution, dock equipment electrical, and office electrical.',          'estimated_value' =>  950000.00, 'status' => 'completed']);
        $scopes['wh_plumb'] = ProjectScope::create(['project_id' => $projects['warehouse']->id, 'trade_id' => $trades['Plumbing']->id,             'description' => 'Sanitary plumbing, restrooms, breakroom plumbing, and exterior site utilities.',                         'estimated_value' =>  380000.00, 'status' => 'completed']);
        $scopes['wh_roof']  = ProjectScope::create(['project_id' => $projects['warehouse']->id, 'trade_id' => $trades['Roofing']->id,              'description' => 'TPO roofing system with 26-year warranty for 285,000 SF warehouse footprint.',                          'estimated_value' =>  680000.00, 'status' => 'completed']);
        $scopes['wh_site']  = ProjectScope::create(['project_id' => $projects['warehouse']->id, 'trade_id' => $trades['Excavation & Grading']->id, 'description' => 'Mass grading, utilities, truck court paving, parking lot, and detention pond.',                          'estimated_value' =>  620000.00, 'status' => 'completed']);

        // Barton Creek Resort (on_hold)
        $scopes['bc_demo'] = ProjectScope::create(['project_id' => $projects['barton']->id, 'trade_id' => $trades['Demolition']->id,          'description' => 'Selective demolition of existing guest rooms, lobby, restaurant spaces, and dated conference center.',      'estimated_value' =>  480000.00, 'status' => 'open']);
        $scopes['bc_hvac'] = ProjectScope::create(['project_id' => $projects['barton']->id, 'trade_id' => $trades['HVAC']->id,                 'description' => 'Complete HVAC replacement for hotel tower, new spa mechanical systems, and banquet hall air handling.',    'estimated_value' => 1100000.00, 'status' => 'open']);
        $scopes['bc_elec'] = ProjectScope::create(['project_id' => $projects['barton']->id, 'trade_id' => $trades['Electrical']->id,          'description' => 'Electrical upgrades for guest rooms, spa facilities, event pavilion, and resort exterior lighting.',        'estimated_value' =>  850000.00, 'status' => 'open']);

        // ─── 7. INVITATIONS TO BID ───────────────────────────────────────────────
        $itbs = [];

        // Downtown Office Tower — bidding scopes
        $itbs[0]  = InvitationToBid::create(['project_scope_id' => $scopes['downtown_elec']->id,  'company_id' => $subs['Lone Star Electrical Services']->id, 'status' => 'bid_submitted', 'sent_at' => '2026-02-15 09:00:00', 'responded_at' => '2026-03-05 14:30:00']);
        $itbs[1]  = InvitationToBid::create(['project_scope_id' => $scopes['downtown_elec']->id,  'company_id' => $subs['Riverside Mechanical']->id,          'status' => 'viewed',        'sent_at' => '2026-02-15 09:00:00', 'responded_at' => null]);
        $itbs[2]  = InvitationToBid::create(['project_scope_id' => $scopes['downtown_elec']->id,  'company_id' => $subs['BlueLine HVAC Systems']->id,         'status' => 'declined',      'sent_at' => '2026-02-15 09:00:00', 'responded_at' => '2026-02-20 10:00:00', 'notes' => 'Not bidding electrical-only scopes at this time.']);
        $itbs[3]  = InvitationToBid::create(['project_scope_id' => $scopes['downtown_hvac']->id,  'company_id' => $subs['BlueLine HVAC Systems']->id,         'status' => 'bid_submitted', 'sent_at' => '2026-02-15 09:00:00', 'responded_at' => '2026-03-08 11:00:00']);
        $itbs[4]  = InvitationToBid::create(['project_scope_id' => $scopes['downtown_hvac']->id,  'company_id' => $subs['Riverside Mechanical']->id,          'status' => 'bid_submitted', 'sent_at' => '2026-02-15 09:00:00', 'responded_at' => '2026-03-10 16:00:00']);
        $itbs[5]  = InvitationToBid::create(['project_scope_id' => $scopes['downtown_hvac']->id,  'company_id' => $subs['Guardian Fire Protection']->id,      'status' => 'sent',          'sent_at' => '2026-02-15 09:00:00', 'responded_at' => null]);
        $itbs[6]  = InvitationToBid::create(['project_scope_id' => $scopes['downtown_steel']->id, 'company_id' => $subs['Texas Steel Erectors']->id,          'status' => 'bid_submitted', 'sent_at' => '2026-02-10 08:00:00', 'responded_at' => '2026-03-01 09:00:00']);
        $itbs[7]  = InvitationToBid::create(['project_scope_id' => $scopes['downtown_steel']->id, 'company_id' => $subs['Ironclad Concrete & Masonry']->id,   'status' => 'viewed',        'sent_at' => '2026-02-10 08:00:00', 'responded_at' => null]);
        $itbs[8]  = InvitationToBid::create(['project_scope_id' => $scopes['downtown_conc']->id,  'company_id' => $subs['Ironclad Concrete & Masonry']->id,   'status' => 'bid_submitted', 'sent_at' => '2026-02-10 08:00:00', 'responded_at' => '2026-03-03 10:00:00']);
        $itbs[9]  = InvitationToBid::create(['project_scope_id' => $scopes['downtown_conc']->id,  'company_id' => $subs['AllTrade Builders']->id,              'status' => 'declined',      'sent_at' => '2026-02-10 08:00:00', 'responded_at' => '2026-02-18 14:00:00', 'notes' => 'Fully committed on other projects through Q2.']);
        $itbs[10] = InvitationToBid::create(['project_scope_id' => $scopes['downtown_glaze']->id, 'company_id' => $subs['ClearView Glass & Glazing']->id,     'status' => 'bid_submitted', 'sent_at' => '2026-02-15 09:00:00', 'responded_at' => '2026-03-12 15:00:00']);
        $itbs[11] = InvitationToBid::create(['project_scope_id' => $scopes['downtown_glaze']->id, 'company_id' => $subs['Heritage Framing Co.']->id,           'status' => 'sent',          'sent_at' => '2026-02-15 09:00:00', 'responded_at' => null]);
        $itbs[12] = InvitationToBid::create(['project_scope_id' => $scopes['downtown_elev']->id,  'company_id' => $subs['Apex Elevators Inc.']->id,            'status' => 'bid_submitted', 'sent_at' => '2026-02-20 10:00:00', 'responded_at' => '2026-03-15 11:00:00']);

        // Westlake Elementary
        $itbs[13] = InvitationToBid::create(['project_scope_id' => $scopes['wl_elec']->id,  'company_id' => $subs['Lone Star Electrical Services']->id, 'status' => 'viewed',        'sent_at' => '2026-03-01 09:00:00', 'responded_at' => null]);
        $itbs[14] = InvitationToBid::create(['project_scope_id' => $scopes['wl_elec']->id,  'company_id' => $subs['Riverside Mechanical']->id,          'status' => 'bid_submitted', 'sent_at' => '2026-03-01 09:00:00', 'responded_at' => '2026-03-20 10:00:00']);
        $itbs[15] = InvitationToBid::create(['project_scope_id' => $scopes['wl_hvac']->id,  'company_id' => $subs['BlueLine HVAC Systems']->id,         'status' => 'bid_submitted', 'sent_at' => '2026-03-01 09:00:00', 'responded_at' => '2026-03-18 14:00:00']);
        $itbs[16] = InvitationToBid::create(['project_scope_id' => $scopes['wl_hvac']->id,  'company_id' => $subs['Riverside Mechanical']->id,          'status' => 'sent',          'sent_at' => '2026-03-01 09:00:00', 'responded_at' => null]);
        $itbs[17] = InvitationToBid::create(['project_scope_id' => $scopes['wl_frame']->id, 'company_id' => $subs['Heritage Framing Co.']->id,          'status' => 'bid_submitted', 'sent_at' => '2026-03-01 09:00:00', 'responded_at' => '2026-03-22 09:00:00']);
        $itbs[18] = InvitationToBid::create(['project_scope_id' => $scopes['wl_frame']->id, 'company_id' => $subs['AllTrade Builders']->id,             'status' => 'viewed',        'sent_at' => '2026-03-01 09:00:00', 'responded_at' => null]);
        $itbs[19] = InvitationToBid::create(['project_scope_id' => $scopes['wl_roof']->id,  'company_id' => $subs['Peak Roofing Systems']->id,          'status' => 'bid_submitted', 'sent_at' => '2026-03-01 09:00:00', 'responded_at' => '2026-03-19 11:00:00']);

        // Hospital (historical)
        $itb_hosp_elec  = InvitationToBid::create(['project_scope_id' => $scopes['hosp_elec']->id,    'company_id' => $subs['Lone Star Electrical Services']->id, 'status' => 'bid_submitted', 'sent_at' => '2025-06-01 09:00:00', 'responded_at' => '2025-06-20 10:00:00']);
        $itb_hosp_plumb = InvitationToBid::create(['project_scope_id' => $scopes['hosp_plumb']->id,   'company_id' => $subs['Summit Plumbing Solutions']->id,     'status' => 'bid_submitted', 'sent_at' => '2025-06-01 09:00:00', 'responded_at' => '2025-06-22 14:00:00']);
        $itb_hosp_hvac  = InvitationToBid::create(['project_scope_id' => $scopes['hosp_hvac']->id,    'company_id' => $subs['BlueLine HVAC Systems']->id,         'status' => 'bid_submitted', 'sent_at' => '2025-06-01 09:00:00', 'responded_at' => '2025-06-25 11:00:00']);
        $itb_hosp_dry   = InvitationToBid::create(['project_scope_id' => $scopes['hosp_drywall']->id, 'company_id' => $subs['DryTech Interiors']->id,             'status' => 'bid_submitted', 'sent_at' => '2025-06-01 09:00:00', 'responded_at' => '2025-06-23 09:00:00']);
        $itb_hosp_floor = InvitationToBid::create(['project_scope_id' => $scopes['hosp_floor']->id,   'company_id' => $subs['Premier Flooring Solutions']->id,    'status' => 'bid_submitted', 'sent_at' => '2025-06-01 09:00:00', 'responded_at' => '2025-06-21 16:00:00']);

        // Meridian (historical)
        $itb_mer_frame = InvitationToBid::create(['project_scope_id' => $scopes['mer_frame']->id,   'company_id' => $subs['Heritage Framing Co.']->id,         'status' => 'bid_submitted', 'sent_at' => '2025-02-01 09:00:00', 'responded_at' => '2025-02-20 10:00:00']);
        $itb_mer_elec  = InvitationToBid::create(['project_scope_id' => $scopes['mer_elec']->id,    'company_id' => $subs['Lone Star Electrical Services']->id, 'status' => 'bid_submitted', 'sent_at' => '2025-02-01 09:00:00', 'responded_at' => '2025-02-22 14:00:00']);
        $itb_mer_plumb = InvitationToBid::create(['project_scope_id' => $scopes['mer_plumb']->id,   'company_id' => $subs['Riverside Mechanical']->id,         'status' => 'bid_submitted', 'sent_at' => '2025-02-01 09:00:00', 'responded_at' => '2025-02-25 11:00:00']);
        $itb_mer_conc  = InvitationToBid::create(['project_scope_id' => $scopes['mer_conc']->id,    'company_id' => $subs['Ironclad Concrete & Masonry']->id,  'status' => 'bid_submitted', 'sent_at' => '2025-02-01 09:00:00', 'responded_at' => '2025-02-23 09:00:00']);
        $itb_mer_dry   = InvitationToBid::create(['project_scope_id' => $scopes['mer_drywall']->id, 'company_id' => $subs['AllTrade Builders']->id,            'status' => 'bid_submitted', 'sent_at' => '2025-02-01 09:00:00', 'responded_at' => '2025-02-21 16:00:00']);

        // Lakeway (historical)
        $itb_lake_conc  = InvitationToBid::create(['project_scope_id' => $scopes['lake_conc']->id,  'company_id' => $subs['Ironclad Concrete & Masonry']->id, 'status' => 'bid_submitted', 'sent_at' => '2025-07-01 09:00:00', 'responded_at' => '2025-07-20 10:00:00']);
        $itb_lake_steel = InvitationToBid::create(['project_scope_id' => $scopes['lake_steel']->id, 'company_id' => $subs['Texas Steel Erectors']->id,        'status' => 'bid_submitted', 'sent_at' => '2025-07-01 09:00:00', 'responded_at' => '2025-07-22 14:00:00']);
        $itb_lake_elec  = InvitationToBid::create(['project_scope_id' => $scopes['lake_elec']->id,  'company_id' => $subs['Lone Star Electrical Services']->id,'status' => 'bid_submitted', 'sent_at' => '2025-07-01 09:00:00', 'responded_at' => '2025-07-18 11:00:00']);
        $itb_lake_glaze = InvitationToBid::create(['project_scope_id' => $scopes['lake_glaze']->id, 'company_id' => $subs['ClearView Glass & Glazing']->id,   'status' => 'bid_submitted', 'sent_at' => '2025-07-01 09:00:00', 'responded_at' => '2025-07-25 09:00:00']);

        // Warehouse (historical)
        $itb_wh_conc  = InvitationToBid::create(['project_scope_id' => $scopes['wh_conc']->id,  'company_id' => $subs['Ironclad Concrete & Masonry']->id, 'status' => 'bid_submitted', 'sent_at' => '2024-04-01 09:00:00', 'responded_at' => '2024-04-20 10:00:00']);
        $itb_wh_elec  = InvitationToBid::create(['project_scope_id' => $scopes['wh_elec']->id,  'company_id' => $subs['Lone Star Electrical Services']->id,'status' => 'bid_submitted', 'sent_at' => '2024-04-01 09:00:00', 'responded_at' => '2024-04-18 14:00:00']);
        $itb_wh_plumb = InvitationToBid::create(['project_scope_id' => $scopes['wh_plumb']->id, 'company_id' => $subs['Summit Plumbing Solutions']->id,   'status' => 'bid_submitted', 'sent_at' => '2024-04-01 09:00:00', 'responded_at' => '2024-04-22 11:00:00']);
        $itb_wh_roof  = InvitationToBid::create(['project_scope_id' => $scopes['wh_roof']->id,  'company_id' => $subs['Peak Roofing Systems']->id,         'status' => 'bid_submitted', 'sent_at' => '2024-04-01 09:00:00', 'responded_at' => '2024-04-19 09:00:00']);
        $itb_wh_site  = InvitationToBid::create(['project_scope_id' => $scopes['wh_site']->id,  'company_id' => $subs['SitePrep Excavation']->id,          'status' => 'bid_submitted', 'sent_at' => '2024-04-01 09:00:00', 'responded_at' => '2024-04-17 16:00:00']);

        // ─── 8. BIDS ─────────────────────────────────────────────────────────────
        // Downtown (under_review / submitted)
        $bid_dt_elec  = Bid::create(['invitation_id' => $itbs[0]->id,  'company_id' => $subs['Lone Star Electrical Services']->id, 'project_scope_id' => $scopes['downtown_elec']->id,  'amount' => 1785000.00, 'description' => 'Complete electrical systems per spec drawings E-001 through E-048. Includes switchgear, panelboards, lighting, and fire alarm rough-in.',                        'timeline_days' => 540, 'status' => 'under_review', 'submitted_at' => '2026-03-05 14:30:00', 'reviewed_at' => '2026-03-15 10:00:00']);
        $bid_dt_hvac1 = Bid::create(['invitation_id' => $itbs[3]->id,  'company_id' => $subs['BlueLine HVAC Systems']->id,         'project_scope_id' => $scopes['downtown_hvac']->id,  'amount' => 1490000.00, 'description' => 'VAV HVAC system with energy recovery. Includes all ductwork, equipment, controls, and commissioning.',                                                        'timeline_days' => 520, 'status' => 'under_review', 'submitted_at' => '2026-03-08 11:00:00', 'reviewed_at' => '2026-03-18 14:00:00']);
        $bid_dt_hvac2 = Bid::create(['invitation_id' => $itbs[4]->id,  'company_id' => $subs['Riverside Mechanical']->id,          'project_scope_id' => $scopes['downtown_hvac']->id,  'amount' => 1525000.00, 'description' => 'Complete HVAC design-build including cooling towers, AHUs, VAV boxes, and building automation system.',                                                      'timeline_days' => 530, 'status' => 'submitted',     'submitted_at' => '2026-03-10 16:00:00']);
        $bid_dt_steel = Bid::create(['invitation_id' => $itbs[6]->id,  'company_id' => $subs['Texas Steel Erectors']->id,          'project_scope_id' => $scopes['downtown_steel']->id, 'amount' => 2180000.00, 'description' => 'Steel fabrication and erection per structural drawings. AISC certified shop. Includes decking, shear studs, and connections.',                              'timeline_days' => 480, 'status' => 'under_review', 'submitted_at' => '2026-03-01 09:00:00', 'reviewed_at' => '2026-03-12 11:00:00']);
        $bid_dt_conc  = Bid::create(['invitation_id' => $itbs[8]->id,  'company_id' => $subs['Ironclad Concrete & Masonry']->id,   'project_scope_id' => $scopes['downtown_conc']->id,  'amount' => 1620000.00, 'description' => 'Foundation, underground structure, elevated decks, and architectural masonry per plans.',                                                                  'timeline_days' => 420, 'status' => 'submitted',     'submitted_at' => '2026-03-03 10:00:00']);
        $bid_dt_glaze = Bid::create(['invitation_id' => $itbs[10]->id, 'company_id' => $subs['ClearView Glass & Glazing']->id,     'project_scope_id' => $scopes['downtown_glaze']->id, 'amount' =>  945000.00, 'description' => 'Curtain wall system supply and installation. Unitized system with IGU panels, thermally broken frames.',                                                    'timeline_days' => 300, 'status' => 'under_review', 'submitted_at' => '2026-03-12 15:00:00', 'reviewed_at' => '2026-03-20 09:00:00']);
        $bid_dt_elev  = Bid::create(['invitation_id' => $itbs[12]->id, 'company_id' => $subs['Apex Elevators Inc.']->id,           'project_scope_id' => $scopes['downtown_elev']->id,  'amount' =>  790000.00, 'description' => '6 passenger traction elevators (3,500 lb, 350 fpm), 2 service elevators, 1 parking elevator. Includes machine rooms and all controls.',                  'timeline_days' => 360, 'status' => 'submitted',     'submitted_at' => '2026-03-15 11:00:00']);

        // Westlake
        $bid_wl_elec  = Bid::create(['invitation_id' => $itbs[14]->id, 'company_id' => $subs['Riverside Mechanical']->id,  'project_scope_id' => $scopes['wl_elec']->id,  'amount' =>  475000.00, 'description' => 'Electrical systems for academic wing and gymnasium per plans.',                           'timeline_days' => 180, 'status' => 'submitted', 'submitted_at' => '2026-03-20 10:00:00']);
        $bid_wl_hvac  = Bid::create(['invitation_id' => $itbs[15]->id, 'company_id' => $subs['BlueLine HVAC Systems']->id, 'project_scope_id' => $scopes['wl_hvac']->id,  'amount' =>  415000.00, 'description' => 'HVAC systems for new wing. Energy recovery units, VAV distribution, controls per spec.',   'timeline_days' => 160, 'status' => 'submitted', 'submitted_at' => '2026-03-18 14:00:00']);
        $bid_wl_frame = Bid::create(['invitation_id' => $itbs[17]->id, 'company_id' => $subs['Heritage Framing Co.']->id,  'project_scope_id' => $scopes['wl_frame']->id, 'amount' =>  572000.00, 'description' => 'Structural framing for two-story academic wing and gymnasium per structural drawings.',     'timeline_days' => 120, 'status' => 'submitted', 'submitted_at' => '2026-03-22 09:00:00']);
        $bid_wl_roof  = Bid::create(['invitation_id' => $itbs[19]->id, 'company_id' => $subs['Peak Roofing Systems']->id,  'project_scope_id' => $scopes['wl_roof']->id,  'amount' =>  178000.00, 'description' => 'TPO roofing system, 60-mil, fully adhered, with tapered insulation and sheet metal flashing.', 'timeline_days' => 45, 'status' => 'submitted', 'submitted_at' => '2026-03-19 11:00:00']);

        // Hospital (accepted)
        $bid_hosp_elec  = Bid::create(['invitation_id' => $itb_hosp_elec->id,  'company_id' => $subs['Lone Star Electrical Services']->id, 'project_scope_id' => $scopes['hosp_elec']->id,    'amount' => 1085000.00, 'description' => 'Complete electrical renovation per healthcare specs.',                                    'timeline_days' => 450, 'status' => 'accepted', 'submitted_at' => '2025-06-20 10:00:00', 'reviewed_at' => '2025-07-05 14:00:00']);
        $bid_hosp_plumb = Bid::create(['invitation_id' => $itb_hosp_plumb->id, 'company_id' => $subs['Summit Plumbing Solutions']->id,     'project_scope_id' => $scopes['hosp_plumb']->id,   'amount' =>  840000.00, 'description' => 'Full plumbing renovation including medical gas rough-in.',                               'timeline_days' => 400, 'status' => 'accepted', 'submitted_at' => '2025-06-22 14:00:00', 'reviewed_at' => '2025-07-05 14:00:00']);
        $bid_hosp_hvac  = Bid::create(['invitation_id' => $itb_hosp_hvac->id,  'company_id' => $subs['BlueLine HVAC Systems']->id,         'project_scope_id' => $scopes['hosp_hvac']->id,    'amount' => 1195000.00, 'description' => 'Healthcare HVAC with negative pressure isolation and BAS integration.',               'timeline_days' => 420, 'status' => 'accepted', 'submitted_at' => '2025-06-25 11:00:00', 'reviewed_at' => '2025-07-05 14:00:00']);
        $bid_hosp_dry   = Bid::create(['invitation_id' => $itb_hosp_dry->id,   'company_id' => $subs['DryTech Interiors']->id,             'project_scope_id' => $scopes['hosp_drywall']->id, 'amount' =>  595000.00, 'description' => 'Healthcare drywall and metal stud partitions per architectural plans.',                  'timeline_days' => 300, 'status' => 'accepted', 'submitted_at' => '2025-06-23 09:00:00', 'reviewed_at' => '2025-07-05 14:00:00']);
        $bid_hosp_floor = Bid::create(['invitation_id' => $itb_hosp_floor->id, 'company_id' => $subs['Premier Flooring Solutions']->id,    'project_scope_id' => $scopes['hosp_floor']->id,   'amount' =>  345000.00, 'description' => 'Healthcare-grade flooring per finish schedule. LVT in patient rooms, sheet vinyl in clinical areas.', 'timeline_days' => 120, 'status' => 'accepted', 'submitted_at' => '2025-06-21 16:00:00', 'reviewed_at' => '2025-07-05 14:00:00']);

        // Meridian (accepted)
        $bid_mer_frame = Bid::create(['invitation_id' => $itb_mer_frame->id, 'company_id' => $subs['Heritage Framing Co.']->id,         'project_scope_id' => $scopes['mer_frame']->id,   'amount' => 2750000.00, 'description' => 'Complete structural framing for 3 buildings.',                                    'timeline_days' => 600, 'status' => 'accepted', 'submitted_at' => '2025-02-20 10:00:00', 'reviewed_at' => '2025-03-10 14:00:00']);
        $bid_mer_elec  = Bid::create(['invitation_id' => $itb_mer_elec->id,  'company_id' => $subs['Lone Star Electrical Services']->id, 'project_scope_id' => $scopes['mer_elec']->id,    'amount' => 2180000.00, 'description' => 'Full electrical systems for 312 units and common areas.',                         'timeline_days' => 720, 'status' => 'accepted', 'submitted_at' => '2025-02-22 14:00:00', 'reviewed_at' => '2025-03-10 14:00:00']);
        $bid_mer_plumb = Bid::create(['invitation_id' => $itb_mer_plumb->id, 'company_id' => $subs['Riverside Mechanical']->id,         'project_scope_id' => $scopes['mer_plumb']->id,   'amount' => 1790000.00, 'description' => 'Plumbing for all residential units and commercial areas.',                       'timeline_days' => 700, 'status' => 'accepted', 'submitted_at' => '2025-02-25 11:00:00', 'reviewed_at' => '2025-03-10 14:00:00']);
        $bid_mer_conc  = Bid::create(['invitation_id' => $itb_mer_conc->id,  'company_id' => $subs['Ironclad Concrete & Masonry']->id,  'project_scope_id' => $scopes['mer_conc']->id,    'amount' => 3150000.00, 'description' => 'Podium parking, foundations, elevated slabs, and masonry veneer.',               'timeline_days' => 480, 'status' => 'accepted', 'submitted_at' => '2025-02-23 09:00:00', 'reviewed_at' => '2025-03-10 14:00:00']);
        $bid_mer_dry   = Bid::create(['invitation_id' => $itb_mer_dry->id,   'company_id' => $subs['AllTrade Builders']->id,            'project_scope_id' => $scopes['mer_drywall']->id, 'amount' => 1380000.00, 'description' => 'Drywall, metal stud framing, and spray foam for all three buildings.',          'timeline_days' => 540, 'status' => 'accepted', 'submitted_at' => '2025-02-21 16:00:00', 'reviewed_at' => '2025-03-10 14:00:00']);

        // Lakeway (accepted)
        $bid_lake_conc  = Bid::create(['invitation_id' => $itb_lake_conc->id,  'company_id' => $subs['Ironclad Concrete & Masonry']->id, 'project_scope_id' => $scopes['lake_conc']->id,  'amount' => 2380000.00, 'description' => 'Underground garage, foundations, elevated slabs for two towers.',           'timeline_days' => 420, 'status' => 'accepted', 'submitted_at' => '2025-07-20 10:00:00', 'reviewed_at' => '2025-08-05 14:00:00']);
        $bid_lake_steel = Bid::create(['invitation_id' => $itb_lake_steel->id, 'company_id' => $subs['Texas Steel Erectors']->id,        'project_scope_id' => $scopes['lake_steel']->id, 'amount' => 1785000.00, 'description' => 'Structural steel frame for both 8-story towers.',                            'timeline_days' => 300, 'status' => 'accepted', 'submitted_at' => '2025-07-22 14:00:00', 'reviewed_at' => '2025-08-05 14:00:00']);
        $bid_lake_elec  = Bid::create(['invitation_id' => $itb_lake_elec->id,  'company_id' => $subs['Lone Star Electrical Services']->id,'project_scope_id' => $scopes['lake_elec']->id,  'amount' => 1195000.00, 'description' => 'Complete electrical for luxury condo units, amenities, and parking.',         'timeline_days' => 360, 'status' => 'accepted', 'submitted_at' => '2025-07-18 11:00:00', 'reviewed_at' => '2025-08-05 14:00:00']);
        $bid_lake_glaze = Bid::create(['invitation_id' => $itb_lake_glaze->id, 'company_id' => $subs['ClearView Glass & Glazing']->id,   'project_scope_id' => $scopes['lake_glaze']->id, 'amount' =>  890000.00, 'description' => 'Floor-to-ceiling glazing and glass railing systems for both towers.',          'timeline_days' => 240, 'status' => 'accepted', 'submitted_at' => '2025-07-25 09:00:00', 'reviewed_at' => '2025-08-05 14:00:00']);

        // Warehouse (accepted)
        $bid_wh_conc  = Bid::create(['invitation_id' => $itb_wh_conc->id,  'company_id' => $subs['Ironclad Concrete & Masonry']->id, 'project_scope_id' => $scopes['wh_conc']->id,  'amount' => 2760000.00, 'description' => 'Tilt-wall construction and slab-on-grade for 285,000 SF warehouse.',       'timeline_days' => 210, 'status' => 'accepted', 'submitted_at' => '2024-04-20 10:00:00', 'reviewed_at' => '2024-05-10 14:00:00']);
        $bid_wh_elec  = Bid::create(['invitation_id' => $itb_wh_elec->id,  'company_id' => $subs['Lone Star Electrical Services']->id,'project_scope_id' => $scopes['wh_elec']->id,  'amount' =>  940000.00, 'description' => 'High-bay lighting, power distribution, and dock electrical for warehouse.',   'timeline_days' => 180, 'status' => 'accepted', 'submitted_at' => '2024-04-18 14:00:00', 'reviewed_at' => '2024-05-10 14:00:00']);
        $bid_wh_plumb = Bid::create(['invitation_id' => $itb_wh_plumb->id, 'company_id' => $subs['Summit Plumbing Solutions']->id,   'project_scope_id' => $scopes['wh_plumb']->id, 'amount' =>  375000.00, 'description' => 'Sanitary plumbing and site utilities for distribution center.',              'timeline_days' => 90,  'status' => 'accepted', 'submitted_at' => '2024-04-22 11:00:00', 'reviewed_at' => '2024-05-10 14:00:00']);
        $bid_wh_roof  = Bid::create(['invitation_id' => $itb_wh_roof->id,  'company_id' => $subs['Peak Roofing Systems']->id,         'project_scope_id' => $scopes['wh_roof']->id,  'amount' =>  672000.00, 'description' => 'TPO roofing system with tapered insulation for 285,000 SF warehouse roof.', 'timeline_days' => 60,  'status' => 'accepted', 'submitted_at' => '2024-04-19 09:00:00', 'reviewed_at' => '2024-05-10 14:00:00']);
        $bid_wh_site  = Bid::create(['invitation_id' => $itb_wh_site->id,  'company_id' => $subs['SitePrep Excavation']->id,          'project_scope_id' => $scopes['wh_site']->id,  'amount' =>  615000.00, 'description' => 'Mass grading, utilities, paving, and detention pond for industrial site.',   'timeline_days' => 120, 'status' => 'accepted', 'submitted_at' => '2024-04-17 16:00:00', 'reviewed_at' => '2024-05-10 14:00:00']);

        // ─── 9. CONTRACTS ────────────────────────────────────────────────────────
        // Hospital (active)
        $con_hosp_elec  = Contract::create(['bid_id' => $bid_hosp_elec->id,  'project_id' => $projects['hospital']->id, 'company_id' => $subs['Lone Star Electrical Services']->id, 'trade_id' => $trades['Electrical']->id,           'amount' => 1085000.00, 'status' => 'active', 'start_date' => '2025-09-15', 'end_date' => '2026-11-30', 'signed_at' => '2025-07-15 10:00:00']);
        $con_hosp_plumb = Contract::create(['bid_id' => $bid_hosp_plumb->id, 'project_id' => $projects['hospital']->id, 'company_id' => $subs['Summit Plumbing Solutions']->id,     'trade_id' => $trades['Plumbing']->id,             'amount' =>  840000.00, 'status' => 'active', 'start_date' => '2025-09-15', 'end_date' => '2026-10-31', 'signed_at' => '2025-07-15 10:00:00']);
        $con_hosp_hvac  = Contract::create(['bid_id' => $bid_hosp_hvac->id,  'project_id' => $projects['hospital']->id, 'company_id' => $subs['BlueLine HVAC Systems']->id,         'trade_id' => $trades['HVAC']->id,                  'amount' => 1195000.00, 'status' => 'active', 'start_date' => '2025-09-15', 'end_date' => '2026-12-31', 'signed_at' => '2025-07-15 10:00:00']);
        $con_hosp_dry   = Contract::create(['bid_id' => $bid_hosp_dry->id,   'project_id' => $projects['hospital']->id, 'company_id' => $subs['DryTech Interiors']->id,             'trade_id' => $trades['Drywall & Insulation']->id, 'amount' =>  595000.00, 'status' => 'active', 'start_date' => '2025-10-01', 'end_date' => '2026-09-30', 'signed_at' => '2025-07-15 10:00:00']);
        $con_hosp_floor = Contract::create(['bid_id' => $bid_hosp_floor->id, 'project_id' => $projects['hospital']->id, 'company_id' => $subs['Premier Flooring Solutions']->id,    'trade_id' => $trades['Flooring']->id,             'amount' =>  345000.00, 'status' => 'active', 'start_date' => '2026-03-01', 'end_date' => '2026-11-30', 'signed_at' => '2025-07-15 10:00:00']);

        // Meridian (active)
        $con_mer_frame = Contract::create(['bid_id' => $bid_mer_frame->id, 'project_id' => $projects['meridian']->id, 'company_id' => $subs['Heritage Framing Co.']->id,         'trade_id' => $trades['Framing & Carpentry']->id,  'amount' => 2750000.00, 'status' => 'active', 'start_date' => '2025-06-01', 'end_date' => '2026-12-31', 'signed_at' => '2025-03-20 10:00:00']);
        $con_mer_elec  = Contract::create(['bid_id' => $bid_mer_elec->id,  'project_id' => $projects['meridian']->id, 'company_id' => $subs['Lone Star Electrical Services']->id, 'trade_id' => $trades['Electrical']->id,           'amount' => 2180000.00, 'status' => 'active', 'start_date' => '2025-06-01', 'end_date' => '2027-06-30', 'signed_at' => '2025-03-20 10:00:00']);
        $con_mer_plumb = Contract::create(['bid_id' => $bid_mer_plumb->id, 'project_id' => $projects['meridian']->id, 'company_id' => $subs['Riverside Mechanical']->id,         'trade_id' => $trades['Plumbing']->id,             'amount' => 1790000.00, 'status' => 'active', 'start_date' => '2025-06-01', 'end_date' => '2027-06-30', 'signed_at' => '2025-03-20 10:00:00']);
        $con_mer_conc  = Contract::create(['bid_id' => $bid_mer_conc->id,  'project_id' => $projects['meridian']->id, 'company_id' => $subs['Ironclad Concrete & Masonry']->id,  'trade_id' => $trades['Concrete & Masonry']->id,   'amount' => 3150000.00, 'status' => 'active', 'start_date' => '2025-06-01', 'end_date' => '2026-06-30', 'signed_at' => '2025-03-20 10:00:00']);
        $con_mer_dry   = Contract::create(['bid_id' => $bid_mer_dry->id,   'project_id' => $projects['meridian']->id, 'company_id' => $subs['AllTrade Builders']->id,            'trade_id' => $trades['Drywall & Insulation']->id, 'amount' => 1380000.00, 'status' => 'active', 'start_date' => '2025-09-01', 'end_date' => '2027-03-31', 'signed_at' => '2025-03-20 10:00:00']);

        // Lakeway (active)
        $con_lake_conc  = Contract::create(['bid_id' => $bid_lake_conc->id,  'project_id' => $projects['lakeway']->id, 'company_id' => $subs['Ironclad Concrete & Masonry']->id, 'trade_id' => $trades['Concrete & Masonry']->id, 'amount' => 2380000.00, 'status' => 'active', 'start_date' => '2025-11-01', 'end_date' => '2026-09-30', 'signed_at' => '2025-08-20 10:00:00']);
        $con_lake_steel = Contract::create(['bid_id' => $bid_lake_steel->id, 'project_id' => $projects['lakeway']->id, 'company_id' => $subs['Texas Steel Erectors']->id,        'trade_id' => $trades['Structural Steel']->id,   'amount' => 1785000.00, 'status' => 'active', 'start_date' => '2025-11-01', 'end_date' => '2026-07-31', 'signed_at' => '2025-08-20 10:00:00']);
        $con_lake_elec  = Contract::create(['bid_id' => $bid_lake_elec->id,  'project_id' => $projects['lakeway']->id, 'company_id' => $subs['Lone Star Electrical Services']->id,'trade_id' => $trades['Electrical']->id,         'amount' => 1195000.00, 'status' => 'active', 'start_date' => '2026-01-01', 'end_date' => '2027-03-31', 'signed_at' => '2025-08-20 10:00:00']);
        $con_lake_glaze = Contract::create(['bid_id' => $bid_lake_glaze->id, 'project_id' => $projects['lakeway']->id, 'company_id' => $subs['ClearView Glass & Glazing']->id,   'trade_id' => $trades['Glazing & Windows']->id,  'amount' =>  890000.00, 'status' => 'active', 'start_date' => '2026-03-01', 'end_date' => '2026-12-31', 'signed_at' => '2025-08-20 10:00:00']);

        // Warehouse (completed)
        $con_wh_conc  = Contract::create(['bid_id' => $bid_wh_conc->id,  'project_id' => $projects['warehouse']->id, 'company_id' => $subs['Ironclad Concrete & Masonry']->id, 'trade_id' => $trades['Concrete & Masonry']->id,   'amount' => 2760000.00, 'status' => 'completed', 'start_date' => '2024-08-01', 'end_date' => '2025-04-30', 'signed_at' => '2024-05-20 10:00:00']);
        $con_wh_elec  = Contract::create(['bid_id' => $bid_wh_elec->id,  'project_id' => $projects['warehouse']->id, 'company_id' => $subs['Lone Star Electrical Services']->id,'trade_id' => $trades['Electrical']->id,           'amount' =>  940000.00, 'status' => 'completed', 'start_date' => '2024-10-01', 'end_date' => '2025-11-30', 'signed_at' => '2024-05-20 10:00:00']);
        $con_wh_plumb = Contract::create(['bid_id' => $bid_wh_plumb->id, 'project_id' => $projects['warehouse']->id, 'company_id' => $subs['Summit Plumbing Solutions']->id,   'trade_id' => $trades['Plumbing']->id,             'amount' =>  375000.00, 'status' => 'completed', 'start_date' => '2024-10-01', 'end_date' => '2025-09-30', 'signed_at' => '2024-05-20 10:00:00']);
        $con_wh_roof  = Contract::create(['bid_id' => $bid_wh_roof->id,  'project_id' => $projects['warehouse']->id, 'company_id' => $subs['Peak Roofing Systems']->id,         'trade_id' => $trades['Roofing']->id,              'amount' =>  672000.00, 'status' => 'completed', 'start_date' => '2025-03-01', 'end_date' => '2025-06-30', 'signed_at' => '2024-05-20 10:00:00']);
        $con_wh_site  = Contract::create(['bid_id' => $bid_wh_site->id,  'project_id' => $projects['warehouse']->id, 'company_id' => $subs['SitePrep Excavation']->id,          'trade_id' => $trades['Excavation & Grading']->id, 'amount' =>  615000.00, 'status' => 'completed', 'start_date' => '2024-08-01', 'end_date' => '2024-12-31', 'signed_at' => '2024-05-20 10:00:00']);

        // ─── 10. INVOICES ─────────────────────────────────────────────────────────
        $invCounter = 1;
        $mkInv = function () use (&$invCounter) {
            return 'INV-' . date('Y') . '-' . str_pad($invCounter++, 4, '0', STR_PAD_LEFT);
        };

        // Warehouse (all paid)
        Invoice::create(['contract_id' => $con_wh_conc->id,  'company_id' => $subs['Ironclad Concrete & Masonry']->id, 'project_id' => $projects['warehouse']->id, 'invoice_number' => $mkInv(), 'amount' =>  828000.00, 'description' => 'Mobilization and initial site concrete — 30% progress billing.',          'status' => 'paid', 'due_date' => '2024-10-15', 'submitted_at' => '2024-09-30 10:00:00', 'approved_at' => '2024-10-05 14:00:00', 'paid_at' => '2024-10-12 11:00:00']);
        Invoice::create(['contract_id' => $con_wh_conc->id,  'company_id' => $subs['Ironclad Concrete & Masonry']->id, 'project_id' => $projects['warehouse']->id, 'invoice_number' => $mkInv(), 'amount' => 1104000.00, 'description' => 'Tilt-wall panel erection — 40% progress billing.',                         'status' => 'paid', 'due_date' => '2025-01-15', 'submitted_at' => '2024-12-31 10:00:00', 'approved_at' => '2025-01-05 14:00:00', 'paid_at' => '2025-01-14 11:00:00']);
        Invoice::create(['contract_id' => $con_wh_conc->id,  'company_id' => $subs['Ironclad Concrete & Masonry']->id, 'project_id' => $projects['warehouse']->id, 'invoice_number' => $mkInv(), 'amount' =>  828000.00, 'description' => 'Final concrete scope completion — 30% final billing.',                    'status' => 'paid', 'due_date' => '2025-06-15', 'submitted_at' => '2025-05-31 10:00:00', 'approved_at' => '2025-06-05 14:00:00', 'paid_at' => '2025-06-12 11:00:00']);
        Invoice::create(['contract_id' => $con_wh_elec->id,  'company_id' => $subs['Lone Star Electrical Services']->id,'project_id' => $projects['warehouse']->id, 'invoice_number' => $mkInv(), 'amount' =>  470000.00, 'description' => 'Rough-in electrical and distribution — 50% progress billing.',          'status' => 'paid', 'due_date' => '2025-03-15', 'submitted_at' => '2025-02-28 10:00:00', 'approved_at' => '2025-03-05 14:00:00', 'paid_at' => '2025-03-12 11:00:00']);
        Invoice::create(['contract_id' => $con_wh_elec->id,  'company_id' => $subs['Lone Star Electrical Services']->id,'project_id' => $projects['warehouse']->id, 'invoice_number' => $mkInv(), 'amount' =>  470000.00, 'description' => 'Electrical trim, testing, and closeout — final billing.',                 'status' => 'paid', 'due_date' => '2025-12-31', 'submitted_at' => '2025-11-30 10:00:00', 'approved_at' => '2025-12-05 14:00:00', 'paid_at' => '2025-12-12 11:00:00']);
        Invoice::create(['contract_id' => $con_wh_plumb->id, 'company_id' => $subs['Summit Plumbing Solutions']->id,   'project_id' => $projects['warehouse']->id, 'invoice_number' => $mkInv(), 'amount' =>  375000.00, 'description' => 'Plumbing rough-in, final, and site utilities — full scope completion.',  'status' => 'paid', 'due_date' => '2025-10-31', 'submitted_at' => '2025-09-30 10:00:00', 'approved_at' => '2025-10-05 14:00:00', 'paid_at' => '2025-10-14 11:00:00']);
        Invoice::create(['contract_id' => $con_wh_roof->id,  'company_id' => $subs['Peak Roofing Systems']->id,         'project_id' => $projects['warehouse']->id, 'invoice_number' => $mkInv(), 'amount' =>  672000.00, 'description' => 'TPO roofing system complete — full scope.',                              'status' => 'paid', 'due_date' => '2025-07-31', 'submitted_at' => '2025-06-30 10:00:00', 'approved_at' => '2025-07-05 14:00:00', 'paid_at' => '2025-07-14 11:00:00']);
        Invoice::create(['contract_id' => $con_wh_site->id,  'company_id' => $subs['SitePrep Excavation']->id,          'project_id' => $projects['warehouse']->id, 'invoice_number' => $mkInv(), 'amount' =>  615000.00, 'description' => 'Mass grading, utilities, paving, and detention pond — full scope.',      'status' => 'paid', 'due_date' => '2025-02-28', 'submitted_at' => '2025-01-31 10:00:00', 'approved_at' => '2025-02-05 14:00:00', 'paid_at' => '2025-02-14 11:00:00']);

        // Hospital (mix)
        Invoice::create(['contract_id' => $con_hosp_elec->id,  'company_id' => $subs['Lone Star Electrical Services']->id, 'project_id' => $projects['hospital']->id, 'invoice_number' => $mkInv(), 'amount' => 325500.00, 'description' => 'Electrical rough-in floors 1-2 — 30% progress billing.',                         'status' => 'paid',         'due_date' => '2025-12-15', 'submitted_at' => '2025-11-30 10:00:00', 'approved_at' => '2025-12-05 14:00:00', 'paid_at' => '2025-12-14 11:00:00']);
        Invoice::create(['contract_id' => $con_hosp_elec->id,  'company_id' => $subs['Lone Star Electrical Services']->id, 'project_id' => $projects['hospital']->id, 'invoice_number' => $mkInv(), 'amount' => 325500.00, 'description' => 'Electrical rough-in floor 3, nurse call, emergency systems — 30% progress.', 'status' => 'approved',     'due_date' => '2026-03-15', 'submitted_at' => '2026-02-28 10:00:00', 'approved_at' => '2026-03-05 14:00:00']);
        Invoice::create(['contract_id' => $con_hosp_plumb->id, 'company_id' => $subs['Summit Plumbing Solutions']->id,     'project_id' => $projects['hospital']->id, 'invoice_number' => $mkInv(), 'amount' => 252000.00, 'description' => 'Plumbing rough-in and medical gas — 30% progress billing.',                        'status' => 'paid',         'due_date' => '2025-12-31', 'submitted_at' => '2025-11-30 10:00:00', 'approved_at' => '2025-12-05 14:00:00', 'paid_at' => '2025-12-14 11:00:00']);
        Invoice::create(['contract_id' => $con_hosp_plumb->id, 'company_id' => $subs['Summit Plumbing Solutions']->id,     'project_id' => $projects['hospital']->id, 'invoice_number' => $mkInv(), 'amount' => 252000.00, 'description' => 'Plumbing rough-in completion and trim — 30% progress.',                           'status' => 'under_review', 'due_date' => '2026-04-15', 'submitted_at' => '2026-03-20 10:00:00']);
        Invoice::create(['contract_id' => $con_hosp_hvac->id,  'company_id' => $subs['BlueLine HVAC Systems']->id,         'project_id' => $projects['hospital']->id, 'invoice_number' => $mkInv(), 'amount' => 358500.00, 'description' => 'HVAC ductwork rough-in floors 1-3 — 30% progress.',                              'status' => 'submitted',    'due_date' => '2026-04-30', 'submitted_at' => '2026-03-22 10:00:00']);
        Invoice::create(['contract_id' => $con_hosp_dry->id,   'company_id' => $subs['DryTech Interiors']->id,             'project_id' => $projects['hospital']->id, 'invoice_number' => $mkInv(), 'amount' => 178500.00, 'description' => 'Metal stud framing and drywall rough — 30% progress.',                           'status' => 'draft']);

        // Meridian (mix)
        Invoice::create(['contract_id' => $con_mer_conc->id,  'company_id' => $subs['Ironclad Concrete & Masonry']->id, 'project_id' => $projects['meridian']->id, 'invoice_number' => $mkInv(), 'amount' => 945000.00, 'description' => 'Podium parking structure — 30% progress billing.',             'status' => 'paid',         'due_date' => '2025-10-15', 'submitted_at' => '2025-09-30 10:00:00', 'approved_at' => '2025-10-05 14:00:00', 'paid_at' => '2025-10-14 11:00:00']);
        Invoice::create(['contract_id' => $con_mer_conc->id,  'company_id' => $subs['Ironclad Concrete & Masonry']->id, 'project_id' => $projects['meridian']->id, 'invoice_number' => $mkInv(), 'amount' => 945000.00, 'description' => 'Tower foundations and level 1 slab — 30% progress.',           'status' => 'approved',     'due_date' => '2026-01-15', 'submitted_at' => '2025-12-31 10:00:00', 'approved_at' => '2026-01-05 14:00:00']);
        Invoice::create(['contract_id' => $con_mer_frame->id, 'company_id' => $subs['Heritage Framing Co.']->id,         'project_id' => $projects['meridian']->id, 'invoice_number' => $mkInv(), 'amount' => 825000.00, 'description' => 'Building A framing complete — 30% progress billing.',         'status' => 'paid',         'due_date' => '2025-11-15', 'submitted_at' => '2025-10-31 10:00:00', 'approved_at' => '2025-11-05 14:00:00', 'paid_at' => '2025-11-14 11:00:00']);
        Invoice::create(['contract_id' => $con_mer_frame->id, 'company_id' => $subs['Heritage Framing Co.']->id,         'project_id' => $projects['meridian']->id, 'invoice_number' => $mkInv(), 'amount' => 825000.00, 'description' => 'Building B framing complete — 30% progress.',               'status' => 'submitted',    'due_date' => '2026-04-15', 'submitted_at' => '2026-03-20 10:00:00']);
        Invoice::create(['contract_id' => $con_mer_elec->id,  'company_id' => $subs['Lone Star Electrical Services']->id,'project_id' => $projects['meridian']->id, 'invoice_number' => $mkInv(), 'amount' => 654000.00, 'description' => 'Electrical rough-in Building A — 30% progress billing.',     'status' => 'under_review', 'due_date' => '2026-04-30', 'submitted_at' => '2026-03-18 10:00:00']);
        Invoice::create(['contract_id' => $con_mer_plumb->id, 'company_id' => $subs['Riverside Mechanical']->id,         'project_id' => $projects['meridian']->id, 'invoice_number' => $mkInv(), 'amount' => 537000.00, 'description' => 'Plumbing rough-in Building A — 30% progress billing.',       'status' => 'draft']);

        // Lakeway (mix)
        Invoice::create(['contract_id' => $con_lake_conc->id,  'company_id' => $subs['Ironclad Concrete & Masonry']->id, 'project_id' => $projects['lakeway']->id, 'invoice_number' => $mkInv(), 'amount' => 714000.00, 'description' => 'Underground garage and podium foundation — 30% progress.', 'status' => 'paid',      'due_date' => '2026-01-31', 'submitted_at' => '2026-01-15 10:00:00', 'approved_at' => '2026-01-20 14:00:00', 'paid_at' => '2026-01-28 11:00:00']);
        Invoice::create(['contract_id' => $con_lake_steel->id, 'company_id' => $subs['Texas Steel Erectors']->id,        'project_id' => $projects['lakeway']->id, 'invoice_number' => $mkInv(), 'amount' => 535500.00, 'description' => 'Tower A steel frame — 30% progress billing.',              'status' => 'approved', 'due_date' => '2026-03-31', 'submitted_at' => '2026-03-10 10:00:00', 'approved_at' => '2026-03-15 14:00:00']);
        Invoice::create(['contract_id' => $con_lake_steel->id, 'company_id' => $subs['Texas Steel Erectors']->id,        'project_id' => $projects['lakeway']->id, 'invoice_number' => $mkInv(), 'amount' => 535500.00, 'description' => 'Tower B steel frame — 30% progress billing.',              'status' => 'submitted', 'due_date' => '2026-04-30', 'submitted_at' => '2026-03-22 10:00:00']);

        // ─── 11. MESSAGES ─────────────────────────────────────────────────────────
        $msgData = [
            ['from' => $marcus, 'to' => $subUsers['Lone Star Electrical Services'], 'project' => $projects['downtown'],  'subject' => 'RFI: Electrical Bid Clarification — Downtown Office Tower',
             'body' => "Hi,\n\nThank you for your bid submission on the Downtown Austin Office Tower electrical scope. We have a few clarification questions before presenting to the review committee:\n\n1. Your bid includes panel boards but we didn't see a line item for the emergency generator. Is that excluded or included in your base bid?\n2. Please confirm your assumed transformer tap location.\n3. Are UPS systems for server rooms included?\n\nPlease respond by April 5th. Thank you.\n\nMarcus Chen\nApex Construction Group",
             'read' => true, 'daysAgo' => 19],
            ['from' => $subUsers['Lone Star Electrical Services'], 'to' => $sarah, 'project' => $projects['downtown'],
             'subject' => 'RE: RFI: Electrical Bid Clarification — Downtown Office Tower',
             'body' => "Sarah,\n\nThank you for reaching out. To answer your questions:\n\n1. Emergency generator (500kW diesel, exterior pad-mounted) IS included in our base bid.\n2. We assumed a utility transformer tap at the north service easement per the site plan.\n3. UPS systems for server rooms are EXCLUDED. We can provide a separate alternate price if needed.\n\nBest,\nAdmin\nLone Star Electrical Services",
             'read' => true, 'daysAgo' => 17],
            ['from' => $sarah, 'to' => $subUsers['BlueLine HVAC Systems'], 'project' => $projects['hospital'],
             'subject' => "HVAC Progress Update Request — St. Mary's Hospital",
             'body' => "Hi,\n\nCould you send us an updated look-ahead schedule for the HVAC work on the hospital project? We're coordinating with the electrical and plumbing subs and need to align sequencing for floors 2 and 3.\n\nSpecifically:\n- Expected completion of AHU rough-in on Floor 2\n- When you'll need access to ceiling spaces above Floor 3 patient rooms\n\nThanks,\nSarah Mitchell\nApex Construction Group",
             'read' => true, 'daysAgo' => 14],
            ['from' => $subUsers['BlueLine HVAC Systems'], 'to' => $sarah, 'project' => $projects['hospital'],
             'subject' => "RE: HVAC Progress Update Request — St. Mary's Hospital",
             'body' => "Sarah,\n\nThanks for checking in. Here's our current schedule:\n\n- Floor 2 AHU rough-in: on track to complete by April 10\n- Floor 3 ceiling access needed: starting April 14, we'll need 3 days of unobstructed access\n\nWe are currently running 4 days ahead of our baseline schedule. We'll have a formal 3-week look-ahead to you by Friday.\n\nBest,\nAdmin\nBlueLine HVAC Systems",
             'read' => false, 'daysAgo' => 12],
            ['from' => $david, 'to' => $subUsers['Heritage Framing Co.'], 'project' => $projects['meridian'],
             'subject' => 'Schedule Coordination — Meridian Building B Framing',
             'body' => "Hi,\n\nWe need to touch base on the Building B framing timeline. Ironclad is running about 8 days behind on the podium slab which will push back your start on Building B.\n\nCan we schedule a 30-minute call this week to discuss recovery options?\n\nThanks,\nDavid Okafor\nApex Construction Group",
             'read' => true, 'daysAgo' => 10],
            ['from' => $subUsers['Heritage Framing Co.'], 'to' => $david, 'project' => $projects['meridian'],
             'subject' => 'RE: Schedule Coordination — Meridian Building B Framing',
             'body' => "David,\n\nUnderstood on the delay. We can hold our crew on Building A punch list while the slab completes, and redeploy to Building B within 5 days of slab cure.\n\nAvailable for a call Thursday 2PM or Friday 10AM.\n\nAdmin\nHeritage Framing Co.",
             'read' => true, 'daysAgo' => 9],
            ['from' => $subUsers['Summit Plumbing Solutions'], 'to' => $marcus, 'project' => $projects['hospital'],
             'subject' => 'Invoice Submission — INV-2026-0011',
             'body' => "Marcus,\n\nPlease find Invoice INV-2026-0011 for \$252,000 covering plumbing rough-in completion on the St. Mary's Hospital project.\n\nWork completed:\n- All floor 1-3 DWV rough-in\n- Medical gas rough-in (O2, vacuum, air)\n- Lavatory and shower rough-in complete floors 1-2\n\nPlease review at your earliest convenience.\n\nThank you,\nAdmin\nSummit Plumbing Solutions",
             'read' => false, 'daysAgo' => 4],
            ['from' => $marcus, 'to' => $subUsers['Ironclad Concrete & Masonry'], 'project' => $projects['meridian'],
             'subject' => 'Concrete Schedule Recovery — Meridian Podium Slab',
             'body' => "Team,\n\nWe need to discuss the 8-day slip on the Meridian podium slab. Downstream subs are all gated on your completion.\n\nPlease provide a written recovery schedule by end of day Thursday.\n\nMarcus Chen\nApex Construction Group",
             'read' => true, 'daysAgo' => 7],
            ['from' => $subUsers['Ironclad Concrete & Masonry'], 'to' => $marcus, 'project' => $projects['meridian'],
             'subject' => 'RE: Concrete Schedule Recovery — Meridian Podium Slab',
             'body' => "Marcus,\n\nWe acknowledge the delay. Primary cause was a 3-day pour interruption due to pump truck breakdown on March 14.\n\nRecovery plan:\n- Added second crew starting March 28\n- Saturday work authorized for next 3 weekends\n- Projected new milestone: April 8 (4 days recovered from current position)\n\nAdmin\nIronclad Concrete & Masonry",
             'read' => false, 'daysAgo' => 5],
            ['from' => $sarah, 'to' => $subUsers['ClearView Glass & Glazing'], 'project' => $projects['downtown'],
             'subject' => 'Curtain Wall Bid Review — Downtown Office Tower',
             'body' => "Hi,\n\nThank you for your curtain wall bid. We have a few questions:\n\n1. Can you offer an alternate using Oldcastle or Wausau that might provide cost savings?\n2. Please confirm your assumed glass specification (VLT, SHGC, U-value).\n3. What is your lead time for unitized panels once shop drawings are approved?\n\nThanks,\nSarah Mitchell",
             'read' => false, 'daysAgo' => 3],
            ['from' => $david, 'to' => $subUsers['Peak Roofing Systems'], 'project' => $projects['westlake'],
             'subject' => 'Roofing Bid Received — Westlake Elementary',
             'body' => "Hi,\n\nWe received your roofing bid for the Westlake Hills Elementary Expansion — thank you for your prompt response.\n\nWe are reviewing all bids and expect to award by May 15.\n\nDavid Okafor\nApex Construction Group",
             'read' => true, 'daysAgo' => 2],
            ['from' => $subUsers['Texas Steel Erectors'], 'to' => $sarah, 'project' => $projects['lakeway'],
             'subject' => 'Invoice Submission — INV-2026-0023',
             'body' => "Sarah,\n\nSubmitting Invoice INV-2026-0023 for \$535,500 covering Tower B structural steel frame completion on the Lakeway Luxury Condominiums project.\n\nAll Tower B steel is erected, plumbed, and bolted. Final EOR inspection scheduled for March 28.\n\nThank you,\nAdmin\nTexas Steel Erectors",
             'read' => false, 'daysAgo' => 2],
            ['from' => $marcus, 'to' => $subUsers['Apex Elevators Inc.'], 'project' => $projects['downtown'],
             'subject' => 'Elevator Bid Follow-up — Downtown Office Tower',
             'body' => "Hi,\n\nThank you for your elevator bid. One question: can you give us a budget add-alternate price for a 7th 3,500 lb unit with the same spec as your base bid?\n\nMarcus Chen\nApex Construction Group",
             'read' => false, 'daysAgo' => 1],
            ['from' => $sarah, 'to' => $subUsers['DryTech Interiors'], 'project' => $projects['hospital'],
             'subject' => "Drywall Scope Acceleration Request — St. Mary's Hospital",
             'body' => "Hi,\n\nWe'd like to discuss accelerating the drywall scope on floors 2 and 3. Electrical and plumbing rough-in inspections are completing ahead of schedule.\n\nCan you confirm whether you have capacity to accelerate with an additional crew of 6-8 workers?\n\nSarah Mitchell",
             'read' => false, 'daysAgo' => 1],
            ['from' => $subUsers['ProFinish Painting'], 'to' => $david, 'project' => null,
             'subject' => 'Interest in Upcoming Westlake and Cedar Park Projects',
             'body' => "David,\n\nWe wanted to reach out regarding the Westlake Hills Elementary Expansion and Cedar Park Municipal Center projects. ProFinish Painting has extensive experience in both education and government facility painting.\n\nWe would appreciate the opportunity to be considered for ITBs.\n\nBest regards,\nAdmin\nProFinish Painting",
             'read' => true, 'daysAgo' => 5],
            ['from' => $david, 'to' => $subUsers['SitePrep Excavation'], 'project' => $projects['cedar'],
             'subject' => 'Pre-Bid Interest — Cedar Park Municipal Center Site Work',
             'body' => "Hi,\n\nWe are beginning preconstruction on the Cedar Park Municipal Center and wanted to gauge your interest in the site preparation scope before we formally issue ITBs.\n\nThis will include approximately 4 acres of rough grading, underground utilities, and a 180-space parking lot. ITBs expected in May 2026.\n\nDavid Okafor\nApex Construction Group",
             'read' => false, 'daysAgo' => 3],
        ];

        foreach ($msgData as $m) {
            $createdAt = now()->subDays($m['daysAgo']);
            $readAt = $m['read'] ? $createdAt->copy()->addHours(rand(1, 24)) : null;
            Message::create([
                'sender_id'    => $m['from']->id,
                'recipient_id' => $m['to']->id,
                'project_id'   => $m['project'] ? $m['project']->id : null,
                'subject'      => $m['subject'],
                'body'         => $m['body'],
                'read_at'      => $readAt,
                'created_at'   => $createdAt,
                'updated_at'   => $createdAt,
            ]);
        }

        // ─── 12. ACTIVITY LOGS ────────────────────────────────────────────────────
        $logs = [
            ['user' => $marcus, 'company' => $apex,                                       'project' => $projects['downtown'],  'action' => 'project_status_changed', 'description' => 'Project status changed to Bidding — ITBs issued to 8 subcontractors.',                   'metadata' => ['old_status' => 'planning',  'new_status' => 'bidding'],   'daysAgo' => 58],
            ['user' => $sarah,  'company' => $subs['Lone Star Electrical Services'],      'project' => $projects['downtown'],  'action' => 'itb_sent',               'description' => 'Invitation to Bid sent to Lone Star Electrical Services for Electrical scope.',         'metadata' => ['scope' => 'Electrical',     'amount' => 1800000],         'daysAgo' => 57],
            ['user' => $sarah,  'company' => $subs['BlueLine HVAC Systems'],              'project' => $projects['downtown'],  'action' => 'itb_sent',               'description' => 'Invitation to Bid sent to BlueLine HVAC Systems for HVAC scope.',                      'metadata' => ['scope' => 'HVAC',           'amount' => 1500000],         'daysAgo' => 57],
            ['user' => $sarah,  'company' => $subs['Texas Steel Erectors'],               'project' => $projects['downtown'],  'action' => 'itb_sent',               'description' => 'Invitation to Bid sent to Texas Steel Erectors for Structural Steel scope.',           'metadata' => ['scope' => 'Structural Steel','amount' => 2200000],       'daysAgo' => 57],
            ['user' => $david,  'company' => $subs['Ironclad Concrete & Masonry'],        'project' => $projects['downtown'],  'action' => 'itb_sent',               'description' => 'Invitation to Bid sent to Ironclad Concrete & Masonry for Concrete scope.',          'metadata' => ['scope' => 'Concrete',       'amount' => 1600000],         'daysAgo' => 57],
            ['user' => $david,  'company' => $subs['Texas Steel Erectors'],               'project' => $projects['downtown'],  'action' => 'bid_submitted',          'description' => 'Texas Steel Erectors submitted bid of $2,180,000 for Structural Steel scope.',        'metadata' => ['amount' => 2180000,         'timeline_days' => 480],      'daysAgo' => 51],
            ['user' => $david,  'company' => $subs['Ironclad Concrete & Masonry'],        'project' => $projects['downtown'],  'action' => 'bid_submitted',          'description' => 'Ironclad Concrete submitted bid of $1,620,000 for Concrete & Masonry scope.',         'metadata' => ['amount' => 1620000,         'timeline_days' => 420],      'daysAgo' => 49],
            ['user' => $sarah,  'company' => $subs['Lone Star Electrical Services'],      'project' => $projects['downtown'],  'action' => 'bid_submitted',          'description' => 'Lone Star Electrical submitted bid of $1,785,000 for Electrical scope.',              'metadata' => ['amount' => 1785000,         'timeline_days' => 540],      'daysAgo' => 47],
            ['user' => $sarah,  'company' => $subs['BlueLine HVAC Systems'],              'project' => $projects['downtown'],  'action' => 'bid_submitted',          'description' => 'BlueLine HVAC submitted bid of $1,490,000 for HVAC scope.',                           'metadata' => ['amount' => 1490000,         'timeline_days' => 520],      'daysAgo' => 44],
            ['user' => $marcus, 'company' => $subs['Lone Star Electrical Services'],      'project' => $projects['hospital'],  'action' => 'invoice_submitted',      'description' => 'Invoice INV-2026-0009 submitted by Lone Star Electrical for $325,500.',             'metadata' => ['invoice' => 'INV-2026-0009','amount' => 325500],         'daysAgo' => 42],
            ['user' => $marcus, 'company' => $subs['Lone Star Electrical Services'],      'project' => $projects['hospital'],  'action' => 'invoice_approved',       'description' => 'Invoice INV-2026-0009 approved — $325,500 approved for payment.',                   'metadata' => ['invoice' => 'INV-2026-0009','amount' => 325500],         'daysAgo' => 37],
            ['user' => $sarah,  'company' => $subs['Ironclad Concrete & Masonry'],        'project' => $projects['lakeway'],   'action' => 'invoice_paid',           'description' => 'Invoice INV-2026-0021 paid — $714,000 payment issued to Ironclad Concrete.',         'metadata' => ['invoice' => 'INV-2026-0021','amount' => 714000],         'daysAgo' => 35],
            ['user' => $david,  'company' => $subs['Heritage Framing Co.'],               'project' => $projects['meridian'],  'action' => 'invoice_paid',           'description' => 'Invoice INV-2026-0019 paid — $825,000 payment issued to Heritage Framing.',         'metadata' => ['invoice' => 'INV-2026-0019','amount' => 825000],         'daysAgo' => 33],
            ['user' => $marcus, 'company' => $subs['Riverside Mechanical'],               'project' => $projects['meridian'],  'action' => 'bid_submitted',          'description' => 'Riverside Mechanical submitted bid of $1,525,000 for Downtown Tower HVAC.',         'metadata' => ['amount' => 1525000,         'timeline_days' => 530],      'daysAgo' => 32],
            ['user' => $sarah,  'company' => $subs['ClearView Glass & Glazing'],          'project' => $projects['downtown'],  'action' => 'bid_submitted',          'description' => 'ClearView Glass submitted bid of $945,000 for Glazing & Windows scope.',             'metadata' => ['amount' => 945000,          'timeline_days' => 300],      'daysAgo' => 30],
            ['user' => $sarah,  'company' => $apex,                                       'project' => $projects['westlake'],  'action' => 'itb_sent',               'description' => 'ITBs issued to 5 subcontractors for Westlake Hills Elementary Expansion.',           'metadata' => ['itb_count' => 5],                                         'daysAgo' => 28],
            ['user' => $david,  'company' => $subs['Apex Elevators Inc.'],                'project' => $projects['downtown'],  'action' => 'bid_submitted',          'description' => 'Apex Elevators submitted bid of $790,000 for Elevator Installation scope.',          'metadata' => ['amount' => 790000,          'timeline_days' => 360],      'daysAgo' => 27],
            ['user' => $sarah,  'company' => $subs['BlueLine HVAC Systems'],              'project' => $projects['westlake'],  'action' => 'bid_submitted',          'description' => 'BlueLine HVAC submitted bid of $415,000 for Westlake Elementary HVAC.',              'metadata' => ['amount' => 415000,          'timeline_days' => 160],      'daysAgo' => 24],
            ['user' => $sarah,  'company' => $subs['Peak Roofing Systems'],               'project' => $projects['westlake'],  'action' => 'bid_submitted',          'description' => 'Peak Roofing submitted bid of $178,000 for Westlake Elementary Roofing.',            'metadata' => ['amount' => 178000,          'timeline_days' => 45],       'daysAgo' => 23],
            ['user' => $david,  'company' => $subs['Texas Steel Erectors'],               'project' => $projects['lakeway'],   'action' => 'invoice_submitted',      'description' => 'Invoice INV-2026-0022 submitted by Texas Steel Erectors for $535,500.',            'metadata' => ['invoice' => 'INV-2026-0022','amount' => 535500],         'daysAgo' => 14],
            ['user' => $sarah,  'company' => $subs['Texas Steel Erectors'],               'project' => $projects['lakeway'],   'action' => 'invoice_approved',       'description' => 'Invoice INV-2026-0022 approved — $535,500 Tower A steel frame billing.',           'metadata' => ['invoice' => 'INV-2026-0022','amount' => 535500],         'daysAgo' => 9],
            ['user' => $marcus, 'company' => $subs['Summit Plumbing Solutions'],          'project' => $projects['hospital'],  'action' => 'invoice_submitted',      'description' => 'Invoice INV-2026-0011 submitted by Summit Plumbing for $252,000.',                 'metadata' => ['invoice' => 'INV-2026-0011','amount' => 252000],         'daysAgo' => 8],
            ['user' => $marcus, 'company' => $subs['Lone Star Electrical Services'],      'project' => $projects['hospital'],  'action' => 'invoice_submitted',      'description' => 'Invoice INV-2026-0010 submitted by Lone Star Electrical for $325,500.',            'metadata' => ['invoice' => 'INV-2026-0010','amount' => 325500],         'daysAgo' => 24],
            ['user' => $sarah,  'company' => $subs['BlueLine HVAC Systems'],              'project' => $projects['hospital'],  'action' => 'invoice_submitted',      'description' => 'Invoice INV-2026-0013 submitted by BlueLine HVAC for $358,500.',                   'metadata' => ['invoice' => 'INV-2026-0013','amount' => 358500],         'daysAgo' => 3],
            ['user' => $david,  'company' => $subs['Heritage Framing Co.'],               'project' => $projects['meridian'],  'action' => 'invoice_submitted',      'description' => 'Invoice INV-2026-0020 submitted by Heritage Framing for $825,000.',               'metadata' => ['invoice' => 'INV-2026-0020','amount' => 825000],         'daysAgo' => 4],
            ['user' => $marcus, 'company' => $subs['Ironclad Concrete & Masonry'],        'project' => $projects['meridian'],  'action' => 'invoice_approved',       'description' => 'Invoice INV-2026-0018 approved — $945,000 Tower foundations billing.',             'metadata' => ['invoice' => 'INV-2026-0018','amount' => 945000],         'daysAgo' => 19],
            ['user' => $sarah,  'company' => $subs['Lone Star Electrical Services'],      'project' => $projects['meridian'],  'action' => 'invoice_submitted',      'description' => 'Invoice INV-2026-0021 submitted by Lone Star Electrical for $654,000.',            'metadata' => ['invoice' => 'INV-2026-0021','amount' => 654000],         'daysAgo' => 6],
            ['user' => $david,  'company' => $subs['Texas Steel Erectors'],               'project' => $projects['lakeway'],   'action' => 'invoice_submitted',      'description' => 'Invoice INV-2026-0023 submitted by Texas Steel Erectors for $535,500.',            'metadata' => ['invoice' => 'INV-2026-0023','amount' => 535500],         'daysAgo' => 2],
            ['user' => $marcus, 'company' => $apex,                                       'project' => $projects['barton'],    'action' => 'project_status_changed', 'description' => 'Project placed On Hold — permit challenge filed on impervious cover calculations.',  'metadata' => ['old_status' => 'bidding',   'new_status' => 'on_hold'],   'daysAgo' => 21],
            ['user' => $sarah,  'company' => $subs['Heritage Framing Co.'],               'project' => $projects['westlake'],  'action' => 'bid_submitted',          'description' => 'Heritage Framing submitted bid of $572,000 for Westlake Elementary Framing.',       'metadata' => ['amount' => 572000,          'timeline_days' => 120],      'daysAgo' => 2],
            ['user' => $david,  'company' => $subs['Riverside Mechanical'],               'project' => $projects['westlake'],  'action' => 'bid_submitted',          'description' => 'Riverside Mechanical submitted bid of $475,000 for Westlake Elementary Electrical.','metadata' => ['amount' => 475000,          'timeline_days' => 180],      'daysAgo' => 4],
            ['user' => $marcus, 'company' => $subs['BlueLine HVAC Systems'],              'project' => $projects['downtown'],  'action' => 'bid_reviewed',           'description' => 'HVAC bids for Downtown Office Tower reviewed by estimating team.',                  'metadata' => ['bids_reviewed' => 2,        'scope' => 'HVAC'],           'daysAgo' => 16],
            ['user' => $marcus, 'company' => $subs['Lone Star Electrical Services'],      'project' => $projects['hospital'],  'action' => 'contract_signed',        'description' => 'Contract signed with Lone Star Electrical for hospital electrical scope.',          'metadata' => ['amount' => 1085000],                                      'daysAgo' => 259],
            ['user' => $marcus, 'company' => $subs['BlueLine HVAC Systems'],              'project' => $projects['hospital'],  'action' => 'contract_signed',        'description' => 'Contract signed with BlueLine HVAC for hospital HVAC scope.',                       'metadata' => ['amount' => 1195000],                                      'daysAgo' => 259],
            ['user' => $sarah,  'company' => $subs['Heritage Framing Co.'],               'project' => $projects['meridian'],  'action' => 'contract_signed',        'description' => 'Contract signed with Heritage Framing for Meridian framing scope.',                 'metadata' => ['amount' => 2750000],                                      'daysAgo' => 369],
        ];

        foreach ($logs as $l) {
            ActivityLog::create([
                'user_id'     => $l['user']->id,
                'company_id'  => $l['company']->id,
                'project_id'  => $l['project']->id,
                'action'      => $l['action'],
                'description' => $l['description'],
                'metadata'    => $l['metadata'],
                'created_at'  => now()->subDays($l['daysAgo']),
                'updated_at'  => now()->subDays($l['daysAgo']),
            ]);
        }
    }
}
