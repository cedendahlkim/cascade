# Task: gen-strv-anagram-4614 | Score: 100% | 2026-02-17T20:14:16.221311

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')