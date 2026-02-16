# Task: gen-strv-anagram-3292 | Score: 100% | 2026-02-15T10:08:55.763609

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')