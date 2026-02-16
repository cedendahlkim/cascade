# Task: gen-strv-anagram-6573 | Score: 100% | 2026-02-14T12:05:25.444048

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')