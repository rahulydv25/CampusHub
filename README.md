# CampusHub - College Academic Resource Portal

A centralized academic resource-sharing platform for engineering college students. Discover, upload, organize, and download academic resources including notes, previous-year question papers (PYQs), laboratory manuals, assignments, and more.

## 🎯 Project Overview

CampusHub is a student-built web application designed to solve a genuine college problem - the difficulty of finding and sharing academic materials. The platform allows students to:

- Browse and download approved academic resources
- Upload their own study materials for community sharing
- Track contribution points and compete on the leaderboard
- Stay updated with exam dates and college announcements
- Filter resources by semester, department, subject, and category

## 🛠️ Technology Stack

**Frontend:**
- HTML5 - Page structure and markup
- CSS3 - Styling and responsive design
- Vanilla JavaScript - Interactivity and functionality

**Backend:**
- Supabase Auth - User authentication and session management
- Supabase PostgreSQL - Database for persistent data storage
- Supabase Storage - File storage for PDF uploads
- Row Level Security (RLS) - Database access control

**Deployment:**
- Vercel or Netlify (static hosting)

## 📁 Project Structure

```
campushub/
├── index.html              # Welcome page
├── home.html               # Main dashboard
├── resources.html          # Resource library
├── upload.html             # Upload form
├── leaderboard.html        # Contributor rankings
├── calendar.html           # Academic calendar
├── login.html              # Login page
├── register.html           # Registration page
├── admin.html              # Admin dashboard
├── css/
│   ├── style.css           # Design system and base styles
│   ├── components.css      # Component-specific styles
│   └── responsive.css      # Mobile and tablet responsiveness
├── js/
│   ├── config.js           # Application configuration
│   ├── auth.js             # Authentication logic
│   ├── resources.js        # Resource browsing and search
│   ├── upload.js           # File upload handling
│   ├── leaderboard.js      # Leaderboard and points
│   ├── calendar.js         # Calendar events
│   ├── admin.js            # Admin dashboard
│   └── main.js             # Utility functions
├── assets/
│   ├── logo.svg            # CampusHub logo
│   └── icons/
│       └── logo-icon.svg   # Navigation logo
└── supabase/
    ├── schema.sql          # Database schema
    └── policies.sql        # Row Level Security policies
```

## 🚀 Setup Instructions

### Prerequisites
- A Supabase account (free tier works)
- Basic knowledge of HTML, CSS, and JavaScript
- A code editor (VS Code recommended)

### Step 1: Set Up Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up for a free account
2. Create a new project
3. Wait for the project to be provisioned (2-3 minutes)
4. Go to Project Settings → API
5. Copy your project URL and anon key

### Step 2: Configure Database

1. In Supabase, go to SQL Editor
2. Open `supabase/schema.sql` from this project
3. Run the SQL script to create database tables
4. Open `supabase/policies.sql` from this project
5. Run the SQL script to set up security policies

### Step 3: Configure Storage

1. In Supabase, go to Storage
2. Create a new bucket named `resources`
3. Make the bucket public (for approved resources)
4. Set up storage policies (can be done via SQL or UI)

### Step 4: Update Configuration

1. Open `js/config.js`
2. Replace `YOUR_SUPABASE_PROJECT_URL` with your Supabase project URL
3. Replace `YOUR_SUPABASE_ANON_KEY` with your Supabase anon key

```javascript
const SUPABASE_CONFIG = {
  url: 'https://your-project.supabase.co',
  anonKey: 'your-anon-key-here',
};
```

### Step 5: Add Supabase Client Library

Add this to the `<head>` section of all HTML files (before other scripts):

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### Step 6: Test Locally

1. Open `index.html` in your browser
2. Navigate through the pages
3. Test registration and login
4. Try uploading a resource (requires backend implementation)

## 📦 Deployment

### Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to project directory: `cd campushub`
3. Run: `vercel`
4. Follow the prompts
5. Your site will be live at `https://your-project.vercel.app`

