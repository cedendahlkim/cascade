# Task: gen-strv-anagram-2430 | Score: 100% | 2026-02-13T17:36:31.701987

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')