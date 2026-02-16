# Task: gen-strv-anagram-8951 | Score: 100% | 2026-02-14T12:28:38.907108

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')