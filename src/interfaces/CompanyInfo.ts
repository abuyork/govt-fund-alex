export interface CompanyInfo {
  // Basic company information
  companyName: string;
  ceoName: string;
  businessNumber: string;
  foundingDate: string;
  industry: string;
  employeeCount: number;
  address: string;
  contactPhone: string;
  contactEmail: string;
  
  // Optional company details
  revenue?: number;
  description?: string;
  
  // Product/service information
  itemName?: string;
  itemDescription?: string;
  uniquePoint?: string;
  targetMarket?: string;
  
  // Legacy support for other naming conventions
  foundYear?: string;
  companySize?: string;
  
  // Allow for additional properties
  [key: string]: string | number | boolean | undefined;
} 