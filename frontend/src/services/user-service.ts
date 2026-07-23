import { fetchApi } from "@/lib/api-client";

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: "Administrator" | "NOC Operator" | "User Only" | string;
  organization: string;
  is_active: boolean;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  full_name: string;
  password: string;
  role: string;
  organization?: string;
}

export async function fetchUsers(): Promise<UserAccount[]> {
  return fetchApi<UserAccount[]>("/auth/users");
}

export async function createUser(payload: CreateUserPayload): Promise<UserAccount> {
  return fetchApi<UserAccount>("/auth/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateUser(
  userId: string,
  payload: Partial<CreateUserPayload & { is_active: boolean }>
): Promise<UserAccount> {
  return fetchApi<UserAccount>(`/auth/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(userId: string): Promise<{ message: string }> {
  return fetchApi<{ message: string }>(`/auth/users/${userId}`, {
    method: "DELETE",
  });
}
