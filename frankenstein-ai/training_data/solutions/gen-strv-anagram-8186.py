# Task: gen-strv-anagram-8186 | Score: 100% | 2026-02-15T13:01:05.883422

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')