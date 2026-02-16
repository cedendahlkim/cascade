# Task: gen-strv-anagram-2130 | Score: 100% | 2026-02-13T21:08:17.246539

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')