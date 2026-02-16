# Task: gen-strv-anagram-9733 | Score: 100% | 2026-02-13T19:35:11.100011

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')