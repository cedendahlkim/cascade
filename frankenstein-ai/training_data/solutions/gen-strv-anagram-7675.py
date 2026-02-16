# Task: gen-strv-anagram-7675 | Score: 100% | 2026-02-14T12:28:44.318296

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')