# Task: gen-strv-anagram-9837 | Score: 100% | 2026-02-13T13:21:51.423741

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')