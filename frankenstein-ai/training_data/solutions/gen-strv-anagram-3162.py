# Task: gen-strv-anagram-3162 | Score: 100% | 2026-02-13T16:27:12.980161

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')