export const DEFAULT_PROMPT = `Group the following tabs thematically based on their titles and hostnames. 
Return a JSON object with this exact structure:
{
  "groups": [
    {
      "tabIndices": [0, 1, 3],
      "groupName": "Social Media",
      "color": "blue",
    }
  ]
}

Rules:
- tabIndices: array of indices (0-based) of tabs that belong to this group
- groupName: descriptive name for the group
- color: must be one of 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange', 'grey'
- Only create groups with 2 or more tabs

Consider these themes:
- Social media sites (Twitter, Facebook, Instagram, LinkedIn, Reddit)
- Development tools and documentation (GitHub, Stack Overflow, MDN)
- AI/ML platforms (OpenAI, Claude, Gemini, ChatGPT)
- Google services (Gmail, Drive, Docs, YouTube)
- Media and entertainment (YouTube, Netflix, Twitch)
- E-commerce and shopping (Amazon, eBay, shopping sites)
- News and information sites
- Work and productivity tools

----

Tabs:\n{tabs}`;
