# Task: gen-strv-anagram-7909 | Score: 100% | 2026-02-15T13:01:14.776779

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')