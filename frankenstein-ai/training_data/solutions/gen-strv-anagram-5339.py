# Task: gen-strv-anagram-5339 | Score: 100% | 2026-02-13T15:46:47.697212

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')