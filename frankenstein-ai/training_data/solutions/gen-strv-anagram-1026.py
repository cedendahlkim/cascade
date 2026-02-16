# Task: gen-strv-anagram-1026 | Score: 100% | 2026-02-15T09:50:35.243826

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')