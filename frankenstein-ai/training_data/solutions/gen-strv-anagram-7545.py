# Task: gen-strv-anagram-7545 | Score: 100% | 2026-02-15T10:08:54.760486

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')