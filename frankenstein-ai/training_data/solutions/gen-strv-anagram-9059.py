# Task: gen-strv-anagram-9059 | Score: 100% | 2026-02-13T21:49:09.496503

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')