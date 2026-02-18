# Task: gen-strv-anagram-7578 | Score: 100% | 2026-02-17T20:00:30.873829

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')