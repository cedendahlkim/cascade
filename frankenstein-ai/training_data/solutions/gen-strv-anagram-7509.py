# Task: gen-strv-anagram-7509 | Score: 100% | 2026-02-13T14:01:38.627238

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')