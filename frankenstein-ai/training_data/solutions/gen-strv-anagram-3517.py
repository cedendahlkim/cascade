# Task: gen-strv-anagram-3517 | Score: 100% | 2026-02-15T10:09:34.531446

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')