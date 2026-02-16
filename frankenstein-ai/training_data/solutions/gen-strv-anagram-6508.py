# Task: gen-strv-anagram-6508 | Score: 100% | 2026-02-13T17:36:34.695248

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')