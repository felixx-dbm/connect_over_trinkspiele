export type UserRow = {
  id: string;
  username: string;
  city: string | null;
  avatar_url: string | null;
  wins: number;
  losses: number;
  birth_date: string;
  created_at: string;
};

export type MatchRow = {
  id: string;
  game_type_id: string;
  mode: "solo" | "crew" | "regional";
  status: "open" | "active" | "completed" | "cancelled";
  city: string | null;
  challenger_id: string;
  opponent_id: string | null;
  winner_id: string | null;
  created_at: string;
  completed_at: string | null;
  game_types: { name: string } | null;
  challenger: { username: string } | null;
  opponent: { username: string } | null;
};

export type CrewRow = {
  id: string;
  name: string;
  city: string | null;
  invite_code: string;
  captain_id: string;
  created_at: string;
};

export type CrewMemberRow = {
  id: string;
  crew_id: string;
  user_id: string;
  role: "captain" | "member";
  users: { username: string; wins: number } | null;
};
