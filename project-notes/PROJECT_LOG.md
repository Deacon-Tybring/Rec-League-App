# Project log

Keep this up to date as you go — a few lines per work session is enough. It's much harder to reconstruct at the end.

Did not see that I had to do this during each session as I started this project last minute because I did not know how close the due date was. I can not find a good majority of my session history so I will be paraphasing for this section of the assignment. I understanding this was not what was asked of me but, I am doing it so I have something written down for this part.

**Team name:**

Deacon Tybring

**Startup name:**

RinkLink

**Live site link:**

https://supreme-space-guide-96wppwgwgwqpf7r6p-3000.app.github.dev/

---

## Work sessions

Copy this block for each session.

1 Session — Nov 26 — driver: Deacon

- **Goal for this session:**

To fix the preview option in Github as it wasn't working.

- **Key prompts we gave Copilot** (paste the important ones):

  1. Why won't the preview option explained in the README.md work?
  2. Why am I getting an error pop up when using the preview extention?

- **What worked:**

Downloading the microsoft preview extention.

- **What broke, and how we fixed it:**

The extention when opened came up with an error message and after consulting the AI agent it suggested openning the link in my browser via the port and after openning that way the preview worked.

- **Committed?** yes — commit message: Set up app and fixed preview

2 Session — Nov 26 — driver: Deacon

- **Goal for this session:**

Create the League with features such as a team and player list.

- **Key prompts we gave Copilot** (paste the important ones):
  1. Create the team list on a seperate page.

- **What worked:**

Creating the team list.

- **What broke, and how we fixed it:**

When creating the team list it just put it underneath the team on the league page and I wanted on a seperate page so after asking the agent to do so it did.

- **Committed?** yes — commit message: Added the League Team and Player options

3 Session — Nov 27 — driver: Deacon

- **Goal for this session:**

Create a league schedule

- **Key prompts we gave Copilot** (paste the important ones):
  1. In the league schedule page make it so when I press on a game it allows me to enter a new page called the game page
  2.I want to move the games that you press to open the game page above the add a game feature on the league schedule page

- **What worked:**

Creating the league schedule page.

- **What broke, and how we fixed it:**

The game list when you clicked to enter a games page appeared under the add a game option and I wanted it above so I asked the AI agent to make that change and it did.

- **Committed?** yes — commit message: Created the League Schedule

4 Session — Nov 27 — driver: Deacon

- **Goal for this session:**

Create syncing stats that pulled right from the games

- **Key prompts we gave Copilot** (paste the important ones):
  1.In the team page instead of entering the goals and assists I want to populate them by adding up the goals and assist of the player from each game
  2.In the team page instead of entering the Saves and GA I want to populate them by adding up the goals and assist of the player from each game

- **What worked:**

Getting the stats to pull from the games rather than manual entry

- **What broke, and how we fixed it:**

At first I had to manually input each stat but after asking the AI to make it so the stats automatically pull from the games so it made that change and it worked.

- **Committed?** yes — commit message: Created Syncing Statistics and League Standings as well as a functioning league schedule.

---

## Things that broke (running list)

| Date | What went wrong | What we tried | What finally fixed it |
| Nov 26 | Preview would not work | Asking the AI why it would not work | Downloading the preview extention and openning the website in my browser|
| Nov 27 | Several formating issues | Asking the AI to put certain things relative to another | Asking the AI to put the item in the same row as another item and either to the right or left of it |
| Nov 27 | When I wanted a feature to open to a new page when an item was clicked and instead the feature was placed directly under the item pressed to open it | Make "feature" open when I click "Field" | Make "Feature" open a new page when I click "Field" |


## What a real version would need

Everything we wanted but faked or left out — real logins, a real database, payments, security, moderation, an app, staff, etc. For each one, say **why** it's needed and roughly **how hard or expensive** you think it would be.

| Feature we faked or skipped | Why a real company would need it | How hard / expensive? |

| I skipped the ads on my product | A real company would need this as a revenue source | It would be extremely difficult to get ad revenue from companies that would appeal to my products demographic|

| I faked a real database / login  | A real company would need this to store each users league seperate from each other | This would be somewhat expensive as I would have to rent cloud space from another company |

## Reflection (fill in at the end)

1. What surprised you most about building software with AI?

How specific you have to be to achieve your vision. AI was very good and capable of a lot of cool features but it was horrible and creating a good UI and often times you had to be very specific with it to get what you wanted.

2. Which parts were easy, and which were hard? Why do you think that is?

The information syncing and auto population of information was easy. Creating a bareable UI was hard.

3. If a competitor had the same AI tool, how long would it take them to copy your site?

A competitor using the same AI tool could probably replicate my site in 30mins - 3 hours.
