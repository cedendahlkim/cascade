# Task: gen-strv-anagram-1381 | Score: 100% | 2026-02-15T13:59:55.361189

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')