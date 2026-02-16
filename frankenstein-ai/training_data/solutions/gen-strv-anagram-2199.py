# Task: gen-strv-anagram-2199 | Score: 100% | 2026-02-15T09:33:57.385872

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')