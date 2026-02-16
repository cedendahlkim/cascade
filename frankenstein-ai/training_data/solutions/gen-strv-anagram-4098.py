# Task: gen-strv-anagram-4098 | Score: 100% | 2026-02-13T19:14:54.149892

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')