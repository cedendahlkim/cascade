# Task: gen-strv-anagram-1024 | Score: 100% | 2026-02-15T10:09:55.404164

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')