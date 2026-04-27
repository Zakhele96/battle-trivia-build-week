import api from "./axios";

export async function createPayFastSupporterCheckout(planCode = "supporter-monthly") {
  const { data } = await api.post("/support/payfast/subscribe", { planCode });
  return data;
}
