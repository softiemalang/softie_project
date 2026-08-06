# 스케줄러 단골 명단

단골 자동 매칭은 기존 예약의 `other` 태그(화면 표시: `단골`)를 재사용한다. 활성 명단의 `name_key`와 `phone_last4`가 모두 정확히 일치할 때만 예약에 `regular_id`를 저장한다. 번호는 예약 목록과 카드에 표시하지 않는다.

`name_key` 정규화는 앱과 DB에서 동일하게 Unicode NFKC → 앞뒤 공백 제거 → 내부 Unicode 공백을 ASCII 한 칸으로 축약 → ASCII 영문 대문자만 소문자화 순서다. `phone_last4`는 문자열이며 ASCII 숫자 정확히 4자리다.

원격 적용 전에는 먼저 migration을 검토한 뒤, 현재 인증 사용자 세션으로 Supabase migration을 적용한다. 실제 명단 행은 이 저장소에 삽입하지 않는다.

예시(현재 사용자 소유 키를 사용):

```sql
insert into public.scheduler_regulars
  (owner_key, display_name, name_key, phone_last4, memo)
values
  (auth.uid()::text, '홍 길동', public.normalize_scheduler_regular_name('홍 길동'), '0032', '선택 메모');

update public.scheduler_regulars
set display_name = '홍길동',
    name_key = public.normalize_scheduler_regular_name('홍길동'),
    phone_last4 = '0032',
    memo = '변경 메모'
where id = '00000000-0000-0000-0000-000000000000'::uuid
  and owner_key = auth.uid()::text;

update public.scheduler_regulars
set is_active = false
where id = '00000000-0000-0000-0000-000000000000'::uuid
  and owner_key = auth.uid()::text;
```