### Deploy to Netlify

1. Install Netlify CLI: `npm i -g netlify-cli`
2. Navigate to project directory: `cd campushub`
3. Run: `netlify deploy --prod`
4. Follow the prompts
5. Your site will be live at `https://your-project.netlify.app`

## 🔐 Security Features

- **Row Level Security (RLS):** Database-level access control
- **Role-based Authorization:** Students and admins have different permissions
- **Secure File Storage:** Pending and rejected files are private
- **Input Validation:** Client and server-side validation
- **No Hardcoded Secrets:** Credentials stored in environment variables
- **Protected Admin Actions:** Only admins can approve resources and manage content

## 📊 Database Schema

### Tables:
- **profiles:** User information linked to Supabase Auth
- **colleges:** College information (supports multi-college future)
- **subjects:** Subject catalog organized by department and semester
- **resources:** Academic resource files and metadata
- **contribution_points:** Points awarded for approved contributions
- **notices:** Official college announcements
- **academic_events:** Exam dates, deadlines, and events

### Key Relationships:
- Resources belong to subjects and colleges
- Resources are uploaded by users (profiles)
- Points are awarded to users for specific resources
- Events and notices are college-specific

## 🏆 Point System

| Resource Type | Points |
|--------------|--------|
| Class Notes | 10 |
| Previous Year QP | 15 |
| Lab Manual | 10 |
| Assignment | 5 |
| Other | 5 |

**Rules:**
- Points awarded only after admin approval
- Each resource earns points only once
- Duplicate or rejected resources earn zero points
- Points cannot be modified by users

## 🎨 Design Philosophy

CampusHub follows a clean, functional design inspired by:
- **Notion:** Minimal organization and typography
- **Moodle:** Academic navigation structure
- **Student platforms:** Resource discovery patterns

**Color Palette:**
- Navy Blue (#1e3a5f) - Primary
- White (#ffffff) - Backgrounds
- Light Blue (#e8f4fc) - Accents

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers (1200px+)
- Tablets (768px - 1199px)
- Mobile phones (< 768px)

## 🧪 Testing Checklist

Before declaring the project complete, verify:

- [ ] Welcome page loads and redirects to home
- [ ] User can register and login
- [ ] Approved resources persist after refresh
- [ ] Search and filters return appropriate results
- [ ] User can upload a valid PDF
- [ ] Uploaded resource shows as pending
- [ ] Regular user cannot approve resources
- [ ] Admin can approve/reject submissions
- [ ] Points are awarded correctly after approval
- [ ] Leaderboard displays accurate rankings
- [ ] Calendar shows upcoming events
- [ ] Notices display correctly
- [ ] Website works on desktop and mobile
- [ ] All buttons are functional
- [ ] Error messages are clear

## 📝 Development Plan

**Day 1 (Completed):** Frontend
- ✅ Design system and logo
- ✅ All page layouts
- ✅ Responsive styling
- ✅ JavaScript structure

**Day 2:** Backend
- Configure Supabase
- Set up database tables
- Implement authentication
- Add RLS policies
- Connect resource retrieval

**Day 3:** Core Functionality
- Implement PDF uploads
- Admin approval system
- Points and leaderboard
- Calendar and notices
- Verify persistence

**Day 4:** Testing & Delivery
- Test all workflows
- Fix bugs
- Deploy website
- Prepare demo data
- Final documentation

## 🤝 Contributing

This is a college mini-project. For contributions:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

This project is created for educational purposes.

## 👥 Authors

- Student Name (Your Name)
- College Name (Your College)

## 🙏 Acknowledgments

- Supabase for providing the backend infrastructure
- College mentors for guidance and support
- Fellow students for testing and feedback

## 📞 Support

For questions or issues:
- Check the README documentation
- Review Supabase documentation at [supabase.com/docs](https://supabase.com/docs)
- Contact project maintainers

---

**Built with ❤️ by students, for students**
