export interface StaffSummary {
  id: string;
  displayName: string;
  isActive: boolean;
  hasPin: boolean;
  createdAt: string;
}

export interface CreateStaffRequest {
  displayName: string;
  pin: string;
}

export interface UpdateStaffRequest {
  displayName?: string;
  pin?: string;
  isActive?: boolean;
}
