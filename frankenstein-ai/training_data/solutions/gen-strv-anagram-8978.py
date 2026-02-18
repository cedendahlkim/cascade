# Task: gen-strv-anagram-8978 | Score: 100% | 2026-02-17T20:08:47.212234

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')