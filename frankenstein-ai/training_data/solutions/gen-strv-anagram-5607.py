# Task: gen-strv-anagram-5607 | Score: 100% | 2026-02-13T20:01:45.798529

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')