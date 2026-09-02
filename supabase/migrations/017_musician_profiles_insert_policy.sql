-- Migration: 017_musician_profiles_insert_policy.sql
-- Created: 2026-09-02

-- musician_profiles had select/update policies but no insert policy, so
-- upsertMusicianProfile() (used by /ayarlar) failed with 403 for any user
-- who didn't already have a musician_profiles row (e.g. never finished
-- onboarding in the mobile app).

create policy "Owner can insert own musician profile" on musician_profiles for insert with check (auth.uid() = user_id);
