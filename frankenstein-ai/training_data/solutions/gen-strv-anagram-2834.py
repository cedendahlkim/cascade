# Task: gen-strv-anagram-2834 | Score: 100% | 2026-02-17T20:00:28.095337

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')