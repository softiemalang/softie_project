# 스케줄러 단골 명단

단골 자동 매칭은 기존 예약의 `other` 태그(화면 표시: `단골`)를 재사용한다. 활성 명단의 `name_key`와 `phone_last4`가 모두 정확히 일치할 때만 예약에 `regular_id`를 저장한다. 번호는 예약 목록과 카드에 표시하지 않는다.

활성 단골이 없을 때도 같은 소유자의 저장된 예약 중 현재 예약을 제외하고, 정규화된 이름과 `phone_last4`가 모두 일치하면 재예약으로 `other` 태그를 자동 선택한다. 이 경우 기존 예약의 `regular_id`를 복사하지 않고, 저장 시 단골 행을 소유자·이름·번호로 안전하게 get-or-create한 뒤 새 예약에 연결한다.

`name_key` 정규화는 앱과 DB에서 동일하게 Unicode NFKC → 앞뒤 공백 제거 → 내부 Unicode 공백을 ASCII 한 칸으로 축약 → ASCII 영문 대문자만 소문자화 순서다. `phone_last4`는 문자열이며 ASCII 숫자 정확히 4자리다.

번호가 없는 수동 `단골` 선택은 태그만 저장하고 단골 행은 만들지 않는다. 번호 4자리가 있는 최종 `단골` 선택은 `save_scheduler_reservation_with_regular` RPC가 단골 생성/비활성 행 재활성화/예약 저장을 한 트랜잭션에서 수행한다. 따라서 단골 생성에 실패하면 예약도 저장되지 않는다. 수동으로 태그를 해제하면 자동 결과보다 우선하며 기존 단골 행은 삭제하거나 비활성화하지 않는다.

현재 작업의 `scheduler_regular_save_rpc` migration은 승인된 Supabase migration workflow로 대상 프로젝트에 적용되어 있다. 원격 migration history와 RPC 권한을 read-only로 재확인하고, 실제 명단 행 삽입은 수행하지 않는다.

후속 원격 적용 절차는 별도 승인 후 `supabase link --project-ref <project-ref>`로 대상 프로젝트를 확인하고 `supabase db push`를 실행한 다음, migration history와 RPC 권한을 read-only로 재확인하는 순서다.

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
