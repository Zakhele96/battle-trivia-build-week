import api from "./axios";

export async function getTriviaExplanation(roundId) {
  const response = await api.post(
    `/ai/trivia/rounds/${roundId}/explanation`
  );

  return response.data;
}
