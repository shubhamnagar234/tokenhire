export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(endpoint, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    const errMsg =
      typeof data.error === "string"
        ? data.error
        : Array.isArray(data.error)
          ? data.error.map((e: { message: string }) => e.message).join(", ")
          : "Request failed";
    throw new Error(errMsg);
  }

  return data;
}
