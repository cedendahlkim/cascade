# Task: gen-strv-anagram-5024 | Score: 100% | 2026-02-17T20:14:21.151448

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')