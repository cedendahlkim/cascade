# Task: gen-strv-anagram-8424 | Score: 100% | 2026-02-14T12:28:32.428421

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')