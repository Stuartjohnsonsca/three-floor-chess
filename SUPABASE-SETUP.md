# Three-Floor Chess — enabling real accounts (Supabase)

The game works right now in **local mode** (accounts, friends, challenges and Elo
are saved in this browser; open two tabs to play two accounts). To make accounts
real and shared across devices, connect a free Supabase project — about 5 minutes.

## 1. Create the project
1. Go to https://supabase.com → **New project** (pick any name + a password).
2. When it finishes provisioning, open **Project Settings → API** and copy:
   - **Project URL**  (e.g. `https://abcd1234.supabase.co`)
   - **anon public** key

## 2. Paste those into the game
Open `three-floor-chess.html`, find this block near the bottom and fill it in:

```js
window.SUPABASE_CONFIG = {
  url: "https://abcd1234.supabase.co",
  anonKey: "eyJhbGciOi…"        // the anon / public key
};
```

Reload — the sign-in box will now read "Storage: supabase".

## 3. Turn off email confirmation (for instant login)
**Authentication → Providers → Email →** turn **off** "Confirm email" → Save.
(With it on, new users must click an email link before they can play.)

## 4. Create the tables + rules
Open the **SQL Editor**, paste all of the following, and click **Run**:

```sql
-- ---------- tables ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  username_lower text not null unique,
  elo int not null default 1000,
  wins int not null default 0,
  losses int not null default 0,
  draws int not null default 0,
  created_at timestamptz default now()
);
create table public.friend_requests (
  id bigint generated always as identity primary key,
  from_id uuid not null references auth.users(id) on delete cascade,
  from_name text,
  to_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (from_id, to_id)
);
create table public.friends (
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references auth.users(id) on delete cascade,
  since timestamptz default now(),
  primary key (user_id, friend_id)
);
create table public.challenges (
  id bigint generated always as identity primary key,
  from_id uuid not null references auth.users(id) on delete cascade,
  from_name text, from_elo int,
  to_id uuid not null references auth.users(id) on delete cascade,
  to_name text, to_elo int,
  game_type text, status text default 'pending',
  room_code text, created_at timestamptz default now()
);

-- ---------- row-level security ----------
alter table public.profiles        enable row level security;
alter table public.friend_requests enable row level security;
alter table public.friends         enable row level security;
alter table public.challenges      enable row level security;

create policy "profiles_read"   on public.profiles        for select to authenticated using (true);
create policy "profiles_insert" on public.profiles        for insert to authenticated with check (id = auth.uid());
create policy "profiles_update" on public.profiles        for update to authenticated using (id = auth.uid());

create policy "fr_read"   on public.friend_requests for select to authenticated using (to_id = auth.uid() or from_id = auth.uid());
create policy "fr_insert" on public.friend_requests for insert to authenticated with check (from_id = auth.uid());
create policy "fr_delete" on public.friend_requests for delete to authenticated using (to_id = auth.uid() or from_id = auth.uid());

create policy "friends_read"   on public.friends for select to authenticated using (user_id = auth.uid() or friend_id = auth.uid());
create policy "friends_insert" on public.friends for insert to authenticated with check (user_id = auth.uid() or friend_id = auth.uid());
create policy "friends_delete" on public.friends for delete to authenticated using (user_id = auth.uid() or friend_id = auth.uid());

create policy "ch_read"   on public.challenges for select to authenticated using (from_id = auth.uid() or to_id = auth.uid());
create policy "ch_insert" on public.challenges for insert to authenticated with check (from_id = auth.uid());
create policy "ch_update" on public.challenges for update to authenticated using (from_id = auth.uid() or to_id = auth.uid());

-- ---------- realtime (live requests & challenges) ----------
alter publication supabase_realtime add table public.friend_requests, public.challenges, public.friends;
```

## That's it
- **Accounts** — the "Sign in" chip (top-right) → create an account with a username.
- **Friends** — open your profile chip → search a username → Add; they Accept.
- **Challenges** — pick a mode, hit **Challenge** on a friend. They get a live prompt;
  on Accept both are dropped into an online game over the existing peer-to-peer link
  (challenger is White).
- **Elo** — every online challenge is rated (start 1000, K-factor 32); win/lose/draw
  updates both players and the leaderboard.

### Notes
- Live game moves still travel peer-to-peer (PeerJS); Supabase only stores accounts,
  friends, challenges and ratings. No server for you to run.
- Elo is written by each client for its own row. Fine for friendly play; to make it
  tamper-proof, move the rating update into a Postgres RPC / Edge Function later.
- Bot games are **not** rated — only online challenges between two accounts.
