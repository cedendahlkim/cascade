# Task: gen-strv-anagram-7982 | Score: 100% | 2026-02-13T18:29:03.684342

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')