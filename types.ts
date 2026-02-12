
export enum DeductionCategory {
  GARNISHMENT = 'Garnishment / Court Order',
  LOAN = 'Loan Repayment',
  RETIREMENT = 'Retirement Contribution',
  MEDICAL = 'Medical',
  DENTAL = 'Dental',
  VISION = 'Vision',
  BENEFITS = 'Tax-Advantaged Benefits',
  STATUTORY = 'State Program / Statutory',
  OTHER = 'Generic / Other'
}

export enum DeductionStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive'
}

export interface Deduction {
  id: string;
  planName: string;
  providerName: string;
  category: string;
  subtype: string;
  payrollCode: string;
  status: DeductionStatus;
  isPreTax: boolean;
  createdAt: string;
  employeeCount: number;
}
