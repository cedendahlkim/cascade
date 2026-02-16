# Task: gen-strv-anagram-2311 | Score: 100% | 2026-02-15T10:08:56.101053

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')