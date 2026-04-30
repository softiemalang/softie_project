-- saju_profiles 테이블에 로그인한 유저를 연결하기 위한 user_id 컬럼 추가
alter table public.saju_profiles
add column if not exists user_id text;

-- 비로그인 상태 유지를 위해 local_key 제약조건을 완화하지 않고 그대로 유지합니다.
-- 대신 user_id에 대한 유니크 인덱스를 추가하여 1명당 1개의 프로필만 가지도록 합니다.
create unique index if not exists saju_profiles_user_id_idx on public.saju_profiles (user_id) where user_id is not null;
