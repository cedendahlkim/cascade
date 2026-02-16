# Task: gen-strv-anagram-7799 | Score: 100% | 2026-02-14T12:48:39.197199

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')