export function success(data: any) {
  return { success: true, data };
}

export function failure(message: string, errors?: any) {
  return { success: false, message, errors };
}
