# Task: gen-strv-anagram-3197 | Score: 100% | 2026-02-15T08:15:08.327246

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')