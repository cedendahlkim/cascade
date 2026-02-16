# Task: gen-strv-anagram-6644 | Score: 100% | 2026-02-15T10:51:04.619104

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')