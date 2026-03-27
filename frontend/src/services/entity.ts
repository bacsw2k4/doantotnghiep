export interface Role {
  id: number;
  name: string; 
  description?: string;
}

export interface User {
  userId: string;
  email: string;
  phone: string;
  address: string;
  fullName: string;
  avatar?: string;
  role: Role; 
  status: "active" | "inactive";
  joinDate: string;
  totalOrders: number;
  totalSpent: string;
}

export interface UserFormData {
  role_id: number;
  firstname: string;
  lastname: string;
  address?: string;
  phone: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface UserToManage {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  roleId: number; 
  status: "active" | "inactive";
}

export interface LoginFormData {
  email: string;
  password: string;
}