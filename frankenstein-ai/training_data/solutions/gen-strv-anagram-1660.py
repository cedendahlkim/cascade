# Task: gen-strv-anagram-1660 | Score: 100% | 2026-02-17T20:14:17.430740

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')