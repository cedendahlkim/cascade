# Task: gen-strv-anagram-4796 | Score: 100% | 2026-02-13T10:39:34.032107

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')