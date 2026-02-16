# Task: gen-strv-anagram-4277 | Score: 100% | 2026-02-13T20:50:37.083927

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')