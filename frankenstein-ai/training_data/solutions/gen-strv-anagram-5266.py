# Task: gen-strv-anagram-5266 | Score: 100% | 2026-02-15T09:01:13.186148

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')