# Task: gen-strv-anagram-8750 | Score: 100% | 2026-02-13T21:48:51.296445

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')