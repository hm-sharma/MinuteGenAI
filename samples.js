// Detailed sample meeting transcripts and their corresponding AI-generated MOM outputs.
// Stored globally to enable zero-setup instant demo mode.

window.MEETING_SAMPLES = [
  {
    id: "sample-sprint-planning",
    title: "Sprint 14 Planning & Architecture Alignment",
    date: "2026-07-30",
    platform: "Google Meet",
    duration: "42 mins",
    organizer: "Sarah Jenkins (Project Manager)",
    attendees: ["Sarah Jenkins", "Alex Rivera (Tech Lead)", "Elena Rostova (UI Designer)", "David Kim (Backend Engineer)"],
    transcript: `Sarah: Alright everyone, let's kick off our Sprint 14 planning. We have a couple of big goals this sprint, primarily launching the new dashboard UI and migrating the database to PostgreSQL. Let's start with Elena on the dashboard designs.
Elena: Hi all! Yes, the Figma files for the dashboard are finalized. I've sent the links to the channel. The focus is on a premium dark mode, with clean glassmorphic card elements, custom HSL-based colored gradients, and smooth slide-in animations. I've also verified the responsive layouts for mobile and tablet.
Alex: Those designs look incredible, Elena. The glassmorphic blur effects might have a small performance hit on older mobile browsers, but we can optimize it using CSS backdrop-filter with a solid fallback.
Sarah: Great. Alex, how does the frontend integration timeline look?
Alex: I can start on the dashboard shell today. We should be able to integrate Elena's design assets by Tuesday. David, do you think the backend APIs for the dashboard stats will be ready by then?
David: Yes, the endpoint structure is already documented in Swagger. I'll write the SQL queries and wrap the endpoints by Friday. However, I have one major callout: the Postgres migration. We scheduled it for Thursday night, but I need to run a dry-run migration on the staging database first to verify the index constraints.
Alex: Good catch, David. Let's set up a staging migration dry-run on Monday. I can assist you with verifying database connection pools on the NestJS side.
Sarah: Perfect. So David, you'll run the staging database dry-run on Monday, August 3rd, and the production migration is scheduled for Thursday, August 6th at 10 PM EST.
David: Yes, that timeline works. I'll need about 2 hours of scheduled downtime for safety, although we aim for zero-downtime.
Sarah: Okay, I'll draft the user maintenance notice and send it out on Wednesday morning.
Elena: Before we move on, I wanted to ask about the feedback widgets. Are we implementing them this sprint or next?
Sarah: Let's push feedback widgets to Sprint 15. We must focus on the core dashboard stability first.
Alex: Agreed.
David: Makes sense.
Sarah: Awesome. Next meeting will be our mid-sprint review on next Wednesday at 10 AM. I think we have a solid plan. Thank you, everyone!`,
    mom: {
      title: "Sprint 14 Planning & Architecture Alignment",
      date: "July 30, 2026",
      platform: "Google Meet",
      duration: "42 minutes",
      organizer: "Sarah Jenkins (Project Manager)",
      attendees: ["Sarah Jenkins", "Alex Rivera (Tech Lead)", "Elena Rostova (UI Designer)", "David Kim (Backend Engineer)"],
      summary: "The meeting successfully aligned the team on Sprint 14 deliverables. The primary focus is the implementation of the new premium dark-mode dashboard designed by Elena, alongside a major backend database migration to PostgreSQL. The team scheduled a staging dry-run database migration on Monday to mitigate risks, with the production deployment planned for Thursday night. Secondary features like feedback widgets were deprioritized to Sprint 15 to ensure system stability.",
      highlights: [
        {
          keyPoint: "Finalized Dashboard Designs",
          description: "Elena presented the finalized Figma designs for the new dashboard. It features a modern dark mode, glassmorphic card layouts, and HSL gradient accents. Responsive layouts are verified, and Alex will implement solid CSS fallbacks to optimize performance for older mobile devices.",
          speaker: "Elena Rostova",
          level: "info"
        },
        {
          keyPoint: "PostgreSQL Production Migration Scheduled",
          description: "Production PostgreSQL migration is locked in for Thursday, August 6th, at 10 PM EST. The process requires a planned 2-hour maintenance window. Sarah will issue a user announcement on Wednesday morning.",
          speaker: "David Kim & Sarah Jenkins",
          level: "critical"
        },
        {
          keyPoint: "Staging Migration Dry-Run",
          description: "To prevent potential index constraint issues, a staging database migration dry-run is scheduled for Monday, August 3rd. David will lead the run, and Alex will assist in verifying the NestJS connection pools.",
          speaker: "David Kim & Alex Rivera",
          level: "warning"
        },
        {
          keyPoint: "Deprioritization of Feedback Widgets",
          description: "The integration of feedback widgets has been postponed to Sprint 15 to ensure undivided focus on core dashboard styling and migration stability.",
          speaker: "Sarah Jenkins",
          level: "info"
        }
      ],
      actionItems: [
        {
          task: "Implement frontend dashboard layout and shell page structures",
          assignee: "Alex Rivera",
          deadline: "Aug 4, 2026",
          status: "pending"
        },
        {
          task: "Run staging database dry-run migration and verify constraint mappings",
          assignee: "David Kim",
          deadline: "Aug 3, 2026",
          status: "pending"
        },
        {
          task: "Verify database connection pooling on NestJS backend",
          assignee: "Alex Rivera",
          deadline: "Aug 4, 2026",
          status: "pending"
        },
        {
          task: "Draft and send user maintenance downtime notice for Thursday migration",
          assignee: "Sarah Jenkins",
          deadline: "Aug 5, 2026",
          status: "pending"
        },
        {
          task: "Develop dashboard statistics backend endpoints and document APIs",
          assignee: "David Kim",
          deadline: "Aug 7, 2026",
          status: "pending"
        }
      ],
      futureActions: [
        {
          event: "Mid-Sprint Review Sync",
          details: "Sync on backend API completion, verify dashboard styling progress, and review staging migration results.",
          date: "Aug 5, 2026 at 10:00 AM"
        },
        {
          event: "Sprint 15 Planning (Feedback Widgets)",
          details: "Begin designs and specifications for the postponed user feedback widgets.",
          date: "Aug 13, 2026"
        }
      ]
    }
  },
  {
    id: "sample-marketing-brainstorm",
    title: "Q3 Product Launch Marketing Strategy",
    date: "2026-07-28",
    platform: "Zoom Video",
    duration: "55 mins",
    organizer: "Marcus Vance (Head of Growth)",
    attendees: ["Marcus Vance", "Clara Zhang (Content Strategist)", "Liam O'Connor (Performance Marketer)", "Siddharth Mehta (Product Manager)"],
    transcript: `Marcus: Hello team, let's dive into our Q3 launch strategy. The product is set to launch on September 1st, which gives us exactly one month for our pre-launch campaign. Clara, how are we looking on the content calendar?
Clara: Hi Marcus. I've outlined a three-tier content campaign. Week 1 is 'The Problem' (focusing on pain points), Week 2 is 'The Reveal' (introducing our AI features), and Week 3 is 'Beta Testimonials'. I need Siddharth's help to get quotes from our top 5 beta users by next Wednesday.
Siddharth: Sure Clara, I can reach out to them today. I have regular syncs with three of our largest beta accounts anyway, so obtaining testimonials and permission to use their logo won't be an issue. I'll get those files to you by Monday afternoon.
Clara: That would be perfect. I also want to run an interactive product preview on LinkedIn. Marcus, did we secure the budget for the short video production?
Marcus: Yes, the budget of $4,500 has been approved. Liam, how are we allocating the paid search and social ads for this pre-launch?
Liam: Thanks Marcus. I propose allocating 60% of the budget to LinkedIn Ads targeting tech decision-makers, and 40% to Google Search Ads to capture high-intent queries. We should start running small A/B test ad creatives starting August 10th to optimize before the big launch. I need the creative assets from Clara by August 7th.
Clara: I'll coordinate with our graphic designer to have three ad sets ready by August 5th, giving you two days to set up.
Liam: Excellent.
Marcus: Siddharth, are there any technical risks that could delay the September 1st launch? We cannot afford to market a delayed product.
Siddharth: The app store reviews are the biggest wildcard. Apple Review has been taking up to 5 days recently. I suggest submitting the build for review no later than August 20th. That gives us a 10-day buffer.
Marcus: Great idea. Siddharth, lock in August 20th as the freeze date for the launch build.
Liam: I'll also set up a custom analytics dashboard in GA4 to track signup conversion rates from our landing page. I will need Siddharth to insert the UTM container script in the website header.
Siddharth: Absolutely. Send me the tracking scripts and I'll deploy it on the staging environment first.
Marcus: Okay, our key target dates: testimonials by Monday (August 3rd), ad assets by August 5th, A/B testing begins August 10th, App Store submission on August 20th, and the official launch on September 1st. Let's do a follow-up check next Monday morning. Thanks team!`,
    mom: {
      title: "Q3 Product Launch Marketing Strategy",
      date: "July 28, 2026",
      platform: "Zoom Video",
      duration: "55 minutes",
      organizer: "Marcus Vance (Head of Growth)",
      attendees: ["Marcus Vance", "Clara Zhang (Content Strategist)", "Liam O'Connor (Performance Marketer)", "Siddharth Mehta (Product Manager)"],
      summary: "The marketing sync established the timeline and budget allocation for the upcoming Q3 Product Launch on September 1st. A 3-week pre-launch campaign starting early August will focus on problem identification, product reveal, and customer testimonials. Budget is approved at $4,500, with 60% assigned to LinkedIn and 40% to Google Search. A strict build freeze and App Store submission date is set for August 20th to buffer against review delays.",
      highlights: [
        {
          keyPoint: "Pre-Launch Content Calendar",
          description: "Clara designed a 3-week content theme strategy. Testimonials from 5 select beta users will be compiled. Siddharth will secure customer quotes and logo usage rights to support the Week 3 testimonial phase.",
          speaker: "Clara Zhang & Siddharth Mehta",
          level: "info"
        },
        {
          keyPoint: "Advertising Budget Allocation & A/B Testing",
          description: "A total budget of $4,500 is allocated: 60% on LinkedIn Ads for B2B targeting, and 40% on Google Search Ads. Dynamic A/B testing will commence on August 10th using assets provided by Clara on August 5th.",
          speaker: "Liam O'Connor & Clara Zhang",
          level: "info"
        },
        {
          keyPoint: "App Store Submission Strategy & Code Freeze",
          description: "To prevent delays from Apple's review process, Siddharth will freeze the launch build and submit it for App Store review on August 20th, providing a 10-day buffer before the September 1st release.",
          speaker: "Siddharth Mehta",
          level: "critical"
        },
        {
          keyPoint: "Launch Campaign Analytics",
          description: "Liam will create a GA4 tracking container to measure landing page conversions. Siddharth will deploy the UTM tracking script in the header of the staging website for testing.",
          speaker: "Liam O'Connor & Siddharth Mehta",
          level: "warning"
        }
      ],
      actionItems: [
        {
          task: "Gather testimonials and logo release consent from top 5 beta users",
          assignee: "Siddharth Mehta",
          deadline: "Aug 3, 2026",
          status: "pending"
        },
        {
          task: "Design and deliver three sets of promotional social and search ad creatives",
          assignee: "Clara Zhang",
          deadline: "Aug 5, 2026",
          status: "pending"
        },
        {
          task: "Configure LinkedIn and Google Ads campaigns and begin A/B creative testing",
          assignee: "Liam O'Connor",
          deadline: "Aug 10, 2026",
          status: "pending"
        },
        {
          task: "Submit finalized app builds to iOS App Store and Google Play for review",
          assignee: "Siddharth Mehta",
          deadline: "Aug 20, 2026",
          status: "pending"
        },
        {
          task: "Set up Google Analytics 4 goals and provide header tracking scripts",
          assignee: "Liam O'Connor",
          deadline: "Aug 4, 2026",
          status: "pending"
        }
      ],
      futureActions: [
        {
          event: "Launch Marketing Weekly Sync",
          details: "Review testimonials collected, finalize social copies, and check status of graphic design deliverables.",
          date: "Aug 3, 2026 at 9:30 AM"
        },
        {
          event: "GA4 Tracking Review & Staging Test",
          details: "Verify that UTM campaign tags are logging data correctly in the staging sandbox.",
          date: "Aug 12, 2026"
        },
        {
          event: "Official Q3 Product Launch Day",
          details: "Press release dissemination, email newsletters blast, and full activation of high-budget campaign ads.",
          date: "Sep 1, 2026"
        }
      ]
    }
  }
];
