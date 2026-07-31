// API Service pointing to local FastAPI backend.
// Routes text data to backend proxy endpoints to keep Gemini credentials secure.

window.GeminiMOMService = {
  /**
   * Generates Minutes of Meeting (MOM) from a transcript via the FastAPI backend proxy.
   * @param {Object} params
   * @param {string} params.transcript - Raw meeting transcript text.
   * @param {string} [params.model="gemini-3.5-flash"] - Gemini model to use.
   * @param {string} [params.style="professional"] - Brief tone profile.
   * @param {Object} [params.metadata={}] - Title, Platform, Date.
   * @returns {Promise<Object>} The structured MOM output.
   */
  async generateMOM({ transcript, model = "gemini-3.5-flash", style = "professional", metadata = {} }) {
    const apiBaseUrl = window.CONFIG?.API_BASE_URL || "http://localhost:8000";
    const endpoint = `${apiBaseUrl}/api/generate`;

    if (!transcript || transcript.trim().length < 50) {
      throw new Error("Transcript text is too short. Please provide a substantial dialogue.");
    }

    const requestBody = {
      transcript,
      model,
      style,
      title: metadata.title || null,
      platform: metadata.platform || null,
      date: metadata.date || null
    };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || `HTTP error ${response.status}`;
        throw new Error(`API Proxy Error: ${errorMessage}`);
      }

      return await response.json();
    } catch (error) {
      console.error("FastAPI Backend call failed:", error);
      throw error;
    }
  }
};
