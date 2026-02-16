# Task: gen-strv-anagram-6214 | Score: 100% | 2026-02-14T13:26:06.251352

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')