# Task: gen-strv-anagram-9849 | Score: 100% | 2026-02-13T12:25:51.862427

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')