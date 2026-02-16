# Task: gen-strv-anagram-2985 | Score: 100% | 2026-02-13T21:49:08.876751

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')