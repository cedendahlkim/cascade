# Task: gen-strv-anagram-2410 | Score: 100% | 2026-02-13T15:46:46.974888

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')