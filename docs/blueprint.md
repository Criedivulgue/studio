# **App Name**: WhatsAi

## Core Features:

- AI Chat Routing: Dynamically route user chats to the appropriate AI configuration based on the assigned admin. This feature identifies the chat owner based on the URL (e.g., `https://app.com/chat/{adminUid}`) and retrieves the corresponding AI settings to generate a relevant response. A tool helps determine whether to integrate custom user information to produce better support conversations.
- Admin-Specific AI Configuration: Enable admins to configure their personal AI assistant via a dedicated settings page (`/admin/ai-config`). These configurations are isolated and only apply to chats initiated through the admin's unique link.
- Corporate Broadcasting System: Implement a multi-channel (email, WhatsApp, push notifications) broadcasting system that allows the Super Admin to send announcements, updates, and marketing campaigns to all users or specific segments based on defined criteria.
- Super Admin Broadcast Management: Provide the Super Admin with tools to create, schedule, and monitor broadcasts, including setting target criteria and reviewing statistics.
- Personal Dashboard: Admin users will have access to their metrics, contacts and chat histories.
- Contact Management: Contact list, enabling import and export of users as well as user groups. Support also available via chat or phone.

## Style Guidelines:

- Primary color: Deep blue (#3F51B5) to convey trust and reliability, essential for a customer service platform. This color represents stability and professionalism.
- Background color: Light blue (#E8EAF6), a very desaturated version of the primary color, to provide a calming and unobtrusive backdrop that complements the dark scheme.
- Accent color: Purple (#116023), an analogous color to the primary, will be used sparingly for interactive elements, adding a touch of sophistication without overwhelming the interface.
- Body font: 'PT Sans', a humanist sans-serif to promote readability across various devices. Headline font: 'Space Grotesk', for a modern, digital feel.
- Use consistent and professional icons to represent different features and actions within the platform, such as chat, broadcast, and user management. Focus on clarity and ease of recognition.
- Maintain a clean and structured layout with clear divisions between sections. Utilize white space effectively to prevent clutter and enhance the user experience. Prioritize key information and actions with appropriate visual hierarchy.
- Implement subtle animations to provide feedback and enhance engagement, such as loading spinners during AI processing, smooth transitions between sections, and subtle hover effects on interactive elements. Avoid excessive or distracting animations.