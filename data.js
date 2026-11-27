// ============================================================
// data.js — ALL the fake data for your prototype lives here.
//
// There is no database. Everything below is made up, and that is
// on purpose: never put real people's names, emails, phone numbers
// or addresses in this file.
//
// To change what appears on the Explore page, edit LISTINGS.
// Each item is one card. Keep the same fields (id, name, category,
// description) or ask Copilot to add new ones everywhere they're needed.
// ============================================================

const STARTUP = {
  name: "RinkLink",
  tagline: "One league app for scores, stats, and playoff glory.",
  pitch: "RinkLink helps recreational athletes keep every game, player statistic, and playoff bracket in one place so everyone in the league can follow the action."
};

const LISTINGS = [
  { id: 1, name: "Tuesday Night Basketball", category: "Basketball", description: "Track 12 teams, live scores, top scorers, and a 8-team playoff bracket." },
  { id: 2, name: "Riverside Soccer League", category: "Soccer", description: "Follow weekly fixtures, goal leaders, standings, and knockout rounds." },
  { id: 3, name: "Community Volleyball Series", category: "Volleyball", description: "Post set scores, player aces, match results, and tournament seeding." },
  { id: 4, name: "Friday Coed Softball", category: "Softball", description: "Record batting averages, run totals, team standings, and semifinal matchups." },
  { id: 5, name: "Harbour Hockey League", category: "Hockey", description: "Keep goals, assists, penalties, game scores, and playoff brackets up to date." },
  { id: 6, name: "Weekend Tennis Ladder", category: "Tennis", description: "Manage singles rankings, match scores, head-to-head records, and round results." }
];

const TEAM_LOGO_MIME_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

