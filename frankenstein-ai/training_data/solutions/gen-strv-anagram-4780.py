# Task: gen-strv-anagram-4780 | Score: 100% | 2026-02-14T12:04:34.314956

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')