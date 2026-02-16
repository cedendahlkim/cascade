# Task: gen-strv-anagram-3306 | Score: 100% | 2026-02-15T10:27:54.773903

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')