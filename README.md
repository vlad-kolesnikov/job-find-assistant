## Job Find Assistant

A personal AI-powered job search manager.

Job Find Assistant helps you stay organized during your job hunt:

🗂 Application Tracker – manage job applications across multiple platforms.

🧾 Resume Builder – craft and refine your resume for each position.

🤖 AI Interview Coach – practice and improve your interview skills via STAR presentation.

📬 AI Mail Agent – monitor and analyze job responses.

📅 Calendar – Track interviews.

![UI Screenshot](.public/images/Screenshot1.png)
> Application tracker screenshot


## Project info

**URL**: https://job-find-assistant.lovable.app

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## What is the testing approach?

- UI/UX test using Playwright/Type Script
- API testing using Playwright/Type Script

## Feature 1: Authentication

**User Story**

When a new user visits the site, they’re greeted with a registration and login form.
As a user,
I want to log in to the application using my email and password and Google OAuth provider,
so that my progress and data — including applications, notes, and goals — are saved and available next time I log in.

**Acceptance Criteria**
When a new user visits the site, they’re greeted with a registration and login form.

The user can register using email and password.

The user can register with Google

After registration user should login and see the management dashboard.

An authenticated user can manage data on website:

After logout, the user’s data remains stored.

Unauthenticated users cannot access the dashboard.

