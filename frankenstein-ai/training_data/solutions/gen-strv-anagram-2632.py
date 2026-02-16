# Task: gen-strv-anagram-2632 | Score: 100% | 2026-02-14T13:41:05.703160

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')