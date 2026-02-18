# Task: gen-strv-anagram-7692 | Score: 100% | 2026-02-17T20:14:15.697287

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')