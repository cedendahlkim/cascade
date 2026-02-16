# Task: gen-strv-anagram-1574 | Score: 100% | 2026-02-13T21:08:18.429573

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')