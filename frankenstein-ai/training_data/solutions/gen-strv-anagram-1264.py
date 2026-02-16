# Task: gen-strv-anagram-1264 | Score: 100% | 2026-02-13T16:47:53.641086

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')