# Task: gen-strv-anagram-1925 | Score: 100% | 2026-02-15T08:23:39.287793

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')