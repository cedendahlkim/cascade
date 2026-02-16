# Task: gen-strv-anagram-4938 | Score: 100% | 2026-02-15T10:51:03.181042

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')