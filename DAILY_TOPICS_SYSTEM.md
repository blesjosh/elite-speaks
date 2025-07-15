# Daily Topics System Documentation

This document explains how the daily topics system works in Elite Speaks.

## Database Structure

The system uses a table called `speaking_topics` with the following schema:

```sql
CREATE TABLE speaking_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('active', 'scheduled', 'expired', 'drafted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scheduled_for DATE NOT NULL, -- The date this topic becomes active
    expires_at DATE, -- Optional expiration date
    created_by UUID REFERENCES auth.users(id),
    is_generated BOOLEAN DEFAULT false, -- Flag for AI-generated topics
    source TEXT, -- Source of the topic (e.g., 'admin', 'news-api', 'user-suggestion')
    difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    tags TEXT[] -- Array of tags for categorizing topics
);
```

## Key Components

### Admin Interface

1. **Admin Dashboard** (`/dashboard/admin/topics`): 
   - Restricted to users with admin privileges
   - Allows creating, editing, scheduling, and deleting topics
   - Provides a tabbed interface to filter topics by status

### Topic Selection Logic

The system automatically selects the current active topic based on this logic:

1. Look for topics with `status = 'active'`
2. If none are found, look for topics with `status = 'scheduled'` and `scheduled_for <= today`
3. Order by `scheduled_for` descending to get the most recent applicable topic
4. Return the first matching topic

This logic is implemented in a database function called `get_active_topic()`.

### Status Management

Topic statuses automatically update based on dates:

- `scheduled` → `active`: When current date matches or exceeds the scheduled date
- `active` → `expired`: When current date exceeds the expiration date (if set)

This happens via a database trigger that runs the `update_topic_statuses()` function.

## Integrations

### Audio Recorder Component

The `AudioRecorder` component:
1. Fetches and displays the current topic
2. Allows users to record speech on that topic
3. Passes the topic to the evaluation API

### Evaluation API

The `/api/evaluate` endpoint:
1. Receives both the transcript and topic
2. Uses the topic to evaluate how well the user stayed on-topic
3. Generates a `topicAdherence` score from 0-10

## Admin Setup

To set up an admin user:

1. Run the `setup_admin_user.sql` script
2. Execute `SELECT set_initial_admin('your-email@example.com')`

This will grant admin privileges to that user, allowing them to manage topics.

## Future Extensions

### External API Integration

The system is designed to be extended with:

1. **News API Integration**: Automatically generate topics from current news
2. **Scheduled Topic Generation**: Use a cron job to periodically create new topics 
3. **User-Suggested Topics**: Allow users to suggest topics that admins can approve

### Implementation Ideas

To implement automatic topic generation:

1. Create a serverless function (e.g., Vercel Cron Job)
2. Connect it to NewsAPI or similar
3. Use AI to generate speaking prompts from headlines
4. Insert these into the `speaking_topics` table with `is_generated = true`

## Usage Instructions

### For Admins

1. Log in to your account with admin privileges
2. Navigate to `/dashboard/admin/topics`
3. Create topics with meaningful titles, detailed descriptions, and appropriate difficulty levels
4. Set scheduled dates to plan topics in advance

### For Users

1. Navigate to the recording page
2. See the current day's speaking topic
3. Record your speech addressing that topic
4. Get AI feedback that includes how well you stayed on topic
