# Task: gen-strv-anagram-3118 | Score: 100% | 2026-02-17T20:08:46.802710

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')