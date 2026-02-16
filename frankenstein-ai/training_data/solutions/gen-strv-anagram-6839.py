# Task: gen-strv-anagram-6839 | Score: 100% | 2026-02-13T13:11:42.143010

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')