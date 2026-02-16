# Task: gen-strv-anagram-3008 | Score: 100% | 2026-02-13T21:49:10.671106

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')