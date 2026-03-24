export interface User {
  id: number;
  name: string;
  email: string;
  role: 'gc_admin' | 'gc_member' | 'sub_admin' | 'sub_member';
  phone: string | null;
  job_title: string | null;
  company_id: number;
  company: Company;
}

export interface Company {
  id: number;
  name: string;
  type: 'general_contractor' | 'subcontractor';
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  license_number: string | null;
  established_year: number | null;
  employee_count: number | null;
}
