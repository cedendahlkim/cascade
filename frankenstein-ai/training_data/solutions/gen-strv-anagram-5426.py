# Task: gen-strv-anagram-5426 | Score: 100% | 2026-02-15T12:02:42.428257

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')