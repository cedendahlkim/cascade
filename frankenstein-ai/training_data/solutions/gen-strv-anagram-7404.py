# Task: gen-strv-anagram-7404 | Score: 100% | 2026-02-15T09:16:25.212177

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')