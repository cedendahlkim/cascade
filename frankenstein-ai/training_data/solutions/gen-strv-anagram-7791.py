# Task: gen-strv-anagram-7791 | Score: 100% | 2026-02-14T12:28:39.602383

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')