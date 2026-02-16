# Task: gen-strv-anagram-3920 | Score: 100% | 2026-02-15T08:05:40.677285

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')