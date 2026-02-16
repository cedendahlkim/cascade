# Task: gen-strv-anagram-9898 | Score: 100% | 2026-02-14T12:20:37.236438

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')