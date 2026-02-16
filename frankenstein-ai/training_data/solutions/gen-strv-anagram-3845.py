# Task: gen-strv-anagram-3845 | Score: 100% | 2026-02-13T18:37:44.352381

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')