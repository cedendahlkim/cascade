# Task: gen-strv-anagram-3031 | Score: 100% | 2026-02-13T18:19:31.621882

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')