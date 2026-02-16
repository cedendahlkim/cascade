# Task: gen-strv-anagram-1469 | Score: 100% | 2026-02-13T09:20:46.730838

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')