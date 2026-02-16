# Task: gen-strv-anagram-7139 | Score: 100% | 2026-02-15T10:51:02.557696

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')