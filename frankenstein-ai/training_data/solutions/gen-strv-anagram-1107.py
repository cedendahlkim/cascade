# Task: gen-strv-anagram-1107 | Score: 100% | 2026-02-13T09:16:59.885045

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')