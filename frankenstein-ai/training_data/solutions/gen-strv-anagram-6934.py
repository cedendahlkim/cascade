# Task: gen-strv-anagram-6934 | Score: 100% | 2026-02-14T13:12:17.059276

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')