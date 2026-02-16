# Task: gen-strv-anagram-6483 | Score: 100% | 2026-02-13T19:48:24.292088

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')