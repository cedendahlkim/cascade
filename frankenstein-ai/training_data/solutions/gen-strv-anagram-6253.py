# Task: gen-strv-anagram-6253 | Score: 100% | 2026-02-14T12:37:17.161114

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')