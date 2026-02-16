# Task: gen-strv-anagram-4460 | Score: 100% | 2026-02-15T08:14:36.971427

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')