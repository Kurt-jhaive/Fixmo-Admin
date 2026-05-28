Hi Claude! I am currently in a rush and need your help setting up an AI chatbot feature for my project's admin website. Here is the context:

1. **Project Structure:** It's a decoupled setup. I have a `FixMo Admin Website` (Frontend netxjs) that fetches data via API from a completely separate `Backend` repository (built with Node.js).
2. **Goal:** I want to create an AI chatbot inside the Admin Website where admins can ask natural language questions (e.g., "Ilan yung hindi pa approve sa site?", "Magkano ang total sales ngayon?"). For now, the bot mostly needs to handle data fetching/inquiries.
3. **Tech Stack:** I want to use the **Gemini API** (`gemini-2.5-flash`) on the frontend/admin side to power this chatbot.

I have created a Markdown file containing my backend API definitions and system rules. 

Please read the attached `.md` file (or the text below) and help me generate:
1. The frontend chatbot UI component and the integration code for the Gemini API.
2. How to pass this markdown file efficiently as a `systemInstruction` to Gemini so it accurately translates admin questions into the right API calls.

Here is my Markdown reference:

---
(API_DOCUMENTATION_CONTROLLER_BASED.md)
---

