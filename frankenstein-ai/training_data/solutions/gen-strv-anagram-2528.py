# Task: gen-strv-anagram-2528 | Score: 100% | 2026-02-14T12:05:24.789642

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')