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
  crew_wins: number;
  created_at: string;
};

export type CrewMatchRow = {
  id: string;
  game_type_id: string;
  status: "open" | "active" | "completed" | "cancelled";
  challenger_crew_id: string;
  opponent_crew_id: string | null;
  winner_crew_id: string | null;
  join_code: string;
  created_by: string;
  accepted_by: string | null;
  created_at: string;
  completed_at: string | null;
  game_types: { name: string } | null;
  challenger_crew: { name: string } | null;
  opponent_crew: { name: string } | null;
};

export type CrewMatchParticipantRow = {
  id: string;
  crew_match_id: string;
  user_id: string;
  crew_id: string;
  joined_at: string;
  users: { username: string; avatar_url: string | null } | null;
  crews: { name: string } | null;
};

export type CrewMemberRow = {
  id: string;
  crew_id: string;
  user_id: string;
  role: "captain" | "member";
  users: { username: string; wins: number } | null;
};

export type EventRow = {
  id: string;
  name: string;
  join_code: string;
  created_by: string;
  city: string | null;
  created_at: string;
};

export type EventMemberRow = {
  id: string;
  event_id: string;
  user_id: string;
  is_active: boolean;
  joined_at: string;
  events: EventRow | null;
  users: { username: string } | null;
};

export type UserAchievementRow = {
  id: string;
  user_id: string;
  achievement: string;
  earned_at: string;
};
