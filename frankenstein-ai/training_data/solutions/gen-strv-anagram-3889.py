# Task: gen-strv-anagram-3889 | Score: 100% | 2026-02-13T18:33:53.149518

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')