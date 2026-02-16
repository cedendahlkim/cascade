# Task: gen-strv-anagram-5251 | Score: 100% | 2026-02-15T08:14:38.639452

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')